import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Product, ProductStatus } from '@prisma/client';

// Por qué una conversación ya no acepta mensajes (null = abierta)
export type LockReason = 'deleted' | 'sold' | null;

// El chat se cierra si el producto se eliminó o se vendió; los mensajes quedan como registro
const lockReason = (product: Product | null): LockReason => {
  if (!product || product.deletedAt) return 'deleted';
  if (product.status === ProductStatus.SOLD) return 'sold';
  return null;
};

// Datos del producto que se muestran en el chat (aunque ya se haya eliminado)
const PRODUCT_PREVIEW = {
  select: {
    id: true,
    title: true,
    description: true,
    category: true,
    image: true,
    price: true,
    sellerId: true,
    status: true,
    soldAt: true,
    deletedAt: true,
  },
};

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  // 1. Iniciar o recuperar chat
  async startConversation(userId: string, productId: string) {
    // Primero buscamos el producto para saber quién es el vendedor
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.deletedAt) throw new NotFoundException('Producto no encontrado');
    if (product.sellerId === userId)
      throw new BadRequestException('No puedes chatear contigo mismo');

    // Buscamos si ya existe la conversación
    const existing = await this.prisma.conversation.findFirst({
      where: {
        buyerId: userId,
        sellerId: product.sellerId,
        productId: productId,
      },
    });

    if (existing) return existing;

    // Solo se pueden iniciar chats nuevos sobre productos disponibles
    if (product.status !== ProductStatus.AVAILABLE) {
      throw new BadRequestException(
        product.status === ProductStatus.SOLD ? 'Este producto ya se vendió' : 'Este producto está agotado',
      );
    }

    // Si no existe, la creamos
    return this.prisma.conversation.create({
      data: {
        buyerId: userId,
        sellerId: product.sellerId,
        productId: productId,
      },
    });
  }

  // 2. Obtener mis conversaciones (las más recientes primero, con no leídos)
  async getUserConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        product: PRODUCT_PREVIEW,
        buyer: { select: { fullName: true } },
        seller: { select: { fullName: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Traemos solo el último mensaje para la vista previa
        },
        _count: {
          select: {
            // Mensajes que me enviaron y todavía no abro
            messages: { where: { readAt: null, senderId: { not: userId } } },
          },
        },
      },
    });

    return conversations.map(({ _count, ...conversation }) => ({
      ...conversation,
      unreadCount: _count.messages,
      lockReason: lockReason(conversation.product as Product | null),
    }));
  }

  // Datos de una conversación: producto, participantes y si está cerrada
  async getConversation(userId: string, conversationId: string) {
    await this.assertParticipant(userId, conversationId);
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        product: PRODUCT_PREVIEW,
        buyer: { select: { fullName: true } },
        seller: { select: { fullName: true } },
      },
    });
    return {
      ...conversation,
      lockReason: lockReason(conversation!.product as Product | null),
    };
  }

  // 3. Enviar mensaje
  async sendMessage(userId: string, conversationId: string, content: string) {
    if (!content?.trim()) {
      throw new BadRequestException('El mensaje no puede estar vacío');
    }
    const conversation = await this.assertParticipant(userId, conversationId);
    const reason = lockReason(conversation.product);
    if (reason) {
      throw new ForbiddenException(
        reason === 'sold'
          ? 'El producto se vendió: esta conversación quedó cerrada'
          : 'La publicación se eliminó: esta conversación quedó cerrada',
      );
    }

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          content: content.trim(),
          senderId: userId,
          conversationId,
        },
      }),
      // Tocamos la conversación para que suba al inicio de la lista
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);
    return message;
  }

  // 4. Leer mensajes de un chat (y marcarlos como leídos)
  async getMessages(userId: string, conversationId: string) {
    await this.assertParticipant(userId, conversationId);

    await this.prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    });

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' }, // Los más viejos arriba
      include: {
        sender: { select: { id: true, fullName: true } },
      },
    });
  }

  private async assertParticipant(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { product: true },
    });
    if (!conversation) throw new NotFoundException('Conversación no encontrada');
    if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
      throw new ForbiddenException('No participas en esta conversación');
    }
    return conversation;
  }
}
