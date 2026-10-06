import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useFavorites } from '../store/favoritesStore';
import { ProductCard } from '../components/ProductCard';
import ScreenHeader from '../components/ScreenHeader';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
// @ts-ignore
import { Heart, Star } from 'lucide-react-native';

export default function FavoritesScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<'items' | 'sellers'>('items');
  const { favoriteProducts, favoriteSellers } = useFavorites();
  const tabBarHeight = useBottomTabBarHeight();

  const renderSeller = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.sellerCard}
      onPress={() => navigation.navigate('SellerProfile', { seller: { id: item.id, fullName: item.fullName } })}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.fullName.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.sellerInfo}>
        <Text style={styles.sellerName}>{item.fullName}</Text>
        {item.rating > 0 && (
          <View style={styles.ratingRow}>
            {/* @ts-ignore */}
            <Star size={12} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.ratingText}> {item.rating.toFixed(1)}</Text>
          </View>
        )}
      </View>
      {/* @ts-ignore */}
      <Heart size={20} color="#EF4444" fill="#EF4444" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Favoritos" />

      {/* TABS SUPERIORES */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'items' && styles.activeTab]}
          onPress={() => setActiveTab('items')}
        >
          <Text style={[styles.tabText, activeTab === 'items' && styles.activeTabText]}>Artículos</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'sellers' && styles.activeTab]}
          onPress={() => setActiveTab('sellers')}
        >
          <Text style={[styles.tabText, activeTab === 'sellers' && styles.activeTabText]}>Vendedores</Text>
        </TouchableOpacity>
      </View>

      {/* CONTENIDO */}
      <View style={styles.content}>
        {activeTab === 'items' ? (
          <FlatList
            // SOLUCIÓN AQUÍ: Agregamos una key única para forzar el re-render
            key="grid-2-columns" 
            data={favoriteProducts}
            keyExtractor={item => item.id}
            renderItem={({ item, index }) => (
              <ProductCard 
                product={item}
              index={index} 
                onPress={() => navigation.navigate('ProductDetail', { product: item })} 
              />
            )}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
            ListEmptyComponent={<Text style={styles.emptyText}>No tienes artículos favoritos</Text>}
          />
        ) : (
          <FlatList
            // SOLUCIÓN AQUÍ: Key diferente para la lista de 1 columna
            key="list-1-column"
            data={favoriteSellers}
            keyExtractor={item => item.id}
            renderItem={renderSeller}
            contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
            ListEmptyComponent={<Text style={styles.emptyText}>No sigues a ningún vendedor</Text>}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  tabsContainer: { flexDirection: 'row', padding: 15, backgroundColor: '#F9FAFB' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: '#E5E7EB' },
  activeTab: { backgroundColor: '#10B981' }, // Verde UAM
  tabText: { fontWeight: '600', color: '#6B7280' },
  activeTabText: { color: 'white' },
  content: { flex: 1, paddingHorizontal: 15 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#9CA3AF' },
  // Estilos de Tarjeta Vendedor
  sellerCard: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: 'white', borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#F3F4F6' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#374151' },
  sellerInfo: { flex: 1 },
  sellerName: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText: { fontSize: 12, color: '#6B7280', marginLeft: 4 },
});
