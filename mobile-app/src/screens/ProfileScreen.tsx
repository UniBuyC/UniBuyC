import React from 'react';
import { View, Text, StyleSheet, Switch, Pressable } from 'react-native';
// @ts-ignore
import { Moon, Package, ChevronRight } from 'lucide-react-native';
import { haptic } from '../utils/haptics';
import { useAuthStore } from '../store/authStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { goToLogin } from '../navigation/navigationRef';
import PressableScale from '../components/anim/PressableScale';
import Avatar from '../components/Avatar';
import { useTheme, useThemedStyles, ThemeColors } from '../theme';

// Configuración disponible para todos (también invitados): el tema es del celular, no de la cuenta
function SettingsSection() {
  const { colors: c, isDark, mode, setMode } = useTheme();
  const styles = useThemedStyles(createStyles);

  const toggleDark = (value: boolean) => {
    haptic.selection();
    setMode(value ? 'dark' : 'light');
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Configuración</Text>
      <View style={[styles.option, styles.optionRow, { borderBottomWidth: 0 }]}>
        <View style={styles.optionIcon}>
          {/* @ts-ignore */}
          <Moon color={c.primary} size={18} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.optionText}>Modo oscuro</Text>
          {mode === 'system' ? (
            <Text style={styles.optionHint}>Siguiendo el tema del celular</Text>
          ) : (
            <Pressable onPress={() => { haptic.selection(); setMode('system'); }} hitSlop={8}>
              <Text style={[styles.optionHint, { color: c.primaryText }]}>Usar el tema del celular</Text>
            </Pressable>
          )}
        </View>
        <Switch
          value={isDark}
          onValueChange={toggleDark}
          trackColor={{ false: c.surface, true: c.primary }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={c.surface}
        />
      </View>
    </View>
  );
}

export default function ProfileScreen({ navigation }: any) {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(createStyles);
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
          <View style={[styles.avatarContainer, { backgroundColor: c.textFaint }]}>
            <Text style={styles.avatarText}>?</Text>
          </View>
          <Text style={styles.name}>Invitado</Text>
          <Text style={styles.email}>Crea una cuenta para publicar, chatear y calificar</Text>
        </View>
        <SettingsSection />
        <PressableScale style={styles.loginButton} onPress={goToLogin}>
          <Text style={styles.loginText}>Iniciar sesión o registrarse</Text>
        </PressableScale>
      </View>
    );
  }

  return (
    <View style={[styles.container, top]}>
      <View style={styles.header}>
        {/* Avatar generado a partir del id: cada cuenta tiene el suyo */}
        <Avatar seed={user.id} size={88} style={{ marginBottom: 10 }} />
        <Text style={styles.name}>{user?.fullName || 'Usuario'}</Text>
        <Text style={styles.matricula}>Matrícula: {user?.matricula}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mi Cuenta</Text>
        <PressableScale
          scaleTo={0.98}
          style={[styles.option, styles.optionRow, { borderBottomWidth: 0 }]}
          onPress={() => navigation.navigate('MyProducts')}
        >
          <View style={styles.optionIcon}>
            {/* @ts-ignore */}
            <Package color={c.primary} size={18} />
          </View>
          <Text style={[styles.optionText, { flex: 1 }]}>Mis Publicaciones</Text>
          {/* @ts-ignore */}
          <ChevronRight color={c.textFaint} size={20} />
        </PressableScale>
      </View>

      <SettingsSection />

      <PressableScale style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </PressableScale>
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background, padding: 20 },
  header: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: c.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2
  },
  avatarText: { fontSize: 32, color: 'white', fontWeight: 'bold' },
  name: { fontSize: 20, fontWeight: 'bold', color: c.text },
  matricula: { fontSize: 14, color: c.textMuted, marginTop: 4 },
  email: { fontSize: 14, color: c.textMuted, textAlign: 'center' },
  section: { backgroundColor: c.card, borderRadius: 12, padding: 5, marginBottom: 20, elevation: 2 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', padding: 15, color: c.textFaint, paddingBottom: 5 },
  option: { padding: 15, borderBottomWidth: 1, borderBottomColor: c.borderLight },
  optionText: { fontSize: 16, color: c.textSecondary },
  optionRow: { flexDirection: 'row', alignItems: 'center' },
  optionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: c.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionHint: { fontSize: 12, color: c.textFaint, marginTop: 2 },
  logoutButton: { backgroundColor: c.dangerSoft, padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  logoutText: { color: c.danger, fontWeight: 'bold', fontSize: 16 },
  loginButton: { backgroundColor: c.primary, padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  loginText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
