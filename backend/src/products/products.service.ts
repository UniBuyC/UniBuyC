import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // Recibimos los datos del producto Y el ID del usuario vendedor
  async create(createProductDto: CreateProductDto, sellerId: string) {
    return this.prisma.product.create({
      data: {
        ...createProductDto,
        sellerId: sellerId, // Vinculación mágica
      },
    });
  }

  async findAll() {
    // Incluimos los datos del vendedor (nombre) para mostrarlos en la app
    const products = await this.prisma.product.findMany({
      include: {
        seller: {
          select: { fullName: true, matricula: true },
        },
      },
      orderBy: {
        createdAt: 'desc', // Los más nuevos primero
      },
    });
    return this.withRatings(products);
  }

  // Productos del usuario que inició sesión (para "Mis Publicaciones")
  async findMine(sellerId: string) {
    const products = await this.prisma.product.findMany({
      where: { sellerId },
      include: {
        seller: {
          select: { fullName: true, matricula: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return this.withRatings(products);
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        seller: { select: { fullName: true, matricula: true } },
      },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    const [withRating] = await this.withRatings([product]);
    return withRating;
  }

  async update(id: string, updateProductDto: UpdateProductDto, userId: string) {
    await this.assertOwner(id, userId);
    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  async remove(id: string, userId: string) {
    await this.assertOwner(id, userId);
    return this.prisma.product.delete({ where: { id } });
  }

  // --- CALIFICACIONES ---

  // Promedio, total y (si hay sesión) la calificación del usuario
  async getRating(productId: string, userId?: string) {
    const stats = await this.prisma.rating.aggregate({
      where: { productId },
      _avg: { value: true },
      _count: { value: true },
    });
    const mine = userId
      ? await this.prisma.rating.findUnique({
          where: { userId_productId: { userId, productId } },
        })
      : null;
    return {
      average: stats._avg.value ?? 0,
      count: stats._count.value,
      myRating: mine?.value ?? null,
    };
  }

  // Crea o actualiza la calificación del usuario (una por producto)
  async rate(productId: string, userId: string, value: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    if (product.sellerId === userId) {
      throw new BadRequestException('No puedes calificar tu propio producto');
    }
    await this.prisma.rating.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId, value },
      update: { value },
    });
    return this.getRating(productId, userId);
  }

  private async assertOwner(productId: string, userId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    if (product.sellerId !== userId) {
      throw new ForbiddenException('Solo el vendedor puede modificar este producto');
    }
  }

  // Agrega ratingAverage y ratingCount a cada producto
  private async withRatings<T extends { id: string }>(products: T[]) {
    const stats = await this.prisma.rating.groupBy({
      by: ['productId'],
      where: { productId: { in: products.map((p) => p.id) } },
      _avg: { value: true },
      _count: { value: true },
    });
    const byProduct = new Map(stats.map((s) => [s.productId, s]));
    return products.map((p) => ({
      ...p,
      ratingAverage: byProduct.get(p.id)?._avg.value ?? 0,
      ratingCount: byProduct.get(p.id)?._count.value ?? 0,
    }));
  }
}
