import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

// Campos que se pueden mostrar públicamente (nunca la contraseña)
const PUBLIC_FIELDS = {
  id: true,
  email: true,
  matricula: true,
  fullName: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { password, ...userData } = createUserDto;

    // 1. Encriptar la contraseña (Hashing)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    try {
      // 2. Guardar en Base de Datos
      const user = await this.prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
        },
      });

      // 3. Retornar el usuario sin la contraseña
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...result } = user;
      return result;
    } catch (error) {
      // Manejo de errores seguro
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.code === 'P2002') {
        throw new ConflictException(
          'El email o matrícula ya están registrados',
        );
      }
      throw new InternalServerErrorException();
    }
  }

  findAll() {
    return this.prisma.user.findMany({ select: PUBLIC_FIELDS });
  }

  // Solo para el login: incluye el hash de la contraseña
  findByEmailWithPassword(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  // Usuarios registrados con sus estadísticas de vendedor, con búsqueda opcional
  async findSellers(search?: string) {
    const term = search?.trim();
    const users = await this.prisma.user.findMany({
      where: term
        ? {
            OR: [
              { fullName: { contains: term, mode: 'insensitive' } },
              { matricula: { contains: term } },
            ],
          }
        : undefined,
      select: {
        id: true,
        fullName: true,
        matricula: true,
        createdAt: true,
        _count: { select: { products: true } },
      },
      orderBy: { fullName: 'asc' },
    });

    // Calificación del vendedor = promedio de las calificaciones de sus productos
    const ratings = await this.prisma.rating.findMany({
      where: { product: { sellerId: { in: users.map((u) => u.id) } } },
      select: { value: true, product: { select: { sellerId: true } } },
    });
    const bySeller = new Map<string, { sum: number; count: number }>();
    for (const r of ratings) {
      const s = bySeller.get(r.product.sellerId) ?? { sum: 0, count: 0 };
      s.sum += r.value;
      s.count += 1;
      bySeller.set(r.product.sellerId, s);
    }

    return users
      .map(({ _count, ...user }) => {
        const s = bySeller.get(user.id);
        return {
          ...user,
          productCount: _count.products,
          ratingAverage: s ? s.sum / s.count : 0,
          ratingCount: s?.count ?? 0,
        };
      })
      // Primero quienes tienen más productos publicados
      .sort((a, b) => b.productCount - a.productCount);
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id }, select: PUBLIC_FIELDS });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(id: string, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: string) {
    return `This action removes a #${id} user`;
  }
}
