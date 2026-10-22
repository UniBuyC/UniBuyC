import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // Totales para el resumen del panel
  async stats() {
    const now = new Date();
    const [users, products, activeProducts, conversations, messages, ratings, suspended, pendingReports] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.product.count(),
      this.prisma.product.count({ where: { deletedAt: null, status: { not: 'SOLD' } } }),
      this.prisma.conversation.count(),
      this.prisma.message.count(),
      this.prisma.rating.count(),
      this.prisma.user.count({ where: { OR: [{ bannedAt: { not: null } }, { suspendedUntil: { gt: now } }] } }),
      this.prisma.report.count({ where: { status: 'PENDING', product: { deletedAt: null } } }),
    ]);
    return { users, products, activeProducts, conversations, messages, ratings, suspended, pendingReports };
  }

  // Usuarios con sus datos de contacto y actividad (nunca la contraseña)
  async listUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        matricula: true,
        role: true,
        createdAt: true,
        suspendedUntil: true,
        bannedAt: true,
        suspensionReason: true,
        _count: {
          select: {
            products: { where: { deletedAt: null } },
            conversationsBuy: true,
            conversationsSell: true,
            messages: true,
          },
        },
      },
    });
    const now = new Date();
    return users.map(({ _count, ...u }) => ({
      ...u,
      // 'banned' (permanente), 'suspended' (temporal vigente) o 'active'
      status: u.bannedAt ? 'banned' : u.suspendedUntil && u.suspendedUntil > now ? 'suspended' : 'active',
      productCount: _count.products,
      conversationCount: _count.conversationsBuy + _count.conversationsSell,
      messageCount: _count.messages,
    }));
  }

  async resetPassword(userId: string, password: string) {
    await this.findOrFail(userId);
    const hashed = await bcrypt.hash(password, await bcrypt.genSalt(10));
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    return { ok: true };
  }

  // Borra al usuario y todo lo que depende de él: sus productos (con sus calificaciones),
  // sus calificaciones y las conversaciones donde participa, con todos sus mensajes.
  async deleteUser(userId: string, adminId: string) {
    if (userId === adminId) {
      throw new BadRequestException('No puedes eliminar tu propia cuenta de administrador');
    }
    const user = await this.findOrFail(userId);

    const conversations = await this.prisma.conversation.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      select: { id: true },
    });
    const conversationIds = conversations.map((c) => c.id);

    await this.prisma.$transaction([
      // Mensajes de sus conversaciones y los que haya enviado en cualquier otra
      this.prisma.message.deleteMany({
        where: { OR: [{ conversationId: { in: conversationIds } }, { senderId: userId }] },
      }),
      this.prisma.conversation.deleteMany({ where: { id: { in: conversationIds } } }),
      // Calificaciones de sus productos y las que él dio (las de usuario también caen en cascada)
      this.prisma.rating.deleteMany({
        where: { OR: [{ userId }, { product: { sellerId: userId } }] },
      }),
      this.prisma.product.deleteMany({ where: { sellerId: userId } }),
      this.prisma.user.delete({ where: { id: userId } }),
    ]);

    return { ok: true, deleted: user.fullName };
  }

  // --- MODERACIÓN ---

  // Suspensión temporal: no puede entrar y sus publicaciones se ocultan hasta la fecha
  async suspend(userId: string, days: number, reason: string | undefined, adminId: string) {
    await this.assertModeratable(userId, adminId);
    const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await this.prisma.user.update({
      where: { id: userId },
      data: { suspendedUntil: until, bannedAt: null, suspensionReason: reason?.trim() || null },
    });
    return { ok: true, suspendedUntil: until };
  }

  // Bloqueo permanente: además se bloquean su correo y matrícula para que no vuelva a registrarse
  async ban(userId: string, reason: string | undefined, adminId: string) {
    const user = await this.assertModeratable(userId, adminId);
    const cleanReason = reason?.trim() || null;
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { bannedAt: new Date(), suspendedUntil: null, suspensionReason: cleanReason },
      }),
      this.prisma.bannedIdentity.create({
        data: { email: user.email.toLowerCase(), matricula: user.matricula, reason: cleanReason },
      }),
    ]);
    return { ok: true };
  }

  // Quita la suspensión o el bloqueo (y libera su correo y matrícula)
  async reactivate(userId: string) {
    const user = await this.findOrFail(userId);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { bannedAt: null, suspendedUntil: null, suspensionReason: null },
      }),
      this.prisma.bannedIdentity.deleteMany({
        where: { OR: [{ email: user.email.toLowerCase() }, { matricula: user.matricula }] },
      }),
    ]);
    return { ok: true };
  }

  // Todas las publicaciones (incluidas vendidas), sin las ya eliminadas
  async listProducts() {
    const products = await this.prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        price: true,
        category: true,
        image: true,
        status: true,
        createdAt: true,
        seller: { select: { id: true, fullName: true, email: true } },
        _count: {
          select: { conversations: true, ratings: true, reports: { where: { status: 'PENDING' } } },
        },
      },
    });
    return products.map(({ _count, ...p }) => ({
      ...p,
      conversationCount: _count.conversations,
      ratingCount: _count.ratings,
      pendingReports: _count.reports,
    }));
  }

  // Ficha completa de una publicación (no incluye el contenido de los chats, que es privado)
  async getProduct(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        seller: {
          select: { id: true, fullName: true, email: true, matricula: true, suspendedUntil: true, bannedAt: true },
        },
        reports: {
          orderBy: { createdAt: 'desc' },
          include: { reporter: { select: { id: true, fullName: true, email: true } } },
        },
        _count: { select: { conversations: true } },
      },
    });
    if (!product) throw new NotFoundException('Publicación no encontrada');
    const rating = await this.prisma.rating.aggregate({
      where: { productId },
      _avg: { value: true },
      _count: { value: true },
    });
    const { _count, ...rest } = product;
    return {
      ...rest,
      conversationCount: _count.conversations,
      ratingAverage: rating._avg.value ?? 0,
      ratingCount: rating._count.value,
    };
  }

  // Reportes (por defecto los pendientes de publicaciones que siguen activas)
  async listReports(status = 'PENDING') {
    const reports = await this.prisma.report.findMany({
      where: status === 'ALL' ? {} : { status, ...(status === 'PENDING' ? { product: { deletedAt: null } } : {}) },
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { id: true, fullName: true, email: true } },
        product: {
          select: {
            id: true,
            title: true,
            image: true,
            price: true,
            deletedAt: true,
            seller: { select: { id: true, fullName: true, email: true, matricula: true, role: true, suspendedUntil: true, bannedAt: true } },
          },
        },
      },
    });
    return reports;
  }

  async resolveReport(reportId: string, status: 'RESOLVED' | 'DISMISSED', resolution?: string) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Reporte no encontrado');
    await this.prisma.report.update({
      where: { id: reportId },
      data: { status, resolution: resolution?.trim() || null, resolvedAt: new Date() },
    });
    return { ok: true };
  }

  // Igual que cuando el vendedor la elimina: se oculta y sus chats quedan como registro
  async deleteProduct(productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.deletedAt) throw new NotFoundException('Publicación no encontrada');
    await this.prisma.$transaction([
      this.prisma.product.update({ where: { id: productId }, data: { deletedAt: new Date() } }),
      // Sus reportes pendientes quedan resueltos
      this.prisma.report.updateMany({
        where: { productId, status: 'PENDING' },
        data: { status: 'RESOLVED', resolution: 'Publicación eliminada', resolvedAt: new Date() },
      }),
    ]);
    return { ok: true, deleted: product.title };
  }

  // No se puede suspender a uno mismo ni a otro administrador
  private async assertModeratable(userId: string, adminId: string) {
    if (userId === adminId) throw new BadRequestException('No puedes suspender tu propia cuenta');
    const user = await this.findOrFail(userId);
    if (user.role === 'ADMIN') throw new BadRequestException('No puedes suspender a otro administrador');
    return user;
  }

  private async findOrFail(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }
}
