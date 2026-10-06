import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { useTheme } from './src/theme';
import { WEB_MAX_WIDTH } from './src/utils/layout';

export default function App() {
  const { colors, isDark } = useTheme();
  const isWeb = Platform.OS === 'web';

  // En web, el fondo del documento sigue el tema: si el navegador deja algún hueco
  // (por ejemplo al abrir el teclado), no se ve una franja blanca
  useEffect(() => {
    if (!isWeb) return;
    const bg = isDark ? '#05070A' : '#E5E7EB';
    document.documentElement.style.backgroundColor = bg;
    document.body.style.backgroundColor = bg;
  }, [isDark]);

  return (
    <SafeAreaProvider>
      {/* En computadora (web) la app ocupa una columna centrada del ancho de un celular */}
      <View style={{ flex: 1, backgroundColor: isWeb ? (isDark ? '#05070A' : '#E5E7EB') : colors.background }}>
        <View
          style={
            isWeb
              ? { flex: 1, width: '100%', maxWidth: WEB_MAX_WIDTH, alignSelf: 'center', overflow: 'hidden', backgroundColor: colors.background }
              : { flex: 1 }
          }
        >
          {/* Aquí cargamos nuestro sistema de navegación */}
          <AppNavigator />
        </View>
      </View>
    </SafeAreaProvider>
  );
}
