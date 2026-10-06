import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
// @ts-ignore
import { ArrowLeft, Check, UserPlus } from 'lucide-react-native';
import { registerUser } from '../api/auth';
import PressableScale from '../components/anim/PressableScale';
import PopOnChange from '../components/anim/PopOnChange';
import { haptic } from '../utils/haptics';
import { useTheme, useThemedStyles, ThemeColors } from '../theme';
import { toast, confirm, apiErrorMessage } from '../store/feedbackStore';

type Field = 'fullName' | 'matricula' | 'email' | 'password';

// Pasos del registro, en orden, con su validación
const STEPS: { key: Field; label: string; error: string; valid: (v: string) => boolean }[] = [
  { key: 'fullName', label: 'Nombre', error: 'Escribe tu nombre completo', valid: (v) => v.trim().length >= 3 },
  { key: 'matricula', label: 'Matrícula', error: 'La matrícula solo lleva números (mín. 6)', valid: (v) => /^\d{6,}$/.test(v.trim()) },
  { key: 'email', label: 'Correo', error: 'Escribe un correo válido', valid: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) },
  { key: 'password', label: 'Contraseña', error: 'Mínimo 6 caracteres', valid: (v) => v.length >= 6 },
];

// Círculo de cada paso: se llena y rebota con una ✓ al completarse
function StepDot({ index, done, active }: { index: number; done: boolean; active: boolean }) {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(createStyles);
  const scale = useSharedValue(1);

  // El paso en el que estás crece un poco
  useEffect(() => {
    scale.value = withSpring(active && !done ? 1.15 : 1, { damping: 10, stiffness: 220 });
  }, [active, done]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animatedStyle}>
      <PopOnChange trigger={done} when={done} scale={1.35}>
        <View
          style={[
            styles.dot,
            done && styles.dotDone,
            active && !done && styles.dotActive,
          ]}
        >
          {done ? (
            // @ts-ignore
            <Check color="white" size={14} strokeWidth={3} />
          ) : (
            <Text style={[styles.dotText, active && { color: c.primary }]}>{index + 1}</Text>
          )}
        </View>
      </PopOnChange>
    </Animated.View>
  );
}

export default function RegisterScreen({ navigation }: any) {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<Record<Field, string>>({
    fullName: '',
    matricula: '',
    email: '',
    password: '',
  });
  const [focused, setFocused] = useState<Field | null>(null);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [loading, setLoading] = useState(false);

  const inputs = useRef<Partial<Record<Field, TextInput | null>>>({});

  const doneFlags = STEPS.map((s) => s.valid(form[s.key]));
  const doneCount = doneFlags.filter(Boolean).length;
  const allDone = doneCount === STEPS.length;
  // Paso actual: el campo enfocado, o el primero que falta
  const currentIndex = focused
    ? STEPS.findIndex((s) => s.key === focused)
    : Math.max(0, doneFlags.findIndex((d) => !d));

  // Barra de avance con resorte
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withSpring(doneCount / STEPS.length, { damping: 14, stiffness: 120 });
  }, [doneCount]);
  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  // Vibración ligera cada vez que se completa un paso
  const prevDone = useRef(0);
  useEffect(() => {
    if (doneCount > prevDone.current) haptic.light();
    prevDone.current = doneCount;
  }, [doneCount]);

  // El botón se ilumina cuando ya está todo
  const ready = useSharedValue(0);
  useEffect(() => {
    ready.value = withTiming(allDone ? 1 : 0, { duration: 250 });
  }, [allDone]);
  const buttonStyle = useAnimatedStyle(() => ({ opacity: 0.5 + ready.value * 0.5 }));

  const goNext = (index: number) => {
    const next = STEPS[index + 1];
    if (next) inputs.current[next.key]?.focus();
    else handleRegister();
  };

  const handleRegister = async () => {
    if (!allDone) {
      // Mostramos los errores de todo lo que falta
      setTouched({ fullName: true, matricula: true, email: true, password: true });
      toast.warning('Te faltan algunos datos', 'Revisa los campos marcados en rojo');
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        fullName: form.fullName.trim(),
        matricula: form.matricula.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      haptic.success();
      // Celebración y de regreso al login
      await confirm({
        icon: 'celebrate',
        title: '¡Bienvenid@ a UniByC!',
        message: `Tu cuenta quedó lista, ${form.fullName.trim().split(' ')[0]}. Ya puedes iniciar sesión.`,
        confirmText: 'Ir a iniciar sesión',
      });
      navigation.goBack();
    } catch (error: any) {
      toast.error('No se pudo crear la cuenta', apiErrorMessage(error, 'Intenta de nuevo'));
    } finally {
      setLoading(false);
    }
  };

  const fieldProps: Record<Field, Partial<React.ComponentProps<typeof TextInput>>> = {
    fullName: { placeholder: 'Juan Pérez', autoCapitalize: 'words', textContentType: 'name' },
    matricula: { placeholder: '2203...', keyboardType: 'number-pad' },
    email: { placeholder: 'nombre@uam.mx', autoCapitalize: 'none', keyboardType: 'email-address', textContentType: 'emailAddress' },
    password: { placeholder: 'Mínimo 6 caracteres', secureTextEntry: true, textContentType: 'newPassword' },
  };
  const titles: Record<Field, string> = {
    fullName: 'Nombre Completo',
    matricula: 'Matrícula',
    email: 'Correo Institucional',
    password: 'Contraseña',
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <PressableScale onPress={() => navigation.goBack()} style={styles.backButton}>
          {/* @ts-ignore */}
          <ArrowLeft color={c.textSecondary} size={24} />
        </PressableScale>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.duration(400)} style={styles.titleContainer}>
          <View style={styles.iconContainer}>
            {/* @ts-ignore */}
            <UserPlus color={c.primary} size={28} />
          </View>
          <Text style={styles.title}>Crea tu cuenta</Text>
          <Text style={styles.subtitle}>
            {allDone ? '¡Listo! Ya puedes crear tu cuenta' : `Paso ${currentIndex + 1} de ${STEPS.length}: ${STEPS[currentIndex].label}`}
          </Text>
        </Animated.View>

        {/* INDICADOR DE PASOS + BARRA DE AVANCE */}
        <Animated.View entering={FadeIn.delay(150)} style={styles.progressContainer}>
          <View style={styles.dotsRow}>
            {STEPS.map((step, i) => (
              <View key={step.key} style={styles.dotColumn}>
                <StepDot index={i} done={doneFlags[i]} active={i === currentIndex} />
                <Text style={[styles.dotLabel, (doneFlags[i] || i === currentIndex) && styles.dotLabelActive]}>
                  {step.label}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.track}>
            <Animated.View style={[styles.trackFill, barStyle]} />
          </View>
        </Animated.View>

        <View style={styles.formContainer}>
          {STEPS.map((step, i) => {
            const value = form[step.key];
            const valid = doneFlags[i];
            const showError = touched[step.key] && !valid && focused !== step.key;
            return (
              <Animated.View key={step.key} entering={FadeInDown.delay(200 + i * 70).duration(350)}>
                <Text style={styles.label}>{titles[step.key]}</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    focused === step.key && styles.inputFocused,
                    valid && styles.inputValid,
                    showError && styles.inputError,
                  ]}
                >
                  <TextInput
                    ref={(r) => { inputs.current[step.key] = r; }}
                    style={styles.input}
                    placeholderTextColor={c.textFaint}
                    value={value}
                    onChangeText={(t) => setForm((f) => ({ ...f, [step.key]: t }))}
                    onFocus={() => setFocused(step.key)}
                    onBlur={() => {
                      setFocused(null);
                      if (value) setTouched((t) => ({ ...t, [step.key]: true }));
                    }}
                    returnKeyType={i === STEPS.length - 1 ? 'done' : 'next'}
                    onSubmitEditing={() => goNext(i)}
                    submitBehavior={i === STEPS.length - 1 ? 'blurAndSubmit' : 'submit'}
                    {...fieldProps[step.key]}
                  />
                  {/* ✓ que rebota al completar el campo */}
                  {valid && (
                    <PopOnChange trigger={valid} scale={1.5}>
                      {/* @ts-ignore */}
                      <Check color={c.primary} size={20} strokeWidth={3} />
                    </PopOnChange>
                  )}
                </View>
                {showError && (
                  <Animated.Text entering={FadeIn.duration(200)} style={styles.errorText}>
                    {step.error}
                  </Animated.Text>
                )}
              </Animated.View>
            );
          })}

          <Animated.View style={buttonStyle}>
            <PressableScale
              style={styles.primaryButton}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Creando...' : 'Crear cuenta'}
              </Text>
            </PressableScale>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.card,
  },
  header: {
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 10,
    backgroundColor: c.muted,
    borderRadius: 50,
    alignSelf: 'flex-start',
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 10,
    paddingBottom: 40,
  },
  titleContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: c.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: c.text,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: c.textMuted,
  },
  progressContainer: {
    marginBottom: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dotColumn: {
    flex: 1,
    alignItems: 'center',
  },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: c.border,
    backgroundColor: c.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotActive: {
    borderColor: c.primary,
    backgroundColor: c.primarySoft,
  },
  dotDone: {
    borderColor: c.primary,
    backgroundColor: c.primary,
  },
  dotText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: c.textFaint,
  },
  dotLabel: {
    fontSize: 11,
    color: c.textFaint,
    marginTop: 4,
  },
  dotLabelActive: {
    color: c.primaryText,
    fontWeight: '600',
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: c.muted,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: c.primary,
  },
  formContainer: {
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: c.textMuted,
    marginBottom: 8,
    marginTop: 14,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.background,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: c.borderLight,
    paddingRight: 12,
  },
  inputFocused: {
    borderColor: c.primary,
  },
  inputValid: {
    borderColor: c.primaryMuted,
  },
  inputError: {
    borderColor: c.danger,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: c.text,
  },
  errorText: {
    color: c.danger,
    fontSize: 12,
    marginTop: 6,
  },
  primaryButton: {
    backgroundColor: c.primary,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 30,
    shadowColor: c.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
