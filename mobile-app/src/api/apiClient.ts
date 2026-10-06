import axios from 'axios';
export const API_URL = 'http://192.168.68.64:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Esto sirve para depurar: nos avisa en consola si la petición sale bien o mal
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('API Error:', error.response ? error.response.data : error.message);
    return Promise.reject(error);
  }
);

// Las fotos subidas se guardan como "/uploads/..." en el servidor; las demás son URLs completas
export const resolveImageUrl = (image?: string | null) => {
  if (!image) return 'https://placehold.co/600x400/png';
  return image.startsWith('/') ? `${API_URL}${image}` : image;
};
