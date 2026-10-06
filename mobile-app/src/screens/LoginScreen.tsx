import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore
import { Store } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { loginUser } from '../api/auth';
import PressableScale from '../components/anim/PressableScale';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme, useThemedStyles, ThemeColors } from '../theme';
import { toast, apiErrorMessage } from '../store/feedbackStore';

export default function LoginScreen({ navigation }: any) {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);

  const loginAction = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      toast.warning('Faltan datos', 'Escribe tu correo y tu contraseña');
      return;
    }

    setLoading(true);
    try {
      const data = await loginUser(email.trim().toLowerCase(), password);
      await loginAction(data.token, data.user);
      navigation.replace('MainTabs');
    } catch (error: any) {
      toast.error('No pudimos iniciar sesión', apiErrorMessage(error, 'Revisa tu conexión e intenta de nuevo'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.container}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 20 }}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* PANEL DE BIENVENIDA */}
        <View style={[styles.hero, { paddingTop: insets.top + 48 }]}>
          <Animated.View entering={FadeInDown.duration(500)} style={styles.logoTile}>
            {/* @ts-ignore */}
            <Store color="white" size={36} strokeWidth={2} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <Text style={styles.brand}>
              UniBuy<Text style={styles.brandAccent}>C</Text>
            </Text>
            <Text style={styles.headline}>Compra y vende dentro de tu universidad</Text>
            <Text style={styles.caption}>Para alumnos y profesores de la UAM.</Text>
          </Animated.View>
        </View>

        {/* FORMULARIO */}
        <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.form}>
          <TextInput
            style={[styles.input, focused === 'email' && styles.inputFocused]}
            placeholder="Correo institucional"
            placeholderTextColor={c.textFaint}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
            returnKeyType="next"
          />

          <TextInput
            style={[styles.input, focused === 'password' && styles.inputFocused]}
            placeholder="Contraseña"
            placeholderTextColor={c.textFaint}
            secureTextEntry
            textContentType="password"
            value={password}
            onChangeText={setPassword}
            onFocus={() => setFocused('password')}
            onBlur={() => setFocused(null)}
            returnKeyType="go"
            onSubmitEditing={handleLogin}
          />

          <PressableScale style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
            )}
          </PressableScale>

          <PressableScale style={styles.secondaryButton} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.secondaryButtonText}>Crear cuenta</Text>
          </PressableScale>

          <PressableScale style={styles.guestLink} onPress={() => navigation.replace('MainTabs')}>
            <Text style={styles.guestText}>Ingresar como invitado</Text>
          </PressableScale>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  hero: {
    backgroundColor: c.primarySoft,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  logoTile: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: c.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: c.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  brand: {
    fontSize: 46,
    fontWeight: '800',
    color: c.text,
    letterSpacing: -1,
  },
  brandAccent: {
    color: c.primary,
  },
  headline: {
    fontSize: 22,
    fontWeight: '600',
    color: c.text,
    marginTop: 10,
    lineHeight: 30,
  },
  caption: {
    fontSize: 15,
    color: c.textMuted,
    marginTop: 10,
  },
  form: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  input: {
    backgroundColor: c.card,
    borderWidth: 1.5,
    borderColor: c.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    color: c.text,
    marginBottom: 12,
  },
  inputFocused: {
    borderColor: c.primary,
  },
  primaryButton: {
    backgroundColor: c.primary,
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
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
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: c.primary,
    backgroundColor: c.card,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    color: c.primaryText,
    fontSize: 16,
    fontWeight: 'bold',
  },
  guestLink: {
    alignItems: 'center',
    marginTop: 20,
    padding: 6,
  },
  guestText: {
    color: c.textMuted,
    fontSize: 14,
  },
});
