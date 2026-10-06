import { Alert } from 'react-native';
import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './AppNavigator';

// Referencia global para navegar desde fuera de las pantallas (avisos, cerrar sesión)
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Regresa al Login limpiando el historial (para cerrar sesión o salir del modo invitado)
export const goToLogin = () => {
  if (navigationRef.isReady()) {
    navigationRef.reset({ index: 0, routes: [{ name: 'Login' }] });
  }
};

// Para invitados: explica por qué necesita cuenta y ofrece iniciar sesión
export const askToLogin = (reason: string) => {
  Alert.alert('Necesitas una cuenta', reason, [
    { text: 'Ahora no', style: 'cancel' },
    { text: 'Iniciar sesión', onPress: goToLogin },
  ]);
};
