import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/authStore';
import BrandLogo from '../components/BrandLogo';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TabNavigator from './TabNavigator'; 
import AddProductScreen from '../screens/AddProductScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import ChatScreen from '../screens/ChatScreen';
import SellerProfileScreen from '../screens/SellerProfileScreen'; // <--- 1. IMPORTAR
import MyProductsScreen from '../screens/MyProductsScreen';
import ReportProductScreen from '../screens/ReportProductScreen';
import MessageBanner from '../components/MessageBanner';
import ToastHost from '../components/feedback/ToastHost';
import DialogHost from '../components/feedback/DialogHost';
import ActionSheetHost from '../components/feedback/ActionSheetHost';
import { navigationRef } from './navigationRef';
import { Product } from '../types';
import { useTheme } from '../theme';
import { Platform } from 'react-native';
import HeaderBack from '../components/HeaderBack';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  AddProduct: { product?: Product } | undefined; // Con producto = modo edición
  ProductDetail: { product: Product };
  Chat: { conversationId: string; title: string }; 
  SellerProfile: { seller: { id: string; fullName: string } }; // <--- 2. DEFINIR TIPO
  MyProducts: undefined;
  ReportProduct: { product: Product };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { colors, isDark } = useTheme();
  const isLoading = useAuthStore((state) => state.isLoading);
  const token = useAuthStore((state) => state.token);
  const checkSession = useAuthStore((state) => state.checkSession);

  // Al abrir la app revisamos si hay una sesión guardada
  useEffect(() => {
    checkSession();
  }, []);

  // Pantalla breve mientras se lee la sesión guardada
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <BrandLogo size={96} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      </View>
    );
  }

  // Tema de la navegación (encabezados, fondos entre transiciones) según modo claro/oscuro
  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
  };

  return (
    <>
    {/* Íconos de la barra de estado claros u oscuros según el tema */}
    <StatusBar style={isDark ? 'light' : 'dark'} />
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      <Stack.Navigator
        id="RootStack"
        // Con sesión guardada entramos directo a la app
        initialRouteName={token ? 'MainTabs' : 'Login'}
        // Transición por defecto: deslizar desde la derecha, con gesto para regresar en toda la pantalla
        screenOptions={{
          animation: 'slide_from_right',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
          // En web la flecha estándar no carga: usamos una vectorial (en el celular queda la nativa)
          ...(Platform.OS === 'web' ? { headerLeft: () => <HeaderBack /> } : {}),
        }}
      >
        
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false, animation: 'fade' }} 
        />

        <Stack.Screen 
          name="Register" 
          component={RegisterScreen} 
          options={{ headerShown: false }} 
        />
        
        <Stack.Screen 
          name="MainTabs" 
          component={TabNavigator} 
          // Al entrar después del login la app aparece con un desvanecido
          options={{ headerShown: false, animation: 'fade' }} 
        />

        <Stack.Screen 
          name="AddProduct" 
          component={AddProductScreen} 
          options={({ route }: any) => ({ 
            title: route.params?.product ? 'Editar Publicación' : 'Nueva Publicación',
            // Publicar es una acción: sube desde abajo como una hoja
            animation: 'slide_from_bottom',
            headerTintColor: colors.primary,
          })}
        />
        
        <Stack.Screen 
          name="ProductDetail" 
          component={ProductDetailScreen} 
          options={{ headerShown: false }} // Ocultamos barra porque usamos diseño personalizado
        />

        <Stack.Screen 
          name="Chat" 
          component={ChatScreen} 
          options={({ route }: any) => ({ 
            title: route.params.title || 'Chat',
            headerTintColor: colors.primary,
          })}
        />

        {/* 3. AGREGAR LA PANTALLA AL STACK */}
        <Stack.Screen 
          name="SellerProfile" 
          component={SellerProfileScreen} 
          options={{ headerShown: false }} // Diseño personalizado
        />

        <Stack.Screen 
          name="ReportProduct"
          component={ReportProductScreen}
          options={{
            title: 'Reportar publicación',
            headerTintColor: colors.primary,
            animation: 'slide_from_bottom',
          }}
        />

        <Stack.Screen
          name="MyProducts" 
          component={MyProductsScreen} 
          options={{ 
            title: 'Mis Publicaciones',
            headerTintColor: colors.primary,
          }}
        />

      </Stack.Navigator>
    </NavigationContainer>
    {/* Aviso de mensajes nuevos, por encima de todas las pantallas */}
    <MessageBanner />
    {/* Avisos, confirmaciones y hojas de opciones propias (reemplazan a Alert) */}
    <ToastHost />
    <ActionSheetHost />
    <DialogHost />
    </>
  );
}
