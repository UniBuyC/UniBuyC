import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
// @ts-ignore
import { Pencil, Trash2 } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { getMyProducts, deleteProduct } from '../api/products';
import { Product } from '../types';
import { resolveImageUrl } from '../api/apiClient';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import PressableScale from '../components/anim/PressableScale';
import { ListSkeleton } from '../components/anim/Skeleton';
import { toast, confirm } from '../store/feedbackStore';
import { STATUS_LABEL } from '../utils/productStatus';
import { useTheme, useThemedStyles, ThemeColors } from '../theme';

export default function MyProductsScreen({ navigation }: any) {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { token } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    if (!token) return;
    // Solo mostramos siluetas la primera vez; al regresar se actualiza sin parpadeo
    if (!products.length) setLoading(true);
    try {
      const data = await getMyProducts(token);
      setProducts(data);
    } catch (error) {
      console.log('Error', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      icon: 'danger',
      title: '¿Eliminar publicación?',
      message: 'Dejará de aparecer en la app. Los chats sobre este producto se conservan como registro, pero ya no se podrán enviar mensajes.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      destructive: true,
    });
    if (!ok || !token) return;
    try {
      await deleteProduct(id, token);
      // Lo quitamos de inmediato para que se vea la animación de salida
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Publicación eliminada');
    } catch (error) {
      toast.error('No se pudo eliminar', 'Intenta de nuevo');
    }
  };

  const renderItem = ({ item, index }: { item: Product; index: number }) => (
    // Al borrar uno, se desvanece y los demás suben a ocupar su lugar
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 8) * 50).duration(300)}
      exiting={FadeOut.duration(200)}
      layout={LinearTransition.springify().damping(18)}
    >
    <PressableScale
      scaleTo={0.98}
      style={styles.card}
      onPress={() => navigation.navigate('ProductDetail', { product: item })}
    >
      <Image source={{ uri: resolveImageUrl(item.image) }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>${item.price}</Text>
          {item.status && (
            <View style={[styles.statusChip, { backgroundColor: STATUS_LABEL[item.status].background }]}>
              <Text style={[styles.statusChipText, { color: STATUS_LABEL[item.status].color }]}>
                {STATUS_LABEL[item.status].text}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.status}>
          {item.ratingCount ? `⭐ ${item.ratingAverage?.toFixed(1)} (${item.ratingCount})` : 'Sin calificaciones'}
        </Text>
      </View>
      {/* Los vendidos ya no se editan: quedan como registro */}
      {item.status !== 'SOLD' && (
        <TouchableOpacity onPress={() => navigation.navigate('AddProduct', { product: item })} style={styles.actionButton}>
          {/* @ts-ignore */}
          <Pencil color={c.primary} size={22} />
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionButton}>
        {/* @ts-ignore */}
        <Trash2 color={c.danger} size={22} />
      </TouchableOpacity>
    </PressableScale>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ListSkeleton square />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No tienes productos en venta.</Text>
          }
        />
      )}
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  list: { padding: 16 },
  card: {
    flexDirection: 'row',
    backgroundColor: c.card,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  image: { width: 60, height: 60, borderRadius: 8, backgroundColor: c.surface },
  info: { flex: 1, marginLeft: 12 },
  title: { fontSize: 16, fontWeight: 'bold', color: c.text },
  price: { fontSize: 14, color: c.primaryText, fontWeight: 'bold' },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  statusChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 8 },
  statusChipText: { fontSize: 11, fontWeight: 'bold' },
  status: { fontSize: 12, color: c.textMuted, marginTop: 2 },
  actionButton: { padding: 10 },
  emptyText: { textAlign: 'center', marginTop: 50, color: c.textFaint },
});
