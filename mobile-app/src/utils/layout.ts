import { Dimensions, Platform } from 'react-native';

// En computadora la versión web se muestra en una columna del ancho de un celular
export const WEB_MAX_WIDTH = 480;

// Ancho útil de la app (en web nunca más que la columna)
export const appWidth = () => {
  const { width } = Dimensions.get('window');
  return Platform.OS === 'web' ? Math.min(width, WEB_MAX_WIDTH) : width;
};
