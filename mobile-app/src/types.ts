export interface User {
  id: string;
  email: string;
  fullName: string;
  matricula: string;
}

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
  product?: {
    title: string;
    image: string;
  };
  buyer: { fullName: string };
  seller: { fullName: string };
  messages: Message[];
  unreadCount: number;
  updatedAt: string;
}
