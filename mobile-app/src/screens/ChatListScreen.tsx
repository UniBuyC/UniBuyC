import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
// @ts-ignore
import { MessageSquare } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { goToLogin } from '../navigation/navigationRef';
import ScreenHeader from '../components/ScreenHeader';
import SearchBar from '../components/SearchBar';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import PressableScale from '../components/anim/PressableScale';
import PopOnChange from '../components/anim/PopOnChange';
import { ListSkeleton } from '../components/anim/Skeleton';
import { Conversation } from '../types';

export default function ChatListScreen({ navigation }: any) {
  const { token, user } = useAuthStore();
  // Las conversaciones las mantiene al día el store (se consulta cada pocos segundos)
  const { conversations, loaded, refresh } = useChatStore();
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const tabBarHeight = useBottomTabBarHeight();

  // Esta función se ejecuta cada vez que la pantalla recibe el foco (entras a la pestaña)
  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [token])
  );

  const loadConversations = async () => {
    if (!token || !user) return;
    try {
      await refresh(token, user.id);
    } catch (error) {
      console.log('Error cargando chats', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Nombre de la otra persona (comparamos por id, no por nombre)
  const otherPersonName = (chat: Conversation) =>
    chat.buyerId === user?.id ? chat.seller.fullName : chat.buyer.fullName;

  const handlePress = (chat: Conversation) => {
    navigation.navigate('Chat', {
      conversationId: chat.id,
      title: otherPersonName(chat)
    });
  };

  // Buscar por nombre de la persona o por el producto
  const term = search.trim().toLowerCase();
  const visibleConversations = term
    ? conversations.filter((c) =>
        otherPersonName(c).toLowerCase().includes(term) ||
        c.product?.title.toLowerCase().includes(term))
    : conversations;

  const formatTime = (date?: string) => {
    if (!date) return '';
    const d = new Date(date);
    const isToday = d.toDateString() === new Date().toDateString();
    return isToday
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { day: '2-digit', month: 'short' });
  };

  const renderItem = ({ item, index }: { item: Conversation; index: number }) => {
    const name = otherPersonName(item);
    const last = item.messages[0];
    const lastMessage = last
      ? `${last.senderId === user?.id ? 'Tú: ' : ''}${last.content}`
      : 'Conversación iniciada';
    const hasUnread = item.unreadCount > 0;

    return (
      // Entrada escalonada; cuando un chat sube al inicio por un mensaje nuevo, se reacomoda con animación
      <Animated.View
        entering={FadeInDown.delay(Math.min(index, 8) * 40).duration(300)}
        layout={LinearTransition.springify().damping(18)}
      >
      <PressableScale scaleTo={0.98} style={styles.chatItem} onPress={() => handlePress(item)}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.name, hasUnread && styles.unreadName]} numberOfLines={1}>{name}</Text>
            <Text style={[styles.time, hasUnread && styles.unreadTime]}>
              {formatTime(last?.createdAt)}
            </Text>
          </View>
          {/* Si hay producto asociado, lo mostramos */}
          {item.product && (
            <Text style={styles.productTag} numberOfLines={1}>{item.product.title}</Text>
          )}
          <View style={styles.messageRow}>
            <Text style={[styles.message, hasUnread && styles.unreadMessage]} numberOfLines={1}>
              {lastMessage}
            </Text>
            {hasUnread && (
              <PopOnChange trigger={item.unreadCount} scale={1.3} style={styles.badge}>
                <Text style={styles.badgeText}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text>
              </PopOnChange>
            )}
          </View>
        </View>
      </PressableScale>
      </Animated.View>
    );
  };

  // Invitado: no tiene chats
  if (!token) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Mensajes" />
        <View style={styles.emptyContainer}>
          {/* @ts-ignore */}
          <MessageSquare size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>Tus mensajes aparecerán aquí</Text>
          <Text style={styles.emptySubtext}>Inicia sesión para contactar vendedores</Text>
          <TouchableOpacity style={styles.loginButton} onPress={goToLogin}>
            <Text style={styles.loginButtonText}>Iniciar sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Mensajes">
        <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar conversación..." />
      </ScreenHeader>
      {!loaded ? (
        <ListSkeleton />
      ) : (
        <FlatList
          data={visibleConversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + 20 }]}
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadConversations(); }} colors={['#10B981']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {/* @ts-ignore */}
              <MessageSquare size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>{term ? 'Sin resultados' : 'No tienes mensajes aún'}</Text>
              <Text style={styles.emptySubtext}>
                {term ? 'Ninguna conversación coincide con tu búsqueda' : 'Contacta a un vendedor para empezar'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  list: { paddingHorizontal: 10 },
  chatItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  content: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  name: { flex: 1, fontSize: 16, fontWeight: '600', color: '#111827', marginRight: 8 },
  unreadName: { fontWeight: '800' },
  time: { fontSize: 12, color: '#9CA3AF' },
  unreadTime: { color: '#10B981', fontWeight: '700' },
  productTag: {
    alignSelf: 'flex-start',
    fontSize: 10,
    color: '#059669',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  messageRow: { flexDirection: 'row', alignItems: 'center' },
  message: { flex: 1, fontSize: 14, color: '#6B7280' },
  unreadMessage: { color: '#111827', fontWeight: '600' },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  badgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 30 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#374151', marginTop: 20 },
  emptySubtext: { fontSize: 14, color: '#9CA3AF', marginTop: 8, textAlign: 'center' },
  loginButton: { backgroundColor: '#10B981', paddingHorizontal: 30, paddingVertical: 14, borderRadius: 12, marginTop: 24 },
  loginButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
