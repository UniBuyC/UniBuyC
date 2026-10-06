export interface User {
  id: string;
  email: string;
  fullName: string;
  matricula: string;
}

// Disponible, agotado (temporal) o vendido (definitivo: cierra sus chats)
export type ProductStatus = 'AVAILABLE' | 'SOLD_OUT' | 'SOLD';

// Por qué un chat ya no acepta mensajes (null = abierto)
export type LockReason = 'deleted' | 'sold' | null;

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image: string;
  sellerId: string;
  seller?: {
    fullName: string;
    matricula: string;
  };
  status: ProductStatus;
  soldAt?: string | null;
  ratingAverage?: number;
  ratingCount?: number;
  createdAt?: string;
}

export interface Seller {
  id: string;
  fullName: string;
  matricula: string;
  productCount: number;
  ratingAverage: number;
  ratingCount: number;
}

export interface ProductRating {
  average: number;
  count: number;
  myRating: number | null;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  conversationId: string;
  readAt?: string | null;
  createdAt: string;
  sender?: {
    fullName: string;
  };
}

export interface Conversation {
  id: string;
  buyerId: string;
  sellerId: string;
  // Producto del chat; se conserva aunque se haya eliminado (deletedAt) como registro
  product?: (Product & { deletedAt?: string | null }) | null;
  buyer: { fullName: string };
  seller: { fullName: string };
  messages: Message[];
  unreadCount: number;
  lockReason: LockReason;
  updatedAt: string;
}
