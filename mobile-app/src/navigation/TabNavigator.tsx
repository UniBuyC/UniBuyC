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
import PressableScale from '../components/anim/PressableScale';
import PopOnChange from '../components/anim/PopOnChange';
import { withTabFade } from '../components/anim/TabFade';
import { haptic } from '../utils/haptics';
// @ts-ignore
import { Home, MessageSquare, User, Heart, Plus } from 'lucide-react-native';

const Tab = createBottomTabNavigator();

// Pantallas con desvanecido al cambiar de pestaña (se crean una sola vez, fuera del componente)
const HomeTab = withTabFade(HomeScreen);
const ChatsTab = withTabFade(ChatListScreen);
const FavoritesTab = withTabFade(FavoritesScreen);
const ProfileTab = withTabFade(ProfileScreen);

// Componente personalizado para el botón central "+"
const CustomTabBarButton = ({ children, onPress }: any) => (
  <PressableScale
    scaleTo={0.88}
    style={{
      top: -20, // Lo subimos para que flote
      justifyContent: 'center',
      alignItems: 'center',
      ...styles.shadow
    }}
    onPress={onPress}
  >
    <View style={{
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#10B981', // Verde UAM
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      {children}
    </View>
  </PressableScale>
);

// Icono de pestaña que rebota al seleccionarse
const TabIcon = ({ Icon, color, focused }: { Icon: any; color: string; focused: boolean }) => (
  <PopOnChange trigger={focused} when={focused} scale={1.2}>
    <Icon color={color} size={24} />
  </PopOnChange>
);

// Globo de no leídos que rebota cada vez que cambia el número
const UnreadBadge = ({ count }: { count: number }) => {
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
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          height: 60 + bottomSpace,
          paddingBottom: bottomSpace,
          paddingTop: 8,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          backgroundColor: 'white',
          position: 'absolute',
          bottom: 0,
          elevation: 5,
          borderTopWidth: 0,
        }
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

      {/* Botón Central de Publicar */}
      <Tab.Screen
        name="Publicar"
        component={AddProductScreen} // Esto abre la pantalla como tab, idealmente sería un modal
        options={{
          tabBarIcon: () => (
            // @ts-ignore
            <Plus color="white" size={30} />
          ),
          tabBarButton: (props) => (
            <CustomTabBarButton {...props} />
          ),
          tabBarLabel: () => null // Sin texto
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault(); // Evitamos que abra como tab
            if (!token) {
              askToLogin('Inicia sesión para publicar artículos.');
              return;
            }
            navigation.navigate('AddProduct'); // Navegamos al Stack Modal
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

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -12,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
});
