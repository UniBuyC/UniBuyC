import React, { useEffect, useRef } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface Props {
  // Cuando este valor cambia, el contenido hace un "pop"
  trigger: unknown;
  // Solo hacer pop si la condición se cumple (p. ej. al marcar, no al desmarcar)
  when?: boolean;
  delay?: number;
  scale?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

// Envuelve un icono para que crezca y rebote cuando cambia su estado (corazón, estrellas, globos)
export default function PopOnChange({ trigger, when = true, delay = 0, scale = 1.35, style, children }: Props) {
  const value = useSharedValue(1);
  const first = useRef(true);

  useEffect(() => {
    // No animamos al montar, solo cuando el valor cambia después
    if (first.current) {
      first.current = false;
      return;
    }
    if (!when) return;
    value.value = withDelay(
      delay,
      withSequence(
        withTiming(scale, { duration: 120 }),
        withSpring(1, { damping: 8, stiffness: 300 }),
      ),
    );
  }, [trigger]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: value.value }] }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
