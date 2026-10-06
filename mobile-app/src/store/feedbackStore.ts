import { create } from 'zustand';

export type Tone = 'success' | 'error' | 'warning' | 'info';
export type DialogIcon = Tone | 'danger' | 'login' | 'sold' | 'celebrate';

export interface ToastData {
  id: number;
  tone: Tone;
  title: string;
  message?: string;
}

export interface DialogData {
  icon: DialogIcon;
  title: string;
  message?: string;
  confirmText: string;
  cancelText?: string; // Sin cancelar = aviso con un solo botón
  destructive?: boolean;
  resolve: (confirmed: boolean) => void;
}

export interface SheetOption {
  label: string;
  icon?: 'camera' | 'image';
  value: string;
}

export interface SheetData {
  title: string;
  message?: string;
  options: SheetOption[];
  resolve: (value: string | null) => void;
}

interface FeedbackState {
  toast: ToastData | null;
  dialog: DialogData | null;
  sheet: SheetData | null;
  showToast: (toast: Omit<ToastData, 'id'>) => void;
  hideToast: (id: number) => void;
  closeDialog: (confirmed: boolean) => void;
  closeSheet: (value: string | null) => void;
}

let nextId = 1;

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  toast: null,
  dialog: null,
  sheet: null,
  // Un aviso nuevo reemplaza al anterior (no se apilan)
  showToast: (toast) => set({ toast: { ...toast, id: nextId++ } }),
  hideToast: (id) => {
    if (get().toast?.id === id) set({ toast: null });
  },
  closeDialog: (confirmed) => {
    get().dialog?.resolve(confirmed);
    set({ dialog: null });
  },
  closeSheet: (value) => {
    get().sheet?.resolve(value);
    set({ sheet: null });
  },
}));

// --- API para las pantallas ---

const show = (tone: Tone) => (title: string, message?: string) =>
  useFeedbackStore.getState().showToast({ tone, title, message });

// Avisos rápidos que bajan desde arriba y se cierran solos
export const toast = {
  success: show('success'),
  error: show('error'),
  warning: show('warning'),
  info: show('info'),
};

// Mensaje de error del backend (puede venir como texto o como lista)
export const apiErrorMessage = (error: any, fallback: string) => {
  const msg = error?.response?.data?.message;
  if (Array.isArray(msg)) return msg[0];
  return msg || fallback;
};

// Cuadro de confirmación; responde true si la persona confirma
export const confirm = (options: Omit<DialogData, 'resolve'>) =>
  new Promise<boolean>((resolve) => {
    // Si había uno abierto, se cancela
    useFeedbackStore.getState().dialog?.resolve(false);
    useFeedbackStore.setState({ dialog: { ...options, resolve } });
  });

// Hoja desde abajo para elegir una opción; responde su value o null si se cancela
export const chooseOption = (options: Omit<SheetData, 'resolve'>) =>
  new Promise<string | null>((resolve) => {
    useFeedbackStore.getState().sheet?.resolve(null);
    useFeedbackStore.setState({ sheet: { ...options, resolve } });
  });
