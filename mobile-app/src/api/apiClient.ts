import axios from 'axios';
// Dirección del backend. Por defecto, el de la nube (Vercel).
// Para usar el backend local de tu Mac, crea mobile-app/.env con:
//   EXPO_PUBLIC_API_URL=http://TU_IP:3000
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://unibyc-api.vercel.app';

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
