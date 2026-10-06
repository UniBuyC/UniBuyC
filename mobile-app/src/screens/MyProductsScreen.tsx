import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity, Image } from 'react-native';
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
import { haptic } from '../utils/haptics';

export default function MyProductsScreen({ navigation }: any) {
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

  const handleDelete = (id: string) => {
    Alert.alert(
      'Eliminar Producto',
      '¿Estás seguro? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              if (token) await deleteProduct(id, token);
              haptic.success();
              // Lo quitamos de inmediato para que se vea la animación de salida
              setProducts(prev => prev.filter(p => p.id !== id));
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar');
            }
          }
        }
      ]
    );
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
        <Text style={styles.price}>${item.price}</Text>
        <Text style={styles.status}>
          {item.ratingCount ? `⭐ ${item.ratingAverage?.toFixed(1)} (${item.ratingCount})` : 'Sin calificaciones'}
        </Text>
      </View>
      <TouchableOpacity onPress={() => navigation.navigate('AddProduct', { product: item })} style={styles.actionButton}>
        {/* @ts-ignore */}
        <Pencil color="#10B981" size={22} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionButton}>
        {/* @ts-ignore */}
        <Trash2 color="#EF4444" size={22} />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  list: { padding: 16 },
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
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
  image: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#eee' },
  info: { flex: 1, marginLeft: 12 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  price: { fontSize: 14, color: '#059669', fontWeight: 'bold', marginTop: 2 },
  status: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  actionButton: { padding: 10 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#9CA3AF' },
});
