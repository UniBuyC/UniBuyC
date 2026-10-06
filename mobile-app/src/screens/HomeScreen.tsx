import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore
import { ChevronRight } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { getProducts } from '../api/products';
import { getSellers } from '../api/users';
import { Product, Seller } from '../types';
import { ProductCard } from '../components/ProductCard';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import PressableScale from '../components/anim/PressableScale';
import { ProductGridSkeleton, ListSkeleton } from '../components/anim/Skeleton';
import { haptic } from '../utils/haptics';
import SearchBar from '../components/SearchBar';
import Avatar from '../components/Avatar';
import { PRODUCT_CATEGORIES } from '../constants';
import { useTheme, useThemedStyles, ThemeColors } from '../theme';

const CATEGORIES = ['Todos', ...PRODUCT_CATEGORIES];

type Mode = 'products' | 'sellers';

export default function HomeScreen({ navigation }: any) {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight(); // La barra de pestañas flota sobre el contenido
  const { user } = useAuthStore();

  const [mode, setMode] = useState<Mode>('products');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setAllProducts(data);
      filterData(data, searchQuery, selectedCategory);
    } catch (error) {
      console.log('Error cargando productos', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadSellers = async (search = searchQuery) => {
    try {
      setSellers(await getSellers(search));
    } catch (error) {
      console.log('Error cargando vendedores', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const reload = () => (mode === 'products' ? loadProducts() : loadSellers());

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [mode])
  );

  // Lógica de Filtrado
  const filterData = (data: Product[], search: string, category: string) => {
    let result = data;

    // 1. Filtro por Categoría
    // "Otros" también incluye categorías viejas que no están en la lista (p. ej. "Varios")
    if (category === 'Otros') {
      result = result.filter(p => p.category === 'Otros' || !PRODUCT_CATEGORIES.includes(p.category));
    } else if (category !== 'Todos') {
      result = result.filter(p => p.category === category);
    }

    // 2. Filtro por Texto
    if (search.trim()) {
      result = result.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredProducts(result);
  };

  // Efecto para aplicar filtros cuando cambia la búsqueda o categoría
  useEffect(() => {
    filterData(allProducts, searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory]);

  // En modo vendedores la búsqueda va al servidor (con una pequeña espera al teclear)
  useEffect(() => {
    if (mode !== 'sellers') return;
    const timeoutId = setTimeout(() => loadSellers(searchQuery), 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, mode]);

  const changeMode = (next: Mode) => {
    if (next === mode) return;
    setLoading(true);
    setMode(next);
  };

  const renderSeller = ({ item, index }: { item: Seller; index: number }) => {
    const isMe = item.id === user?.id;
    return (
      <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 50).duration(300)}>
      <PressableScale
        style={styles.sellerCard}
        onPress={() => navigation.navigate('SellerProfile', { seller: { id: item.id, fullName: item.fullName } })}
      >
        <Avatar seed={item.id} size={48} style={{ marginRight: 14 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.sellerName} numberOfLines={1}>
            {item.fullName}{isMe ? ' (tú)' : ''}
          </Text>
          <Text style={styles.sellerMeta}>
            {item.productCount} {item.productCount === 1 ? 'producto' : 'productos'}
            {item.ratingCount > 0 ? `  ·  ⭐ ${item.ratingAverage.toFixed(1)} (${item.ratingCount})` : ''}
          </Text>
        </View>
        {/* @ts-ignore */}
        <ChevronRight color={c.textDisabled} size={20} />
      </PressableScale>
      </Animated.View>
    );
  };

  const refreshControl = (
    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); reload(); }} colors={['#10B981']} />
  );

  return (
    <View style={styles.container}>
      {/* --- HEADER FIJO --- */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.brand}>UniByC</Text>

        {/* Barra de Búsqueda */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={mode === 'products' ? 'Buscar productos...' : 'Buscar por nombre o matrícula...'}
          style={styles.searchBar}
        />

        {/* Productos / Vendedores */}
        <View style={styles.segment}>
          {(['products', 'sellers'] as Mode[]).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.segmentItem, mode === m && styles.segmentItemActive]}
              onPress={() => { haptic.selection(); changeMode(m); }}
            >
              <Text style={[styles.segmentText, mode === m && styles.segmentTextActive]}>
                {m === 'products' ? 'Productos' : 'Vendedores'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Categorías (Scroll Horizontal) */}
        {mode === 'products' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryPill,
                  selectedCategory === cat && styles.categoryPillActive
                ]}
                onPress={() => { haptic.selection(); setSelectedCategory(cat); }}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory === cat && styles.categoryTextActive
                ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* --- LISTA --- */}
      {loading ? (
        // Siluetas mientras carga, con la forma del contenido real
        mode === 'products' ? <ProductGridSkeleton /> : <ListSkeleton />
      ) : mode === 'products' ? (
        <FlatList
          key="products-grid"
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => navigation.navigate('ProductDetail', { product: item })}
            />
          )}
          numColumns={2} // <--- ESTO HACE LA MAGIA DEL GRID
          columnWrapperStyle={styles.columnWrapper} // Espacio entre columnas
          contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + 20 }]}
          keyboardDismissMode="on-drag"
          refreshControl={refreshControl}
          ListEmptyComponent={
            <Animated.View entering={FadeIn} style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No se encontraron productos :(</Text>
            </Animated.View>
          }
        />
      ) : (
        <FlatList
          key="sellers-list"
          data={sellers}
          keyExtractor={(item) => item.id}
          renderItem={renderSeller}
          contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + 20 }]}
          keyboardDismissMode="on-drag"
          refreshControl={refreshControl}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'Ningún usuario coincide con tu búsqueda' : 'Aún no hay usuarios registrados'}
              </Text>
            </View>
          }
        />
      )}

    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  headerContainer: {
    backgroundColor: c.card,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: c.borderLight,
  },
  brand: {
    fontSize: 26,
    fontWeight: 'bold',
    color: c.primary,
    marginHorizontal: 16,
  },
  searchBar: {
    marginHorizontal: 16,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: c.muted,
    borderRadius: 10,
    padding: 3,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentItemActive: {
    backgroundColor: c.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentText: {
    fontSize: 14,
    color: c.textMuted,
    fontWeight: '500',
  },
  segmentTextActive: {
    color: c.text,
    fontWeight: 'bold',
  },
  categoriesContainer: {
    paddingHorizontal: 16,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: c.muted,
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: c.primary, // Verde Activo
  },
  categoryText: {
    fontSize: 13,
    color: c.textMuted,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between', // Separa las columnas
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: c.textFaint,
    fontSize: 16,
    textAlign: 'center',
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: c.borderLight,
  },
  sellerName: { fontSize: 16, fontWeight: 'bold', color: c.text },
  sellerMeta: { fontSize: 13, color: c.textMuted, marginTop: 3 },
});
