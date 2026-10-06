import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, PanResponder, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
// @ts-ignore
import { CircleCheck, CircleX, TriangleAlert, Info, X } from 'lucide-react-native';
import { Tone, useFeedbackStore } from '../../store/feedbackStore';
import { haptic } from '../../utils/haptics';
import { useTheme, useThemedStyles, ThemeColors } from '../../theme';

const DURATION = 3200;
const HIDDEN_Y = -180;

const ICONS: Record<Tone, any> = { success: CircleCheck, error: CircleX, warning: TriangleAlert, info: Info };

// Color principal de cada tipo de aviso
export const toneColor = (tone: Tone, c: ThemeColors) =>
  ({ success: c.primary, error: c.danger, warning: '#F59E0B', info: c.info })[tone];

// Aviso flotante: baja desde arriba con su icono, se cierra solo (con una barra que lo indica)
// y se puede deslizar hacia arriba para cerrarlo antes.
export default function ToastHost() {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { toast, hideToast } = useFeedbackStore();

  const y = useSharedValue(HIDDEN_Y);
  const timer = useSharedValue(1); // Barra de tiempo restante (1 → 0)
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentId = useRef<number | null>(null);

  const clear = () => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    hideTimeout.current = null;
  };

  const hide = () => {
    clear();
    const id = currentId.current;
    y.value = withTiming(HIDDEN_Y, { duration: 220, easing: Easing.in(Easing.quad) }, (done) => {
      if (done && id !== null) runOnJS(hideToast)(id);
    });
  };

  useEffect(() => {
    if (!toast) return;
    currentId.current = toast.id;
    // Vibración según el tipo
    if (toast.tone === 'success') haptic.success();
    else if (toast.tone === 'error') haptic.error();
    else haptic.light();

    y.value = withSpring(0, { damping: 20, stiffness: 220 });
    timer.value = 1;
    timer.value = withTiming(0, { duration: DURATION, easing: Easing.linear });
    clear();
    hideTimeout.current = setTimeout(hide, DURATION);
    return clear;
  }, [toast?.id]);

  // Deslizar hacia arriba para cerrar
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 4,
      onPanResponderGrant: clear,
      onPanResponderMove: (_e, g) => {
        y.value = g.dy < 0 ? g.dy : g.dy * 0.15;
      },
      onPanResponderRelease: (_e, g) => {
        if (g.dy < -25 || g.vy < -0.4) hide();
        else {
          y.value = withSpring(0, { damping: 20, stiffness: 220 });
          hideTimeout.current = setTimeout(hide, 1500);
        }
      },
    })
  ).current;

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
    opacity: y.value < -120 ? 0 : 1,
  }));
  const timerStyle = useAnimatedStyle(() => ({ width: `${timer.value * 100}%` }));

  if (!toast) return null;
  const color = toneColor(toast.tone, c);
  const Icon = ICONS[toast.tone];

  return (
    <Animated.View
      style={[styles.wrapper, { top: insets.top + 8 }, containerStyle]}
      {...pan.panHandlers}
    >
      <View style={styles.card}>
        <View style={[styles.iconCircle, { backgroundColor: color + '22' }]}>
          <Icon color={color} size={22} strokeWidth={2.4} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={2}>{toast.title}</Text>
          {!!toast.message && <Text style={styles.message} numberOfLines={3}>{toast.message}</Text>}
        </View>
        <Pressable onPress={hide} hitSlop={10} style={styles.close}>
          <X color={c.textFaint} size={18} />
        </Pressable>
        {/* Tiempo restante */}
        <View style={styles.timerTrack}>
          <Animated.View style={[styles.timerFill, { backgroundColor: color }, timerStyle]} />
        </View>
      </View>
    </Animated.View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  wrapper: { position: 'absolute', left: 12, right: 12, zIndex: 200 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.card,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: c.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: { fontSize: 15, fontWeight: '700', color: c.text },
  message: { fontSize: 13, color: c.textMuted, marginTop: 2, lineHeight: 18 },
  close: { padding: 4, marginLeft: 8 },
  timerTrack: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, backgroundColor: 'transparent' },
  timerFill: { height: 3, opacity: 0.7 },
});
