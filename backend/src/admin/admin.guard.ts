import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Solo deja pasar a usuarios con rol ADMIN. Se consulta en la base de datos en cada
// petición, así que quitar el rol surte efecto de inmediato (no depende del token).
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<{ user?: { id: string } }>();
    if (!req.user) throw new ForbiddenException('Se requiere sesión de administrador');
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true },
    });
    if (user?.role !== 'ADMIN') throw new ForbiddenException('Solo para administradores');
    return true;
  }
}
