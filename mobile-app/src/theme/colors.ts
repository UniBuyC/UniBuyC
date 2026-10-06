// Paleta de la app en modo claro y oscuro. Las pantallas usan estos nombres en lugar de colores fijos.
export const lightColors = {
  primary: '#10B981',
  primaryText: '#059669', // Verde para texto sobre fondos claros
  primarySoft: '#ECFDF5', // Fondo verde muy suave (etiquetas, recuadros)
  primaryMuted: '#A7F3D0', // Verde apagado (botón desactivado, bordes)
  onPrimary: '#FFFFFF', // Texto sobre el verde

  background: '#F9FAFB', // Fondo de pantalla
  card: '#FFFFFF', // Tarjetas, encabezados, barra de pestañas
  muted: '#F3F4F6', // Campos de texto, pastillas, fondos secundarios
  surface: '#E5E7EB', // Siluetas de carga, botones desactivados
  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  text: '#111827',
  textSecondary: '#374151',
  textTertiary: '#4B5563',
  textMuted: '#6B7280',
  textFaint: '#9CA3AF',
  textDisabled: '#D1D5DB',

  danger: '#EF4444',
  dangerText: '#DC2626',
  dangerSoft: '#FEE2E2',
  info: '#2563EB',
  infoSoft: '#EFF6FF',
  star: '#F59E0B',
};

export type ThemeColors = typeof lightColors;

export const darkColors: ThemeColors = {
  primary: '#10B981',
  primaryText: '#34D399',
  primarySoft: '#0E2A22',
  primaryMuted: '#1F5C48',
  onPrimary: '#FFFFFF',

  background: '#0B0F14',
  card: '#151A21',
  muted: '#1E252E',
  surface: '#2A323C',
  border: '#2A323C',
  borderLight: '#1E252E',

  text: '#F3F4F6',
  textSecondary: '#D1D5DB',
  textTertiary: '#C4C9D1',
  textMuted: '#9CA3AF',
  textFaint: '#6B7280',
  textDisabled: '#4B5563',

  danger: '#F87171',
  dangerText: '#F87171',
  dangerSoft: '#3B1D1D',
  info: '#60A5FA',
  infoSoft: '#172235',
  star: '#FBBF24',
};
