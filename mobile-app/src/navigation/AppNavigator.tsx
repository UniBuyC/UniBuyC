import React from 'react';
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
import MessageBanner from '../components/MessageBanner';
import ToastHost from '../components/feedback/ToastHost';
import DialogHost from '../components/feedback/DialogHost';
import ActionSheetHost from '../components/feedback/ActionSheetHost';
import { navigationRef } from './navigationRef';
import { Product } from '../types';
import { useTheme } from '../theme';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  AddProduct: { product?: Product } | undefined; // Con producto = modo edición
  ProductDetail: { product: Product };
  Chat: { conversationId: string; title: string }; 
  SellerProfile: { seller: { id: string; fullName: string } }; // <--- 2. DEFINIR TIPO
  MyProducts: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { colors, isDark } = useTheme();

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
        initialRouteName="Login"
        // Transición por defecto: deslizar desde la derecha, con gesto para regresar en toda la pantalla
        screenOptions={{
          animation: 'slide_from_right',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
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
