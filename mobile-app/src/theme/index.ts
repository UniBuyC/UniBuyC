import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, ThemeColors } from './colors';

export type { ThemeColors } from './colors';

// 'system' sigue la configuración del celular hasta que el usuario elige uno
type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'unibyc-theme',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const useTheme = () => {
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const system = useColorScheme();
  const isDark = mode === 'dark' || (mode === 'system' && system === 'dark');
  return { colors: isDark ? darkColors : lightColors, isDark, mode, setMode };
};

// Estilos que dependen del tema: se recalculan solo cuando cambia el tema
export const useThemedStyles = <T,>(factory: (c: ThemeColors) => T): T => {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [colors]);
};
