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
import Avatar from '../components/Avatar';
import { useTheme, useThemedStyles, ThemeColors } from '../theme';

export default function SellerProfileScreen({ route, navigation }: any) {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(createStyles);
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
          <ArrowLeft color={c.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil del Vendedor</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <FlatList
        ListHeaderComponent={
          <View style={styles.profileInfo}>
            <Avatar seed={seller.id} size={88} style={{ marginBottom: 10 }} />
            <Text style={styles.name}>{seller.fullName}</Text>
            <View style={styles.ratingRow}>
              {/* @ts-ignore */}
              <Star size={16} color={c.star} fill={ratingCount ? c.star : 'transparent'} />
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
                <Heart size={20} color={isFav ? "white" : c.primary} fill={isFav ? "white" : "transparent"} />
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
        ListEmptyComponent={loading ? <ActivityIndicator color={c.primary} /> : <Text style={styles.emptyText}>No hay productos activos</Text>}
      />
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.card },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingBottom: 10 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  iconButton: { padding: 5 },
  profileInfo: { alignItems: 'center', padding: 20 },
  name: { fontSize: 22, fontWeight: 'bold', color: c.text },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  ratingText: { marginLeft: 5, color: c.textMuted },
  actionsRow: { flexDirection: 'row', marginTop: 15, marginBottom: 30 },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: c.primary, marginHorizontal: 5 },
  followButton: { backgroundColor: c.card },
  followingButton: { backgroundColor: c.primary },
  actionText: { marginLeft: 8, fontWeight: '600', color: c.primary },
  sectionTitle: { alignSelf: 'flex-start', fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: c.textSecondary },
  list: { paddingHorizontal: 15 },
  emptyText: { textAlign: 'center', marginTop: 20, color: c.textFaint }
});
