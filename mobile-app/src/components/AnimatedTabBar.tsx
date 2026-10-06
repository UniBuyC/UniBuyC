import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutChangeEvent } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
// @ts-ignore
import { Plus } from 'lucide-react-native';
import PressableScale from './anim/PressableScale';
import { useTheme, useThemedStyles, ThemeColors } from '../theme';

const CENTER_ROUTE = 'Publicar'; // Botón flotante: no es una pestaña, abre la pantalla de publicar
const PILL_WIDTH = 56;
const LINE_WIDTH = 24;
const SPRING = { damping: 16, stiffness: 170, mass: 0.9 };

// Barra de pestañas con un indicador verde que se desliza entre las pestañas:
// una pastilla detrás del icono activo y una línea arriba que se estira mientras viaja.
export default function AnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const bottomSpace = Math.max(insets.bottom, 10);

  const [barWidth, setBarWidth] = useState(0);
  const slotWidth = barWidth / state.routes.length;
  const centerOf = (index: number) => index * slotWidth + slotWidth / 2;

  const x = useSharedValue(0);
  const stretch = useSharedValue(1);

  // Al cambiar de pestaña, el indicador viaja con un resorte y la línea se estira en el camino
  useEffect(() => {
    if (!barWidth) return;
    const target = centerOf(state.index);
    if (x.value === 0) {
      x.value = target; // Primera vez: aparece directo en su lugar
      return;
    }
    x.value = withSpring(target, SPRING);
    stretch.value = withSequence(
      withTiming(2.2, { duration: 140 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
  }, [state.index, barWidth]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value - PILL_WIDTH / 2 }],
  }));
  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value - LINE_WIDTH / 2 }, { scaleX: stretch.value }],
  }));

  const onLayout = (e: LayoutChangeEvent) => setBarWidth(e.nativeEvent.layout.width);

  return (
    <View style={[styles.bar, { height: 64 + bottomSpace, paddingBottom: bottomSpace }]} onLayout={onLayout}>
      {barWidth > 0 && (
        <>
          <Animated.View style={[styles.pill, pillStyle]} />
          <Animated.View style={[styles.line, lineStyle]} />
        </>
      )}

      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;

        const onPress = () => {
          // Emitimos el evento para que funcionen los listeners (vibración, botón de publicar)
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        if (route.name === CENTER_ROUTE) {
          return (
            <View key={route.key} style={styles.slot}>
              <PressableScale scaleTo={0.88} onPress={onPress} style={styles.centerButton} accessibilityLabel="Publicar">
                {/* @ts-ignore */}
                <Plus color="white" size={30} />
              </PressableScale>
            </View>
          );
        }

        const color = focused ? c.primary : c.textFaint;
        const label = (options.title ?? route.name) as string;
        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={styles.slot}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={label}
          >
            {options.tabBarIcon?.({ focused, color, size: 24 })}
            <Text style={[styles.label, { color }, focused && styles.labelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: c.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },
  slot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, marginTop: 3, fontWeight: '500' },
  labelActive: { fontWeight: '700' },
  pill: {
    position: 'absolute',
    top: 6,
    left: 0,
    width: PILL_WIDTH,
    height: 32,
    borderRadius: 16,
    backgroundColor: c.primarySoft,
  },
  line: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: LINE_WIDTH,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: c.primary,
  },
  centerButton: {
    top: -18,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: c.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: c.card,
    shadowColor: c.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
