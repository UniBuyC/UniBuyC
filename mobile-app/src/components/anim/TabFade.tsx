import React, { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';

// Las pestañas no traen animación al cambiar; esto hace que el contenido
// aparezca con un desvanecido y un pequeño desplazamiento cada vez que se enfoca.
export function withTabFade<P extends object>(Screen: React.ComponentType<P>) {
  return function TabFadeScreen(props: P) {
    const progress = useSharedValue(1);

    useFocusEffect(
      useCallback(() => {
        progress.value = 0;
        progress.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
      }, [])
    );

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: progress.value,
      transform: [{ translateY: (1 - progress.value) * 8 }],
    }));

    return (
      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        <Screen {...props} />
      </Animated.View>
    );
  };
}
