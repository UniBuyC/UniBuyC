import { create } from 'zustand';
import { getMyConversations } from '../api/chat';
import { Conversation, Message } from '../types';

export interface IncomingMessage {
  conversationId: string;
  senderName: string;
  content: string;
}

interface ChatState {
  conversations: Conversation[];
  unreadTotal: number;
  loaded: boolean;
  // Chat que está abierto en pantalla (no avisamos de sus mensajes)
  activeConversationId: string | null;
  // Último aviso para mostrar en el banner
  incoming: IncomingMessage | null;
  refresh: (token: string, myId: string) => Promise<void>;
  setActiveConversation: (id: string | null) => void;
  dismissIncoming: () => void;
  reset: () => void;
}

// Último mensaje visto por conversación, para detectar mensajes nuevos entre consultas
let lastSeen = new Map<string, string>();

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  unreadTotal: 0,
  loaded: false,
  activeConversationId: null,
  incoming: null,

  refresh: async (token, myId) => {
    const conversations = await getMyConversations(token);
    const { loaded, activeConversationId } = get();

    let incoming: IncomingMessage | null = null;
    for (const chat of conversations) {
      const last: Message | undefined = chat.messages[0];
      if (!last) continue;
      const isNew = loaded && lastSeen.get(chat.id) !== last.id;
      const fromOther = last.senderId !== myId && !last.readAt;
      if (isNew && fromOther && chat.id !== activeConversationId) {
        incoming = {
          conversationId: chat.id,
          senderName: chat.buyerId === myId ? chat.seller.fullName : chat.buyer.fullName,
          content: last.content,
        };
      }
    }
    lastSeen = new Map(
      conversations.filter((c) => c.messages[0]).map((c) => [c.id, c.messages[0].id]),
    );

    set({
      conversations,
      unreadTotal: conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
      loaded: true,
      ...(incoming ? { incoming } : {}),
    });
  },

  setActiveConversation: (id) => set({ activeConversationId: id }),
  dismissIncoming: () => set({ incoming: null }),
  reset: () => {
    lastSeen = new Map();
    set({ conversations: [], unreadTotal: 0, loaded: false, activeConversationId: null, incoming: null });
  },
}));
