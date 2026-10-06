import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView
} from 'react-native';
// @ts-ignore
import { User } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { loginUser } from '../api/auth';
import PressableScale from '../components/anim/PressableScale';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { haptic } from '../utils/haptics';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const loginAction = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor ingresa correo y contraseña');
      return;
    }

    setLoading(true);
    try {
      const data = await loginUser(email, password);
      await loginAction(data.token, data.user);
      navigation.replace('MainTabs');
    } catch (error: any) {
      haptic.error();
      const msg = error.response?.data?.message || 'Error de conexión';
      Alert.alert('Error', Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Círculo Gris del Logo */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.logoContainer}>
          <View style={styles.logoCircle}>
             {/* @ts-ignore */}
             <User size={60} color="#E5E7EB" />
          </View>
          <Text style={styles.title}>Bienvenid@ a</Text>
          <Text style={styles.titleBrand}>UniByC</Text>
        </Animated.View>

        {/* Formulario */}
        <Animated.View entering={FadeInUp.delay(150).duration(500)} style={styles.formContainer}>
          <TextInput 
            style={styles.input}
            placeholder="correo@example.com"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput 
            style={styles.input}
            placeholder="Contraseña123@"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {/* Botón Verde - Iniciar Sesión */}
          <PressableScale 
            style={styles.primaryButton} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
            )}
          </PressableScale>

          {/* Botón Gris - Registrarse */}
          <PressableScale 
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.secondaryButtonText}>+ Registrarse</Text>
          </PressableScale>

          <PressableScale style={styles.guestLink} onPress={() => navigation.replace('MainTabs')}>
            <Text style={styles.guestText}>Ingresar como invitado</Text>
          </PressableScale>
        </Animated.View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Fondo Blanco Puro
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6', // Gris claro
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
  titleBrand: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827', // Negro
  },
  formContainer: {
    width: '100%',
  },
  input: {
    borderBottomWidth: 1, // Línea abajo en vez de caja
    borderBottomColor: '#E5E7EB',
    paddingVertical: 15,
    marginBottom: 25,
    fontSize: 16,
    color: '#374151',
  },
  primaryButton: {
    backgroundColor: '#10B981', // Verde UAM
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#10B981',
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
    backgroundColor: '#F3F4F6', // Gris muy claro
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 25,
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  guestLink: {
    alignItems: 'center',
  },
  guestText: {
    color: '#9CA3AF',
    fontSize: 14,
  }
});
