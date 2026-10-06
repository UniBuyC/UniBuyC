import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { appWidth } from '../utils/layout';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Product } from '../types';
import { useAuthStore } from '../store/authStore';
import { useFavorites } from '../store/favoritesStore';
import { resolveImageUrl } from '../api/apiClient';
import PressableScale from './anim/PressableScale';
import PopOnChange from './anim/PopOnChange';
import { haptic } from '../utils/haptics';
import { STATUS_LABEL } from '../utils/productStatus';
// @ts-ignore
import { Heart } from 'lucide-react-native';
import { useTheme, useThemedStyles, ThemeColors } from '../theme';

const width = appWidth();
// Calculamos el ancho: (Pantalla - Padding total) / 2 columnas
const CARD_WIDTH = (width - 48) / 2;

interface Props {
  product: Product;
  onPress: () => void;
  // Posición en la lista: las primeras tarjetas entran en cascada
  index?: number;
}

export const ProductCard = ({ product, onPress, index = 0 }: Props) => {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(createStyles);
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
          style={[styles.image, product.status !== 'AVAILABLE' && styles.imageInactive]}
          resizeMode="cover"
        />
        {/* Agotado / Vendido sobre la foto */}
        {product.status && product.status !== 'AVAILABLE' && (
          <View style={[styles.statusTag, { backgroundColor: STATUS_LABEL[product.status].background }]}>
            <Text style={[styles.statusTagText, { color: STATUS_LABEL[product.status].color }]}>
              {STATUS_LABEL[product.status].text}
            </Text>
          </View>
        )}
        {isOwn ? (
          // En tus propios productos mostramos una etiqueta en lugar del corazón
          <View style={styles.ownTag}>
            <Text style={styles.ownTagText}>Tuyo</Text>
          </View>
        ) : (
          <Pressable style={styles.heartButton} onPress={toggleFavorite} hitSlop={8}>
            <PopOnChange trigger={isFav} when={isFav} scale={1.5}>
              {/* @ts-ignore */}
              <Heart size={16} color={isFav ? c.danger : c.textFaint} fill={isFav ? c.danger : 'transparent'} />
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

const createStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: c.card,
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
    backgroundColor: c.muted,
  },
  imageInactive: {
    opacity: 0.5,
  },
  statusTag: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: c.card,
    padding: 6,
    borderRadius: 20,
    elevation: 2,
  },
  ownTag: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: c.info,
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
    color: c.textSecondary,
    marginBottom: 4,
    height: 36, // Altura fija para 2 líneas
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
    color: c.text,
  },
  footer: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 11,
    color: c.star,
    fontWeight: '600',
  },
  noRating: {
    fontSize: 11,
    color: c.textFaint,
  }
});
