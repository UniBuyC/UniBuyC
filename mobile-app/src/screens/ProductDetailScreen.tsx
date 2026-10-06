import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  Share
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore
import { ArrowLeft, Heart, Share2, Star, MessageCircle, Pencil, Trash2 } from 'lucide-react-native';
import { Product, ProductRating } from '../types';
import { useAuthStore } from '../store/authStore';
import { useFavorites } from '../store/favoritesStore'; // <--- 1. Importar Store de Favoritos
import { startChat } from '../api/chat';
import { deleteProduct, getProduct, getProductRating, rateProduct } from '../api/products';
import { askToLogin } from '../navigation/navigationRef';
import { resolveImageUrl } from '../api/apiClient';
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';
import PressableScale from '../components/anim/PressableScale';
import PopOnChange from '../components/anim/PopOnChange';
import { haptic } from '../utils/haptics';

export default function ProductDetailScreen({ route, navigation }: any) {
  const [product, setProduct] = useState<Product>(route.params.product);
  const { token, user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const isOwner = !!user && product.sellerId === user.id;

  // --- FAVORITOS ---
  const { isProductFavorite, toggleProductFavorite } = useFavorites();
  const isFav = isProductFavorite(product.id); // ¿Es favorito?

  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState<ProductRating>({
    average: product.ratingAverage ?? 0,
    count: product.ratingCount ?? 0,
    myRating: null,
  });
  const [savingRating, setSavingRating] = useState(false);
  // Mensaje breve después de calificar (en lugar de una alerta que interrumpe)
  const [thanks, setThanks] = useState<string | null>(null);

  // Al volver a la pantalla (p. ej. después de editar) refrescamos datos y calificación
  useFocusEffect(
    useCallback(() => {
      getProduct(product.id).then(setProduct).catch(() => {});
      getProductRating(product.id, token).then(setRating).catch(() => {});
    }, [product.id, token])
  );

  const handleRate = async (stars: number) => {
    if (!token) {
      askToLogin('Inicia sesión para calificar productos.');
      return;
    }
    const previous = rating;
    const changed = rating.myRating !== null;
    // Las estrellas se iluminan de inmediato; si falla, regresan a como estaban
    setRating({ ...rating, myRating: stars });
    haptic.light();
    setSavingRating(true);
    try {
      const updated = await rateProduct(product.id, stars, token);
      setRating(updated);
      haptic.success();
      setThanks(changed ? `Actualizaste tu calificación a ${stars} ★` : `¡Gracias! Calificaste con ${stars} ★`);
    } catch (error: any) {
      setRating(previous);
      haptic.error();
      const msg = error.response?.data?.message || 'No se pudo guardar tu calificación';
      Alert.alert('Error', Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSavingRating(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `¡Mira este producto en UniByC! ${product.title} por $${product.price}.`,
      });
    } catch (error) {}
  };

  const handleContact = async () => {
    if (!token) {
      askToLogin('Inicia sesión para contactar al vendedor.');
      return;
    }
    setLoading(true);
    try {
      const conversation = await startChat(product.id, token);
      navigation.navigate('Chat', {
        conversationId: conversation.id,
        title: product.seller?.fullName || 'Chat'
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir el chat.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigation.navigate('AddProduct', { product });
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar publicación',
      '¿Seguro que quieres eliminar este producto? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;
            setLoading(true);
            try {
              await deleteProduct(product.id, token);
              haptic.success();
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el producto.');
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Función para ir al perfil del vendedor
  const goToSellerProfile = () => {
    if (product.seller) {
      navigation.navigate('SellerProfile', {
        seller: {
          id: product.sellerId, // Importante: pasamos el ID
          fullName: product.seller.fullName
        }
      });
    }
  };

  const ratingSummary = rating.count > 0
    ? `${rating.average.toFixed(1)} (${rating.count} ${rating.count === 1 ? 'calificación' : 'calificaciones'})`
    : 'Sin calificaciones';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* HEADER FLOTANTE */}
      <View style={[styles.header, { top: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          {/* @ts-ignore */}
          <ArrowLeft color="#374151" size={24} />
        </TouchableOpacity>

        <View style={styles.headerRight}>
          {/* BOTÓN FAVORITO (CORAZÓN) - no aplica a tus propios productos */}
          {!isOwner && (
            <PressableScale
              scaleTo={0.85}
              style={styles.iconButton}
              onPress={() => { haptic.light(); toggleProductFavorite(product); }}
            >
              <PopOnChange trigger={isFav} when={isFav} scale={1.4}>
                {/* @ts-ignore */}
                <Heart
                  color={isFav ? "#EF4444" : "#374151"} // Rojo si es fav, gris si no
                  fill={isFav ? "#EF4444" : "transparent"} // Relleno si es fav
                  size={24}
                />
              </PopOnChange>
            </PressableScale>
          )}

          <TouchableOpacity onPress={handleShare} style={[styles.iconButton, { marginLeft: 10 }]}>
            {/* @ts-ignore */}
            <Share2 color="#374151" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Image
          source={{ uri: resolveImageUrl(product.image) }}
          style={styles.heroImage}
          resizeMode="cover"
        />

        {/* La tarjeta de contenido sube un poco al abrir el detalle */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.contentCard}>
          {isOwner && (
            <View style={styles.ownerBanner}>
              <Text style={styles.ownerBannerText}>Esta es tu publicación</Text>
            </View>
          )}

          <View style={styles.topRow}>
            <View style={styles.tagContainer}>
              <Text style={styles.tagText}>{product.category}</Text>
            </View>
            <Text style={styles.price}>${product.price.toFixed(2)}</Text>
          </View>

          <Text style={styles.title}>{product.title}</Text>

          {/* --- FILA DEL VENDEDOR (CONECTADA) --- */}
          <PressableScale
            scaleTo={0.98}
            style={styles.sellerRow}
            onPress={goToSellerProfile} // <--- Al tocar aquí, vamos al perfil
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {product.seller?.fullName.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sellerName}>
                {isOwner ? 'Tú' : product.seller?.fullName || 'Estudiante UAM'}
              </Text>
              <View style={styles.ratingRow}>
                {/* @ts-ignore */}
                <Star size={14} color="#F59E0B" fill={rating.count > 0 ? "#F59E0B" : "transparent"} />
                <Text style={styles.ratingText}> {ratingSummary}</Text>
              </View>
            </View>
            {/* Indicador visual de que es clicable */}
            {/* @ts-ignore */}
            <ArrowLeft size={20} color="#9CA3AF" style={{ transform: [{ rotate: '180deg' }] }} />
          </PressableScale>

          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.description}>
            {product.description || "El vendedor no agregó una descripción detallada, pero se ve en buen estado."}
          </Text>

          {/* CALIFICAR (el dueño solo ve el resultado) */}
          <View style={styles.ratingSection}>
            <Text style={styles.sectionTitle}>
              {isOwner ? 'Calificación de tu producto' : 'Calificar Producto'}
            </Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => {
                // El dueño ve el promedio; los demás ven su propia calificación
                const filled = isOwner
                  ? star <= Math.round(rating.average)
                  : star <= (rating.myRating ?? 0);
                return (
                  <PressableScale
                    key={star}
                    scaleTo={0.8}
                    onPress={() => handleRate(star)}
                    disabled={isOwner || savingRating}
                  >
                    {/* Al calificar, las estrellas rebotan una tras otra */}
                    <PopOnChange trigger={rating.myRating} when={filled && !isOwner} delay={(star - 1) * 70}>
                      {/* @ts-ignore */}
                      <Star
                        size={32}
                        color="#F59E0B"
                        fill={filled ? "#F59E0B" : "transparent"}
                        style={{ marginHorizontal: 4 }}
                      />
                    </PopOnChange>
                  </PressableScale>
                );
              })}
            </View>
            <Text style={styles.averageText}>
              {isOwner
                ? ratingSummary
                : rating.myRating
                  ? `Tu calificación: ${rating.myRating} ★ · Promedio ${ratingSummary}`
                  : `Toca las estrellas para valorar · ${ratingSummary}`}
            </Text>
            {thanks && (
              <Animated.Text key={thanks} entering={FadeIn.duration(300)} style={styles.thanksText}>
                {thanks}
              </Animated.Text>
            )}
          </View>

          <View style={{ height: 110 + insets.bottom }} />
        </Animated.View>
      </ScrollView>

      {/* El pie con los botones sube desde abajo al abrir */}
      <Animated.View
        entering={SlideInDown.delay(150).springify().damping(18)}
        style={[styles.footerContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}
      >
        {isOwner ? (
          <View style={styles.ownerActions}>
            <PressableScale style={[styles.ownerButton, styles.editButton]} onPress={handleEdit} disabled={loading}>
              {/* @ts-ignore */}
              <Pencil color="white" size={20} style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Editar</Text>
            </PressableScale>
            <PressableScale style={[styles.ownerButton, styles.deleteButton]} onPress={handleDelete} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#EF4444" />
              ) : (
                <>
                  {/* @ts-ignore */}
                  <Trash2 color="#EF4444" size={20} style={{ marginRight: 8 }} />
                  <Text style={[styles.buttonText, { color: '#EF4444' }]}>Eliminar</Text>
                </>
              )}
            </PressableScale>
          </View>
        ) : (
          <PressableScale style={styles.contactButton} onPress={handleContact} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                {/* @ts-ignore */}
                <MessageCircle color="white" size={24} style={{ marginRight: 10 }} />
                <Text style={styles.buttonText}>Contactar Vendedor</Text>
              </>
            )}
          </PressableScale>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { position: 'absolute', left: 0, right: 0, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  headerRight: { flexDirection: 'row' },
  scrollContent: { flexGrow: 1 },
  heroImage: { width: '100%', height: 350, backgroundColor: '#E5E7EB' },
  contentCard: { flex: 1, backgroundColor: 'white', marginTop: -40, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 5 },
  ownerBanner: { backgroundColor: '#EFF6FF', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, marginBottom: 15, alignSelf: 'flex-start' },
  ownerBannerText: { color: '#2563EB', fontWeight: '600', fontSize: 13 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  tagContainer: { backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  tagText: { color: '#10B981', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' },
  price: { fontSize: 24, fontWeight: 'bold', color: '#10B981' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#111827', marginBottom: 20, lineHeight: 32 },
  sellerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F3F4F6', marginBottom: 20 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#6B7280' },
  sellerName: { fontSize: 16, fontWeight: '600', color: '#374151' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText: { fontSize: 13, color: '#6B7280' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 10 },
  description: { fontSize: 16, lineHeight: 26, color: '#4B5563', marginBottom: 30 },
  ratingSection: { backgroundColor: '#F9FAFB', padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 20 },
  starsContainer: { flexDirection: 'row', marginVertical: 10 },
  thanksText: { marginTop: 8, color: '#059669', fontWeight: '600', fontSize: 14 },
  averageText: { marginTop: 5, color: '#6B7280', fontSize: 14, textAlign: 'center' },
  footerContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  contactButton: { backgroundColor: '#10B981', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: 16, shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  ownerActions: { flexDirection: 'row' },
  ownerButton: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: 16 },
  editButton: { backgroundColor: '#10B981', marginRight: 10 },
  deleteButton: { backgroundColor: '#FEE2E2' },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});
