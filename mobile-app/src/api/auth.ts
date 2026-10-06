import { api } from './apiClient';

// Función para iniciar sesión
export const loginUser = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

// Función para registrarse
export const registerUser = async (userData: any) => {
  const response = await api.post('/users', userData);
  return response.data;
};
