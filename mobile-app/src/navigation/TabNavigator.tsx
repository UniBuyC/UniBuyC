import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import AddProductScreen from '../screens/AddProductScreen';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { askToLogin } from './navigationRef';
import PopOnChange from '../components/anim/PopOnChange';
import AnimatedTabBar from '../components/AnimatedTabBar';
import { withTabFade } from '../components/anim/TabFade';
import { haptic } from '../utils/haptics';
import { useThemedStyles, ThemeColors } from '../theme';
// @ts-ignore
import { Home, MessageSquare, User, Heart } from 'lucide-react-native';

const Tab = createBottomTabNavigator();

// Pantallas con desvanecido al cambiar de pestaña (se crean una sola vez, fuera del componente)
const HomeTab = withTabFade(HomeScreen);
const ChatsTab = withTabFade(ChatListScreen);
const FavoritesTab = withTabFade(FavoritesScreen);
const ProfileTab = withTabFade(ProfileScreen);

// Icono de pestaña que rebota al seleccionarse
const TabIcon = ({ Icon, color, focused }: { Icon: any; color: string; focused: boolean }) => (
  <PopOnChange trigger={focused} when={focused} scale={1.2}>
    <Icon color={color} size={24} />
  </PopOnChange>
);

// Globo de no leídos que rebota cada vez que cambia el número
const UnreadBadge = ({ count }: { count: number }) => {
  const styles = useThemedStyles(createStyles);
  if (count <= 0) return null;
  return (
    <PopOnChange trigger={count} scale={1.4} style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </PopOnChange>
  );
};

export default function TabNavigator() {
  const token = useAuthStore((state) => state.token);
  const unreadTotal = useChatStore((state) => state.unreadTotal);
  // Espacio para la barra de navegación de Android / barra de inicio del iPhone
  const insets = useSafeAreaInsets();
  const bottomSpace = Math.max(insets.bottom, 10);

  return (
    <Tab.Navigator
      // Barra propia con el indicador deslizante
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // Misma altura que la barra propia: las pantallas la usan para dejar espacio abajo
        tabBarStyle: { position: 'absolute', height: 64 + bottomSpace },
      }}
      // Vibración ligera al cambiar de pestaña
      screenListeners={{ tabPress: () => haptic.selection() }}
    >
      <Tab.Screen
        name="Inicio"
        component={HomeTab}
        options={{
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={Home} color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Chats"
        component={ChatsTab}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View>
              <TabIcon Icon={MessageSquare} color={color} focused={focused} />
              {/* Globito con mensajes sin leer */}
              {!!token && <UnreadBadge count={unreadTotal} />}
            </View>
          ),
        }}
      />

      {/* Botón Central de Publicar (lo dibuja la barra propia) */}
      <Tab.Screen
        name="Publicar"
        component={AddProductScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault(); // Evitamos que abra como tab
            if (!token) {
              askToLogin('Inicia sesión para publicar artículos.');
              return;
            }
            navigation.navigate('AddProduct'); // Navegamos a la pantalla de publicar
          },
        })}
      />

      <Tab.Screen
        name="Favoritos"
        component={FavoritesTab}
        options={{
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={Heart} color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileTab}
        options={{
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={User} color={color} focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -6,
    right: -12,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: c.danger,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: c.card,
  },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
});
