import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// En el navegador no hay vibración: no hacemos nada
const run = (fn: () => Promise<void>) => (Platform.OS === 'web' ? undefined : fn().catch(() => {}));

// Vibraciones cortas para confirmar acciones. Si el celular no las soporta, se ignoran.
export const haptic = {
  // Toque ligero: favoritos, estrellas, enviar mensaje
  light: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  // Selección: cambiar pestaña o categoría
  selection: () => run(() => Haptics.selectionAsync()),
  // Algo salió bien: publicar, guardar, calificar
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  // Algo falló
  error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
