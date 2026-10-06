import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './AppNavigator';
import { confirm } from '../store/feedbackStore';

// Referencia global para navegar desde fuera de las pantallas (avisos, cerrar sesión)
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Regresa al Login limpiando el historial (para cerrar sesión o salir del modo invitado)
export const goToLogin = () => {
  if (navigationRef.isReady()) {
    navigationRef.reset({ index: 0, routes: [{ name: 'Login' }] });
  }
};

// Para invitados: explica por qué necesita cuenta y ofrece iniciar sesión
export const askToLogin = async (reason: string) => {
  const ok = await confirm({
    icon: 'login',
    title: 'Necesitas una cuenta',
    message: reason,
    confirmText: 'Iniciar sesión',
    cancelText: 'Ahora no',
  });
  if (ok) goToLogin();
};
