import { api } from './apiClient';
import { Seller } from '../types';

// Usuarios registrados con sus estadísticas de vendedor (Público)
export const getSellers = async (search?: string): Promise<Seller[]> => {
  const response = await api.get('/users/sellers', {
    params: search?.trim() ? { search: search.trim() } : {},
  });
  return response.data;
};
