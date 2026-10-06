import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api } from '../api/apiClient';

interface User {
  id: string;
  email: string;
  fullName: string;
  matricula: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true, // Empezamos cargando para verificar si ya había sesión

  login: async (token, user) => {
    // 1. Guardar en memoria del celular (persistente)
    await SecureStore.setItemAsync('token', token);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    
    // 2. Configurar axios para usar este token en el futuro
    // (Opcional, lo implementaremos si necesitamos rutas protegidas)
    
    // 3. Actualizar estado de la App
    set({ token, user, isLoading: false });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    set({ token: null, user: null, isLoading: false });
  },

  checkSession: async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const userStr = await SecureStore.getItemAsync('user');
      
      if (token && userStr) {
        set({ token, user: JSON.parse(userStr), isLoading: false });
      } else {
        set({ token: null, user: null, isLoading: false });
      }
    } catch (error) {
      set({ token: null, user: null, isLoading: false });
    }
  }
}));
