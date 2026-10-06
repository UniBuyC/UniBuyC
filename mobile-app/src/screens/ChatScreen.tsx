import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Keyboard, Pressable
} from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInLeft, FadeInRight } from 'react-native-reanimated';
// @ts-ignore
import { Send } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { getChatMessages, sendMessage } from '../api/chat';
import { Message } from '../types';
import PressableScale from '../components/anim/PressableScale';
import { haptic } from '../utils/haptics';

// Mensaje que escribí y todavía no confirma el servidor
interface PendingMessage {
  tempId: string;
  content: string;
  createdAt: string;
  failed: boolean;
  // Cuántos mensajes había al enviarlo (para reconocerlo si llega antes por la consulta periódica)
  afterCount: number;
}

type ChatItem = Message & { pending?: boolean; failed?: boolean; tempId?: string };

export default function ChatScreen({ route }: any) {
  const { conversationId } = route.params;
  const { token, user } = useAuthStore();
  const { setActiveConversation, refresh } = useChatStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Mensajes que ya se mostraron: solo animamos los que llegan después de abrir el chat
  const seenIds = useRef(new Set<string>());
  const loadedOnce = useRef(false);

  // Altura del encabezado: el teclado debe empujar el contenido debajo de él
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Mientras este chat esté abierto no mostramos avisos de sus mensajes
    setActiveConversation(conversationId);
    loadMessages(true);
    const intervalId = setInterval(() => {
      loadMessages();
    }, 3000);
    return () => {
      clearInterval(intervalId);
      setActiveConversation(null);
    };
  }, [conversationId]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const loadMessages = async (first = false) => {
    if (!token) return;
    try {
      // Al pedir los mensajes el backend los marca como leídos
      const data = await getChatMessages(conversationId, token);
      if (!loadedOnce.current) {
        // Los mensajes que ya existían al abrir no se animan
        data.forEach((m) => seenIds.current.add(m.id));
        loadedOnce.current = true;
      }
      setMessages(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(data)) return data;
        return prev;
      });
      // Actualizamos el contador de no leídos de inmediato
      if (first && user) refresh(token, user.id).catch(() => {});
    } catch (error) {
      console.log('Error silenciado cargando mensajes');
    }
  };

  const deliver = async (item: PendingMessage) => {
    if (!token) return;
    try {
      const saved = await sendMessage(conversationId, item.content, token);
      // El mensaje confirmado reemplaza al pendiente sin volver a animarse
      seenIds.current.add(saved.id);
      setMessages(prev => (prev.some(m => m.id === saved.id) ? prev : [...prev, saved]));
      setPending(prev => prev.filter(p => p.tempId !== item.tempId));
    } catch (error) {
      console.log('Error enviando mensaje', error);
      haptic.error();
      setPending(prev => prev.map(p => (p.tempId === item.tempId ? { ...p, failed: true } : p)));
    }
  };

  const handleSend = () => {
    const content = inputText.trim();
    if (!content || !token) return;
    setInputText('');
    haptic.light();

    // Lo mostramos de inmediato; se confirma cuando responda el servidor
    const item: PendingMessage = {
      tempId: `temp-${Date.now()}`,
      content,
      createdAt: new Date().toISOString(),
      failed: false,
      afterCount: messages.length,
    };
    setPending(prev => [...prev, item]);
    deliver(item);
  };

  const retry = (tempId: string) => {
    const item = pending.find(p => p.tempId === tempId);
    if (!item) return;
    setPending(prev => prev.map(p => (p.tempId === tempId ? { ...p, failed: false } : p)));
    deliver({ ...item, failed: false });
  };

  // Si el servidor ya devolvió el mensaje pendiente, mostramos solo la versión confirmada
  const confirmed = (p: PendingMessage) =>
    messages.slice(p.afterCount).find(m => m.senderId === user?.id && m.content === p.content);
  const visiblePending = pending.filter(p => {
    const match = !p.failed && confirmed(p);
    if (match) seenIds.current.add(match.id); // ya se animó como pendiente
    return !match;
  });

  const items: ChatItem[] = [
    ...messages,
    ...visiblePending.map(p => ({
      id: p.tempId,
      tempId: p.tempId,
      content: p.content,
      senderId: user?.id ?? '',
      conversationId,
      createdAt: p.createdAt,
      pending: !p.failed,
      failed: p.failed,
    })),
  ];

  const renderMessage = ({ item }: { item: ChatItem }) => {
    const isMe = item.senderId === user?.id;
    // Solo los mensajes nuevos entran animados, cada uno desde su lado
    const animate = loadedOnce.current && !seenIds.current.has(item.id);
    seenIds.current.add(item.id);
    const entering = animate
      ? (isMe ? FadeInRight : FadeInLeft).springify().damping(18).stiffness(180)
      : undefined;

    const status = item.failed ? '  ⚠' : item.pending ? '  🕓' : item.readAt ? '  ✓✓' : '  ✓';

    return (
      <Animated.View entering={entering} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
        <Pressable
          disabled={!item.failed}
          onPress={() => item.tempId && retry(item.tempId)}
          style={[
            styles.messageBubble,
            isMe ? styles.myMessage : styles.otherMessage,
            item.pending && styles.pendingMessage,
            item.failed && styles.failedMessage,
          ]}
        >
          <Text style={[styles.messageText, isMe ? styles.myText : styles.otherText]}>
            {item.content}
          </Text>
          <Text style={[styles.timeText, isMe ? { color: '#E0F2F1' } : { color: '#9CA3AF' }]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {isMe ? status : ''}
          </Text>
        </Pressable>
        {item.failed && <Text style={styles.failedText}>No se envió · Toca para reintentar</Text>}
      </Animated.View>
    );
  };

  const canSend = inputText.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      // 'padding' en ambas plataformas: Android ya no redimensiona la ventana (edge-to-edge)
      behavior="padding"
      keyboardVerticalOffset={headerHeight}
    >
      <FlatList
        // Lista invertida: el mensaje más nuevo queda siempre abajo, junto al campo de texto
        inverted
        data={[...items].reverse()}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      />

      <View
        style={[
          styles.inputContainer,
          // Con el teclado cerrado dejamos espacio para la barra de inicio del iPhone
          { paddingBottom: keyboardVisible ? 10 : Math.max(insets.bottom, 10) },
        ]}
      >
        <TextInput
          style={styles.input}
          placeholder="Escribe un mensaje..."
          placeholderTextColor="#9CA3AF"
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <PressableScale
          onPress={handleSend}
          scaleTo={0.85}
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
          disabled={!canSend}
        >
          {/* @ts-ignore */}
          <Send color="white" size={20} />
        </PressableScale>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  listContent: {
    padding: 15,
    flexGrow: 1,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  myMessage: {
    backgroundColor: '#10B981',
    borderBottomRightRadius: 2,
  },
  otherMessage: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pendingMessage: { opacity: 0.6 },
  failedMessage: { backgroundColor: '#F87171' },
  failedText: { fontSize: 11, color: '#EF4444', alignSelf: 'flex-end', marginTop: -6, marginBottom: 10 },
  messageText: { fontSize: 15 },
  myText: { color: 'white' },
  otherText: { color: '#1F2937' },
  timeText: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 10,
    backgroundColor: 'white',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
    marginRight: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#A7F3D0',
  },
});
