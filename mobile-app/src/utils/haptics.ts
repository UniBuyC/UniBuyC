import * as Haptics from 'expo-haptics';

// Vibraciones cortas para confirmar acciones. Si el celular no las soporta, se ignoran.
export const haptic = {
  // Toque ligero: favoritos, estrellas, enviar mensaje
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
  // Selección: cambiar pestaña o categoría
  selection: () => Haptics.selectionAsync().catch(() => {}),
  // Algo salió bien: publicar, guardar, calificar
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  // Algo falló
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {}),
};
