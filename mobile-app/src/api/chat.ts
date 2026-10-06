import { api } from './apiClient';
import { Conversation, Message } from '../types';

// 1. Iniciar chat (Al dar clic en "Contactar")
export const startChat = async (productId: string, token: string): Promise<Conversation> => {
  const response = await api.post('/chat/start', { productId }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// 2. Obtener lista de chats (Para la pestaña "Mensajes")
export const getMyConversations = async (token: string): Promise<Conversation[]> => {
  const response = await api.get('/chat', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Datos de un chat: producto y si está cerrado
export const getConversation = async (conversationId: string, token: string): Promise<Conversation> => {
  const response = await api.get(`/chat/${conversationId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// 3. Obtener mensajes de un chat específico
export const getChatMessages = async (conversationId: string, token: string): Promise<Message[]> => {
  const response = await api.get(`/chat/${conversationId}/messages`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// 4. Enviar un mensaje
export const sendMessage = async (conversationId: string, content: string, token: string): Promise<Message> => {
  const response = await api.post(`/chat/${conversationId}/messages`, { content }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
