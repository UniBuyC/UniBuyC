import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
// @ts-ignore
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../theme';

// Flecha para regresar en la versión web. La flecha estándar es una imagen PNG que
// Vercel no publica (vive en una carpeta node_modules), así que usamos un icono vectorial.
export default function HeaderBack() {
  const navigation = useNavigation<any>();
  const { colors: c } = useTheme();

  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    // Si se recargó la página y no hay a dónde regresar, vamos al inicio de la app
    else navigation.navigate('MainTabs');
  };

  return (
    <Pressable onPress={goBack} hitSlop={10} style={styles.button} accessibilityRole="button" accessibilityLabel="Regresar">
      <ArrowLeft color={c.primary} size={24} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { paddingHorizontal: 12, paddingVertical: 6 },
});
