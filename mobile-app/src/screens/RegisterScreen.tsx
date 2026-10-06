import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView
} from 'react-native';
// @ts-ignore
import { ArrowLeft, Lock } from 'lucide-react-native';
import { registerUser } from '../api/auth';
import PressableScale from '../components/anim/PressableScale';

export default function RegisterScreen({ navigation }: any) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    matricula: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!form.fullName || !form.email || !form.password) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      await registerUser(form);
      Alert.alert('¡Cuenta Creada!', 'Ahora puedes iniciar sesión', [
        { text: 'Ir al Login', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <PressableScale onPress={() => navigation.goBack()} style={styles.backButton}>
          {/* @ts-ignore */}
          <ArrowLeft color="#374151" size={24} />
        </PressableScale>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.titleContainer}>
          <View style={styles.iconContainer}>
             {/* @ts-ignore */}
             <Lock color="#10B981" size={30} />
          </View>
          <Text style={styles.title}>Crea tu cuenta</Text>
          <Text style={styles.subtitle}>Ingresa tus datos para continuar.</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Nombre Completo</Text>
          <TextInput 
            style={styles.input}
            placeholder="Juan Pérez"
            value={form.fullName}
            onChangeText={(t) => setForm({...form, fullName: t})}
          />

          <Text style={styles.label}>Matrícula</Text>
          <TextInput 
            style={styles.input}
            placeholder="2203..."
            keyboardType="numeric"
            value={form.matricula}
            onChangeText={(t) => setForm({...form, matricula: t})}
          />

          <Text style={styles.label}>Correo Institucional</Text>
          <TextInput 
            style={styles.input}
            placeholder="nombre@uam.mx"
            autoCapitalize="none"
            keyboardType="email-address"
            value={form.email}
            onChangeText={(t) => setForm({...form, email: t})}
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput 
            style={styles.input}
            placeholder="********"
            secureTextEntry
            value={form.password}
            onChangeText={(t) => setForm({...form, password: t})}
          />

          <PressableScale 
            style={styles.primaryButton} 
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Creando...' : 'Continuar'}
            </Text>
          </PressableScale>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 50,
    alignSelf: 'flex-start',
  },
  scrollContent: {
    padding: 30,
  },
  titleContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  formContainer: {
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F9FAFB', // Fondo gris muy suave para inputs
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#374151',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  primaryButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 30,
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
});
