import React from 'react';
import { View, Text, Image, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Product } from '../types';
import { useAuthStore } from '../store/authStore';
import { useFavorites } from '../store/favoritesStore';
import { resolveImageUrl } from '../api/apiClient';
import PressableScale from './anim/PressableScale';
import PopOnChange from './anim/PopOnChange';
import { haptic } from '../utils/haptics';
// @ts-ignore
import { Heart } from 'lucide-react-native';

const { width } = Dimensions.get('window');
// Calculamos el ancho: (Pantalla - Padding total) / 2 columnas
const CARD_WIDTH = (width - 48) / 2;

interface Props {
  product: Product;
  onPress: () => void;
  // Posición en la lista: las primeras tarjetas entran en cascada
  index?: number;
}

export const ProductCard = ({ product, onPress, index = 0 }: Props) => {
  const isOwn = useAuthStore((state) => state.user?.id) === product.sellerId;
  const { isProductFavorite, toggleProductFavorite } = useFavorites();
  const isFav = isProductFavorite(product.id);

  const toggleFavorite = () => {
    haptic.light();
    toggleProductFavorite(product);
  };

  return (
    // Entrada en cascada (solo las primeras 8 tienen retraso para no hacer esperar)
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 60).duration(350)}>
    <PressableScale style={styles.card} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: resolveImageUrl(product.image) }}
          style={styles.image}
          resizeMode="cover"
        />
        {isOwn ? (
          // En tus propios productos mostramos una etiqueta en lugar del corazón
          <View style={styles.ownTag}>
            <Text style={styles.ownTagText}>Tuyo</Text>
          </View>
        ) : (
          <Pressable style={styles.heartButton} onPress={toggleFavorite} hitSlop={8}>
            <PopOnChange trigger={isFav} when={isFav} scale={1.5}>
              {/* @ts-ignore */}
              <Heart size={16} color={isFav ? '#EF4444' : '#9CA3AF'} fill={isFav ? '#EF4444' : 'transparent'} />
            </PopOnChange>
          </Pressable>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{product.title}</Text>
        <Text style={styles.price}>${product.price.toFixed(2)}</Text>

        <View style={styles.footer}>
          {product.ratingCount ? (
            <Text style={styles.rating}>⭐ {product.ratingAverage?.toFixed(1)} ({product.ratingCount})</Text>
          ) : (
            <Text style={styles.noRating}>Sin calificaciones</Text>
          )}
        </View>
      </View>
    </PressableScale>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    width: CARD_WIDTH,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: CARD_WIDTH, // Cuadrada
    backgroundColor: '#F3F4F6',
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    padding: 6,
    borderRadius: 20,
    elevation: 2,
  },
  ownTag: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  ownTagText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  content: {
    padding: 10,
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
    height: 36, // Altura fija para 2 líneas
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
  },
  footer: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '600',
  },
  noRating: {
    fontSize: 11,
    color: '#9CA3AF',
  }
});
