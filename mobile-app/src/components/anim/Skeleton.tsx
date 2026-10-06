import React, { useEffect } from 'react';
import { View, StyleSheet, DimensionValue, ViewStyle, StyleProp } from 'react-native';
import { appWidth } from '../../utils/layout';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme, useThemedStyles, ThemeColors } from '../../theme';

interface BoxProps {
  width?: DimensionValue;
  height: DimensionValue;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

// Bloque gris que "respira" mientras carga el contenido real
export function SkeletonBox({ width = '100%', height, radius = 8, style }: BoxProps) {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(createStyles);
  const opacity = useSharedValue(0.5);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: c.surface }, animatedStyle, style]}
    />
  );
}

const CARD_WIDTH = (appWidth() - 48) / 2;

// Cuadrícula de tarjetas de producto (Inicio)
export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.card}>
          <SkeletonBox height={CARD_WIDTH} radius={0} />
          <View style={{ padding: 10 }}>
            <SkeletonBox height={12} width="90%" />
            <SkeletonBox height={12} width="60%" style={{ marginTop: 6 }} />
            <SkeletonBox height={16} width="40%" style={{ marginTop: 10 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

// Filas con avatar (Chats, Vendedores, Mis Publicaciones)
export function ListSkeleton({ count = 6, square = false }: { count?: number; square?: boolean }) {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={{ padding: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.row}>
          <SkeletonBox width={50} height={50} radius={square ? 8 : 25} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <SkeletonBox height={14} width="55%" />
            <SkeletonBox height={12} width="80%" style={{ marginTop: 8 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: c.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
});
