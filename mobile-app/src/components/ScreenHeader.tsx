import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useThemedStyles, ThemeColors } from '../theme';

interface Props {
  title: string;
  // Contenido extra debajo del título (p. ej. barra de búsqueda o pestañas)
  children?: React.ReactNode;
}

// Encabezado para las pestañas principales: respeta la barra de estado / notch
export default function ScreenHeader({ title, children }: Props) {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    backgroundColor: c.card,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: c.borderLight,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: c.text,
    marginBottom: 4,
  },
});
