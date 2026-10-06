import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useFavorites } from '../store/favoritesStore';
import { ProductCard } from '../components/ProductCard';
import ScreenHeader from '../components/ScreenHeader';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
// @ts-ignore
import { Heart, Star } from 'lucide-react-native';
import Avatar from '../components/Avatar';
import { useTheme, useThemedStyles, ThemeColors } from '../theme';

export default function FavoritesScreen({ navigation }: any) {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [activeTab, setActiveTab] = useState<'items' | 'sellers'>('items');
  const { favoriteProducts, favoriteSellers } = useFavorites();
  const tabBarHeight = useBottomTabBarHeight();

  const renderSeller = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.sellerCard}
      onPress={() => navigation.navigate('SellerProfile', { seller: { id: item.id, fullName: item.fullName } })}
    >
      <Avatar seed={item.id} size={50} style={{ marginRight: 15 }} />
      <View style={styles.sellerInfo}>
        <Text style={styles.sellerName}>{item.fullName}</Text>
        {item.rating > 0 && (
          <View style={styles.ratingRow}>
            {/* @ts-ignore */}
            <Star size={12} color={c.star} fill={c.star} />
            <Text style={styles.ratingText}> {item.rating.toFixed(1)}</Text>
          </View>
        )}
      </View>
      {/* @ts-ignore */}
      <Heart size={20} color={c.danger} fill={c.danger} />
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

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.card },
  tabsContainer: { flexDirection: 'row', padding: 15, backgroundColor: c.background },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: c.surface },
  activeTab: { backgroundColor: c.primary }, // Verde UAM
  tabText: { fontWeight: '600', color: c.textMuted },
  activeTabText: { color: 'white' },
  content: { flex: 1, paddingHorizontal: 15 },
  emptyText: { textAlign: 'center', marginTop: 50, color: c.textFaint },
  // Estilos de Tarjeta Vendedor
  sellerCard: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: c.card, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: c.borderLight },
  sellerInfo: { flex: 1 },
  sellerName: { fontSize: 16, fontWeight: 'bold', color: c.text },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText: { fontSize: 12, color: c.textMuted, marginLeft: 4 },
});
