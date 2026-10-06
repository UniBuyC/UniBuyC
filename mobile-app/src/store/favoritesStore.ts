import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'; // <--- Importamos herramientas de persistencia
import AsyncStorage from '@react-native-async-storage/async-storage'; // <--- Importamos el disco duro
import { Product } from '../types';
import { useAuthStore } from './authStore';

interface Seller {
  id: string;
  fullName: string;
  rating: number;
}

interface FavoritesList {
  products: Product[];
  sellers: Seller[];
}

interface FavoritesState {
  // Favoritos separados por cuenta (id del usuario, o 'guest' para invitados)
  lists: Record<string, FavoritesList>;
  toggleProductFavorite: (owner: string, product: Product) => void;
  toggleSellerFavorite: (owner: string, seller: Seller) => void;
}

const EMPTY: FavoritesList = { products: [], sellers: [] };

// Envolvemos todo el store en "persist"
export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      lists: {},

      toggleProductFavorite: (owner, product) => {
        const list = get().lists[owner] ?? EMPTY;
        const exists = list.products.some(p => p.id === product.id);
        const products = exists
          ? list.products.filter(p => p.id !== product.id)
          : [...list.products, product];
        set({ lists: { ...get().lists, [owner]: { ...list, products } } });
      },

      toggleSellerFavorite: (owner, seller) => {
        const list = get().lists[owner] ?? EMPTY;
        const exists = list.sellers.some(s => s.id === seller.id);
        const sellers = exists
          ? list.sellers.filter(s => s.id !== seller.id)
          : [...list.sellers, seller];
        set({ lists: { ...get().lists, [owner]: { ...list, sellers } } });
      },
    }),
    {
      name: 'unibyc-favorites-storage', // Nombre único para guardar en el celular
      storage: createJSONStorage(() => AsyncStorage), // Usamos AsyncStorage como base
      version: 1,
      // La versión 0 guardaba una sola lista para todo el celular; no sabemos de quién era
      migrate: () => ({ lists: {} }) as any,
    }
  )
);

// Favoritos de la cuenta con sesión iniciada
export const useFavorites = () => {
  const owner = useAuthStore((state) => state.user?.id ?? 'guest');
  const list = useFavoritesStore((state) => state.lists[owner]) ?? EMPTY;
  const toggleProduct = useFavoritesStore((state) => state.toggleProductFavorite);
  const toggleSeller = useFavoritesStore((state) => state.toggleSellerFavorite);

  return {
    favoriteProducts: list.products,
    favoriteSellers: list.sellers,
    isProductFavorite: (id: string) => list.products.some(p => p.id === id),
    isSellerFavorite: (id: string) => list.sellers.some(s => s.id === id),
    toggleProductFavorite: (product: Product) => toggleProduct(owner, product),
    toggleSellerFavorite: (seller: Seller) => toggleSeller(owner, seller),
  };
};
