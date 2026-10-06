import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { goToLogin } from '../navigation/navigationRef';
import PressableScale from '../components/anim/PressableScale';

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();
  const insets = useSafeAreaInsets();
  const top = { paddingTop: insets.top + 20 };

  const handleLogout = async () => {
    await logout();
    // Reiniciamos la navegación para volver al Login sin poder regresar atrás
    goToLogin();
  };

  // Invitado: no hay datos de cuenta que mostrar
  if (!user) {
    return (
      <View style={[styles.container, top]}>
        <View style={styles.header}>
          <View style={[styles.avatarContainer, { backgroundColor: '#9CA3AF' }]}>
            <Text style={styles.avatarText}>?</Text>
          </View>
          <Text style={styles.name}>Invitado</Text>
          <Text style={styles.email}>Crea una cuenta para publicar, chatear y calificar</Text>
        </View>
        <PressableScale style={styles.loginButton} onPress={goToLogin}>
          <Text style={styles.loginText}>Iniciar sesión o registrarse</Text>
        </PressableScale>
      </View>
    );
  }

  return (
    <View style={[styles.container, top]}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user?.fullName?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.fullName || 'Usuario'}</Text>
        <Text style={styles.matricula}>Matrícula: {user?.matricula}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mi Cuenta</Text>
        <PressableScale style={styles.option} onPress={() => navigation.navigate('MyProducts')}>
          <Text style={styles.optionText}>Mis Publicaciones</Text>
        </PressableScale>
        <PressableScale style={styles.option} onPress={() => Alert.alert('Próximamente', 'Ajustes de cuenta')}>
          <Text style={styles.optionText}>Configuración</Text>
        </PressableScale>
      </View>

      <PressableScale style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 20 },
  header: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#10B981',
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2
  },
  avatarText: { fontSize: 32, color: 'white', fontWeight: 'bold' },
  name: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  matricula: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  email: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  section: { backgroundColor: 'white', borderRadius: 12, padding: 5, marginBottom: 20, elevation: 2 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', padding: 15, color: '#9CA3AF', paddingBottom: 5 },
  option: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  optionText: { fontSize: 16, color: '#374151' },
  logoutButton: { backgroundColor: '#FEE2E2', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  logoutText: { color: '#EF4444', fontWeight: 'bold', fontSize: 16 },
  loginButton: { backgroundColor: '#10B981', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  loginText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
