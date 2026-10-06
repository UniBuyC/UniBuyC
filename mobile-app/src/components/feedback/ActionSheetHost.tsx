import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';
// @ts-ignore
import { Camera, Image as ImageIcon, ChevronRight } from 'lucide-react-native';
import { useFeedbackStore } from '../../store/feedbackStore';
import PressableScale from '../anim/PressableScale';
import { haptic } from '../../utils/haptics';
import { useTheme, useThemedStyles, ThemeColors } from '../../theme';

const ICONS = { camera: Camera, image: ImageIcon };

// Hoja que sube desde abajo para elegir una opción (p. ej. cámara o galería)
export default function ActionSheetHost() {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { sheet, closeSheet } = useFeedbackStore();

  useEffect(() => {
    if (!sheet) return;
    haptic.light();
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeSheet(null);
      return true;
    });
    return () => sub.remove();
  }, [sheet]);

  if (!sheet) return null;

  return (
    // El contenedor completo se desvanece al cerrar
    <Animated.View exiting={FadeOut.duration(170)} style={[StyleSheet.absoluteFill, { zIndex: 300 }]} pointerEvents="box-none">
      <Animated.View entering={FadeIn.duration(180)} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => closeSheet(null)} />
      </Animated.View>

      <Animated.View
        entering={SlideInDown.duration(260)}
        style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}
      >
        <View style={styles.handle} />
        <Text style={styles.title}>{sheet.title}</Text>
        {!!sheet.message && <Text style={styles.message}>{sheet.message}</Text>}

        <View style={{ marginTop: 16 }}>
          {sheet.options.map((option) => {
            const Icon = option.icon ? ICONS[option.icon] : null;
            return (
              <PressableScale key={option.value} style={styles.option} onPress={() => closeSheet(option.value)}>
                {Icon && (
                  <View style={styles.optionIcon}>
                    <Icon color={c.primary} size={22} />
                  </View>
                )}
                <Text style={styles.optionText}>{option.label}</Text>
                <ChevronRight color={c.textFaint} size={20} />
              </PressableScale>
            );
          })}
        </View>

        <PressableScale style={styles.cancel} onPress={() => closeSheet(null)}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </PressableScale>
      </Animated.View>
    </Animated.View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 300 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 301,
    backgroundColor: c.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 16,
  },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: c.surface, marginBottom: 16 },
  title: { fontSize: 19, fontWeight: '800', color: c.text },
  message: { fontSize: 14, color: c.textMuted, marginTop: 4 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.background,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: c.borderLight,
  },
  optionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: c.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionText: { flex: 1, fontSize: 16, fontWeight: '600', color: c.text },
  cancel: { paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  cancelText: { fontSize: 15, fontWeight: '700', color: c.textMuted },
});
