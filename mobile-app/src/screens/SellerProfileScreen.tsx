import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
// @ts-ignore
import { Heart, MessageCircle, Star, ArrowLeft } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { useFavorites } from '../store/favoritesStore';
import { getProducts } from '../api/products'; // Usaremos esto para filtrar por vendedor
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SellerProfileScreen({ route, navigation }: any) {
  const { seller } = route.params;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  
  const { isSellerFavorite, toggleSellerFavorite } = useFavorites();
  const isFav = isSellerFavorite(seller.id);
  const isMe = useAuthStore((state) => state.user?.id) === seller.id; // No te puedes seguir a ti mismo

  useEffect(() => {
    loadSellerProducts();
  }, []);

  const loadSellerProducts = async () => {
    try {
      // Nota: En una app real, haríamos un endpoint específico /products/seller/:id
      // Por ahora, traemos todos y filtramos en el cliente para simularlo
      const allProducts = await getProducts();
      const sellerProducts = allProducts.filter(p => p.sellerId === seller.id);
      setProducts(sellerProducts);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // Calificación del vendedor = promedio de todas las calificaciones de sus productos
  const ratingCount = products.reduce((sum, p) => sum + (p.ratingCount || 0), 0);
  const ratingAverage = ratingCount
    ? products.reduce((sum, p) => sum + (p.ratingAverage || 0) * (p.ratingCount || 0), 0) / ratingCount
    : 0;

  return (
    <View style={styles.container}>
      {/* Header Personalizado */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          {/* @ts-ignore */}
          <ArrowLeft color="#1F2937" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil del Vendedor</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <FlatList
        ListHeaderComponent={
          <View style={styles.profileInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{seller.fullName.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.name}>{seller.fullName}</Text>
            <View style={styles.ratingRow}>
              {/* @ts-ignore */}
              <Star size={16} color="#F59E0B" fill={ratingCount ? '#F59E0B' : 'transparent'} />
              <Text style={styles.ratingText}>
                {ratingCount
                  ? `${ratingAverage.toFixed(1)} (${ratingCount} ${ratingCount === 1 ? 'calificación' : 'calificaciones'})`
                  : 'Sin calificaciones'}
                {`  ·  ${products.length} ${products.length === 1 ? 'producto' : 'productos'}`}
              </Text>
            </View>

            <View style={styles.actionsRow}>
              {!isMe && (
              <TouchableOpacity 
                style={[styles.actionButton, isFav ? styles.followingButton : styles.followButton]}
                onPress={() => toggleSellerFavorite({ id: seller.id, fullName: seller.fullName, rating: ratingAverage })}
              >
                {/* @ts-ignore */}
                <Heart size={20} color={isFav ? "white" : "#10B981"} fill={isFav ? "white" : "transparent"} />
                <Text style={[styles.actionText, isFav && { color: 'white' }]}>
                  {isFav ? 'Siguiendo' : 'Seguir'}
                </Text>
              </TouchableOpacity>
              )}
            </View>

            <Text style={styles.sectionTitle}>Productos Publicados</Text>
          </View>
        }
        data={products}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <ProductCard 
            product={item}
              index={index} 
            onPress={() => navigation.push('ProductDetail', { product: item })} 
          />
        )}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
        ListEmptyComponent={loading ? <ActivityIndicator color="#10B981" /> : <Text style={styles.emptyText}>No hay productos activos</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingBottom: 10 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  iconButton: { padding: 5 },
  profileInfo: { alignItems: 'center', padding: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#6B7280' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  ratingText: { marginLeft: 5, color: '#6B7280' },
  actionsRow: { flexDirection: 'row', marginTop: 15, marginBottom: 30 },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#10B981', marginHorizontal: 5 },
  followButton: { backgroundColor: 'white' },
  followingButton: { backgroundColor: '#10B981' },
  actionText: { marginLeft: 8, fontWeight: '600', color: '#10B981' },
  sectionTitle: { alignSelf: 'flex-start', fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#374151' },
  list: { paddingHorizontal: 15 },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#9CA3AF' }
});
