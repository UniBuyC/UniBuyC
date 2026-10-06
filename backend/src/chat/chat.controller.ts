import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthGuard } from '@nestjs/passport';

// Definimos la interfaz para el usuario en el Request (para evitar 'any')
interface RequestWithUser {
  user: {
    id: string;
    email: string;
  };
}

@UseGuards(AuthGuard('jwt')) // 🔒 Todo el chat es privado
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // 1. Iniciar conversación (POST /chat/start)
  // Body: { productId: "uuid..." }
  @Post('start')
  startConversation(
    @Request() req: RequestWithUser,
    @Body('productId') productId: string,
  ) {
    return this.chatService.startConversation(req.user.id, productId);
  }

  // 2. Ver mis conversaciones (GET /chat)
  @Get()
  getUserConversations(@Request() req: RequestWithUser) {
    return this.chatService.getUserConversations(req.user.id);
  }

  // Datos de la conversación: producto y si está cerrada (GET /chat/:id)
  @Get(':id')
  getConversation(
    @Request() req: RequestWithUser,
    @Param('id') conversationId: string,
  ) {
    return this.chatService.getConversation(req.user.id, conversationId);
  }

  // 3. Ver mensajes de una charla (GET /chat/:id/messages) y marcarlos como leídos
  @Get(':id/messages')
  getMessages(
    @Request() req: RequestWithUser,
    @Param('id') conversationId: string,
  ) {
    return this.chatService.getMessages(req.user.id, conversationId);
  }

  // 4. Enviar mensaje (POST /chat/:id/messages)
  // Body: { content: "Hola..." }
  @Post(':id/messages')
  sendMessage(
    @Request() req: RequestWithUser,
    @Param('id') conversationId: string,
    @Body('content') content: string,
  ) {
    return this.chatService.sendMessage(req.user.id, conversationId, content);
  }
}
