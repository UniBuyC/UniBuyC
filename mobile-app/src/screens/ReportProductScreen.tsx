import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore
import { CircleDollarSign, Ban, EyeOff, Info, Megaphone, CircleHelp, Check } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { reportProduct } from '../api/products';
import { resolveImageUrl } from '../api/apiClient';
import { toast, apiErrorMessage } from '../store/feedbackStore';
import PressableScale from '../components/anim/PressableScale';
import { haptic } from '../utils/haptics';
import { Product, ReportReason } from '../types';
import { useTheme, useThemedStyles, ThemeColors } from '../theme';

// Motivos de reporte (los mismos que acepta el backend)
const REASONS: { key: ReportReason; label: string; hint: string; Icon: any }[] = [
  { key: 'SCAM', label: 'Fraude o estafa', hint: 'Pide pagos por adelantado, precio engañoso…', Icon: CircleDollarSign },
  { key: 'PROHIBITED', label: 'Artículo prohibido', hint: 'Armas, sustancias, artículos robados…', Icon: Ban },
  { key: 'INAPPROPRIATE', label: 'Contenido inapropiado', hint: 'Imágenes o texto ofensivo', Icon: EyeOff },
  { key: 'WRONG_INFO', label: 'Información falsa', hint: 'La foto o la descripción no corresponden', Icon: Info },
  { key: 'SPAM', label: 'Spam o publicidad', hint: 'Publicaciones repetidas o promociones', Icon: Megaphone },
  { key: 'OTHER', label: 'Otro motivo', hint: 'Cuéntanos en el comentario', Icon: CircleHelp },
];

export default function ReportProductScreen({ route, navigation }: any) {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(createStyles);
  const product: Product = route.params.product;
  const token = useAuthStore((state) => state.token);
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!reason || !token) return;
    if (reason === 'OTHER' && !details.trim()) {
      toast.warning('Falta el comentario', 'Cuéntanos brevemente el motivo');
      return;
    }
    setSending(true);
    try {
      await reportProduct(product.id, reason, details, token);
      toast.success('Reporte enviado', 'Gracias. El equipo de UniBuyC lo revisará.');
      navigation.goBack();
    } catch (error: any) {
      toast.error('No se pudo enviar el reporte', apiErrorMessage(error, 'Intenta de nuevo'));
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={headerHeight}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 30 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Publicación que se reporta */}
        <View style={styles.productRow}>
          <Image source={{ uri: resolveImageUrl(product.image) }} style={styles.productImage} />
          <View style={{ flex: 1 }}>
            <Text style={styles.productTitle} numberOfLines={2}>{product.title}</Text>
            <Text style={styles.productSeller} numberOfLines={1}>de {product.seller?.fullName ?? 'un estudiante'}</Text>
          </View>
        </View>

        <Text style={styles.title}>¿Qué problema tiene esta publicación?</Text>
        <Text style={styles.subtitle}>Tu reporte es anónimo para el vendedor.</Text>

        {REASONS.map(({ key, label, hint, Icon }) => {
          const selected = reason === key;
          return (
            <PressableScale
              key={key}
              scaleTo={0.98}
              style={[styles.option, selected && styles.optionSelected]}
              onPress={() => { haptic.selection(); setReason(key); }}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <View style={[styles.optionIcon, selected && styles.optionIconSelected]}>
                <Icon color={selected ? 'white' : c.danger} size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionLabel}>{label}</Text>
                <Text style={styles.optionHint}>{hint}</Text>
              </View>
              {selected && <Check color={c.danger} size={20} strokeWidth={3} />}
            </PressableScale>
          );
        })}

        <Text style={styles.label}>Comentario {reason === 'OTHER' ? '' : '(opcional)'}</Text>
        <TextInput
          style={styles.input}
          placeholder="Agrega detalles que ayuden a revisarlo"
          placeholderTextColor={c.textFaint}
          multiline
          maxLength={500}
          textAlignVertical="top"
          value={details}
          onChangeText={setDetails}
        />
        <Text style={styles.counter}>{details.length}/500</Text>

        <PressableScale
          style={[styles.sendButton, (!reason || sending) && { opacity: 0.5 }]}
          onPress={send}
          disabled={!reason || sending}
        >
          {sending ? <ActivityIndicator color="white" /> : <Text style={styles.sendText}>Enviar reporte</Text>}
        </PressableScale>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: c.border,
    marginBottom: 22,
  },
  productImage: { width: 56, height: 56, borderRadius: 10, marginRight: 12, backgroundColor: c.muted },
  productTitle: { fontSize: 15, fontWeight: '700', color: c.text },
  productSeller: { fontSize: 13, color: c.textMuted, marginTop: 2 },
  title: { fontSize: 20, fontWeight: '800', color: c.text },
  subtitle: { fontSize: 14, color: c.textMuted, marginTop: 4, marginBottom: 16 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: c.border,
  },
  optionSelected: { borderColor: c.danger, backgroundColor: c.dangerSoft },
  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: c.dangerSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionIconSelected: { backgroundColor: c.danger },
  optionLabel: { fontSize: 15, fontWeight: '700', color: c.text },
  optionHint: { fontSize: 12, color: c.textMuted, marginTop: 1 },
  label: { fontSize: 13, fontWeight: '600', color: c.textMuted, marginTop: 14, marginBottom: 8 },
  input: {
    minHeight: 90,
    backgroundColor: c.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    padding: 14,
    fontSize: 15,
    color: c.text,
  },
  counter: { alignSelf: 'flex-end', fontSize: 12, color: c.textFaint, marginTop: 4 },
  sendButton: {
    backgroundColor: c.danger,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  sendText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
