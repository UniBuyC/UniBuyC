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

// Evita cerrar sesión varias veces si fallan varias peticiones a la vez
let handlingExpiredSession = false;

// Esto sirve para depurar: nos avisa en consola si la petición sale bien o mal
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('API Error:', error.response ? error.response.data : error.message);

    // 401 con token = la sesión expiró o ya no es válida: cerrar sesión y volver al login.
    // 403 ACCOUNT_SUSPENDED = un administrador suspendió la cuenta: igual, con su motivo.
    const sentToken = !!error.config?.headers?.Authorization;
    const suspended = error.response?.status === 403 && error.response?.data?.error === 'ACCOUNT_SUSPENDED';
    if ((error.response?.status === 401 || suspended) && sentToken && !handlingExpiredSession) {
      handlingExpiredSession = true;
      // require diferido para no crear dependencias circulares entre módulos
      const { useAuthStore } = require('../store/authStore');
      const { goToLogin } = require('../navigation/navigationRef');
      const { toast } = require('../store/feedbackStore');
      useAuthStore
        .getState()
        .logout()
        .then(() => {
          goToLogin();
          if (suspended) toast.error('Cuenta suspendida', error.response.data.message);
          else toast.warning('Tu sesión expiró', 'Vuelve a iniciar sesión');
        })
        .finally(() => {
          handlingExpiredSession = false;
        });
    }
    return Promise.reject(error);
  }
);

// Las fotos subidas se guardan como "/uploads/..." en el servidor; las demás son URLs completas
export const resolveImageUrl = (image?: string | null) => {
  if (!image) return 'https://placehold.co/600x400/png';
  return image.startsWith('/') ? `${API_URL}${image}` : image;
};
