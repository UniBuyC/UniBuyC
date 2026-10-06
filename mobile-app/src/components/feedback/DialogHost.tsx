import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, BackHandler } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, ZoomIn } from 'react-native-reanimated';
// @ts-ignore
import { CircleCheck, CircleX, TriangleAlert, Info, Trash2, LogIn, BadgeCheck, PartyPopper } from 'lucide-react-native';
import { DialogIcon, useFeedbackStore } from '../../store/feedbackStore';
import PressableScale from '../anim/PressableScale';
import { haptic } from '../../utils/haptics';
import { useTheme, useThemedStyles, ThemeColors } from '../../theme';

const ICONS: Record<DialogIcon, any> = {
  success: CircleCheck,
  error: CircleX,
  warning: TriangleAlert,
  info: Info,
  danger: Trash2,
  login: LogIn,
  sold: BadgeCheck,
  celebrate: PartyPopper,
};

const iconColor = (icon: DialogIcon, c: ThemeColors) =>
  ({
    success: c.primary,
    celebrate: c.primary,
    sold: c.primary,
    login: c.primary,
    info: c.info,
    warning: '#F59E0B',
    error: c.danger,
    danger: c.danger,
  })[icon];

// Cuadro de diálogo propio: fondo oscurecido, tarjeta con icono grande y botones claros
export default function DialogHost() {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { dialog, closeDialog } = useFeedbackStore();

  // Botón "atrás" de Android = cancelar
  useEffect(() => {
    if (!dialog) return;
    haptic.light();
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeDialog(false);
      return true;
    });
    return () => sub.remove();
  }, [dialog]);

  if (!dialog) return null;
  const color = iconColor(dialog.icon, c);
  const Icon = ICONS[dialog.icon];
  const confirmColor = dialog.destructive ? c.danger : c.primary;

  return (
    // El contenedor completo se desvanece al cerrar
    <Animated.View exiting={FadeOut.duration(170)} style={[StyleSheet.absoluteFill, { zIndex: 300 }]} pointerEvents="box-none">
      <Animated.View entering={FadeIn.duration(180)} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => dialog.cancelText && closeDialog(false)} />
      </Animated.View>

      <View style={styles.center} pointerEvents="box-none">
        <Animated.View entering={FadeInDown.duration(240)} style={styles.card}>
          <Animated.View
            entering={ZoomIn.delay(80).duration(260)}
            style={[styles.iconCircle, { backgroundColor: color + '1F' }]}
          >
            <View style={[styles.iconInner, { backgroundColor: color + '2E' }]}>
              <Icon color={color} size={30} strokeWidth={2.2} />
            </View>
          </Animated.View>

          <Text style={styles.title}>{dialog.title}</Text>
          {!!dialog.message && <Text style={styles.message}>{dialog.message}</Text>}

          <View style={styles.buttons}>
            {!!dialog.cancelText && (
              <PressableScale style={[styles.button, styles.cancel]} onPress={() => closeDialog(false)}>
                <Text style={styles.cancelText}>{dialog.cancelText}</Text>
              </PressableScale>
            )}
            <PressableScale
              style={[styles.button, { backgroundColor: confirmColor }, !!dialog.cancelText && { marginLeft: 10 }]}
              onPress={() => closeDialog(true)}
            >
              <Text style={styles.confirmText}>{dialog.confirmText}</Text>
            </PressableScale>
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 300 },
  center: { ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center', padding: 28, zIndex: 301 },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: c.card,
    borderRadius: 26,
    paddingTop: 28,
    paddingHorizontal: 22,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 20, fontWeight: '800', color: c.text, textAlign: 'center' },
  message: { fontSize: 15, color: c.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 21 },
  buttons: { flexDirection: 'row', marginTop: 24, width: '100%' },
  button: { flex: 1, paddingVertical: 15, borderRadius: 14, alignItems: 'center' },
  cancel: { backgroundColor: c.muted },
  cancelText: { fontSize: 15, fontWeight: '700', color: c.textSecondary },
  confirmText: { fontSize: 15, fontWeight: '700', color: 'white' },
});
