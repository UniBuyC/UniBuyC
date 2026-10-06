import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, View, PanResponder, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
// @ts-ignore
import { MessageCircle } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { navigationRef } from '../navigation/navigationRef';
import { haptic } from '../utils/haptics';

const POLL_MS = 5000;
const VISIBLE_MS = 4000;
const HIDDEN_Y = -200;

// Revisa los chats cada pocos segundos (con sesión) y muestra un aviso arriba
// cuando llega un mensaje de una conversación que no está abierta.
// El aviso se puede deslizar hacia arriba para cerrarlo.
export default function MessageBanner() {
  const insets = useSafeAreaInsets();
  const { token, user } = useAuthStore();
  const { incoming, refresh, dismissIncoming, reset } = useChatStore();
  const translateY = useSharedValue(HIDDEN_Y);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Consulta periódica solo mientras haya sesión
  useEffect(() => {
    if (!token || !user) {
      reset();
      return;
    }
    const poll = () => refresh(token, user.id).catch(() => {});
    poll();
    const intervalId = setInterval(poll, POLL_MS);
    return () => clearInterval(intervalId);
  }, [token, user?.id]);

  const clearTimer = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = null;
  };

  const hide = () => {
    clearTimer();
    translateY.value = withTiming(HIDDEN_Y, { duration: 200 }, (finished) => {
      if (finished) runOnJS(dismissIncoming)();
    });
  };

  // Entrada con rebote y vibración cuando llega un mensaje nuevo
  useEffect(() => {
    if (!incoming) return;
    haptic.light();
    translateY.value = withSpring(0, { damping: 15, stiffness: 180 });
    clearTimer();
    hideTimer.current = setTimeout(hide, VISIBLE_MS);
    return clearTimer;
  }, [incoming]);

  // Arrastrar: hacia arriba lo cierra; hacia abajo se estira un poco y regresa
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 5,
      onPanResponderGrant: () => clearTimer(),
      onPanResponderMove: (_e, g) => {
        translateY.value = g.dy < 0 ? g.dy : g.dy * 0.2;
      },
      onPanResponderRelease: (_e, g) => {
        if (g.dy < -30 || g.vy < -0.5) {
          hide();
        } else {
          translateY.value = withSpring(0, { damping: 15, stiffness: 180 });
          hideTimer.current = setTimeout(hide, VISIBLE_MS);
        }
      },
    })
  ).current;

  const openChat = () => {
    if (!incoming) return;
    const { conversationId, senderName } = incoming;
    hide();
    if (navigationRef.isReady()) {
      navigationRef.navigate('Chat', { conversationId, title: senderName });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: translateY.value < -100 ? 0 : 1,
  }));

  if (!incoming) return null;

  return (
    <Animated.View
      style={[styles.wrapper, { paddingTop: insets.top + 8 }, animatedStyle]}
      {...panResponder.panHandlers}
    >
      <Pressable style={styles.banner} onPress={openChat}>
        <View style={styles.icon}>
          {/* @ts-ignore */}
          <MessageCircle color="white" size={20} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sender} numberOfLines={1}>{incoming.senderName}</Text>
          <Text style={styles.content} numberOfLines={2}>{incoming.content}</Text>
        </View>
      </Pressable>
      {/* Asa que indica que se puede deslizar */}
      <View style={styles.handle} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 12, zIndex: 100 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sender: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  content: { fontSize: 14, color: '#4B5563', marginTop: 2 },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.15)',
    marginTop: 6,
  },
});
