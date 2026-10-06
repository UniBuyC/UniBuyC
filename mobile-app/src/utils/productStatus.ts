import { ProductStatus } from '../types';

// Texto y colores de la etiqueta de cada estado
export const STATUS_LABEL: Record<ProductStatus, { text: string; color: string; background: string }> = {
  AVAILABLE: { text: 'Disponible', color: '#059669', background: '#ECFDF5' },
  SOLD_OUT: { text: 'Agotado', color: '#B45309', background: '#FEF3C7' },
  SOLD: { text: 'Vendido', color: '#6B7280', background: '#F3F4F6' },
};
