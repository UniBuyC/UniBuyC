import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// En el celular la sesión va en el almacenamiento seguro; en el navegador, en localStorage
const storage = {
  setItemAsync: async (key: string, value: string) =>
    Platform.OS === 'web' ? localStorage.setItem(key, value) : SecureStore.setItemAsync(key, value),
  getItemAsync: async (key: string) =>
    Platform.OS === 'web' ? localStorage.getItem(key) : SecureStore.getItemAsync(key),
  deleteItemAsync: async (key: string) =>
    Platform.OS === 'web' ? localStorage.removeItem(key) : SecureStore.deleteItemAsync(key),
};

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
    await storage.setItemAsync('token', token);
    await storage.setItemAsync('user', JSON.stringify(user));
    
    // 2. Configurar axios para usar este token en el futuro
    // (Opcional, lo implementaremos si necesitamos rutas protegidas)
    
    // 3. Actualizar estado de la App
    set({ token, user, isLoading: false });
  },

  logout: async () => {
    await storage.deleteItemAsync('token');
    await storage.deleteItemAsync('user');
    set({ token: null, user: null, isLoading: false });
  },

  checkSession: async () => {
    try {
      const token = await storage.getItemAsync('token');
      const userStr = await storage.getItemAsync('user');
      
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
