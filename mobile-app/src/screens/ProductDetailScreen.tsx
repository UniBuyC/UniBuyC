import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Share
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore
import { ArrowLeft, Heart, Share2, Star, MessageCircle, Pencil, Trash2, Lock, Flag } from 'lucide-react-native';
import { Product, ProductRating, ProductStatus } from '../types';
import { useAuthStore } from '../store/authStore';
import { useFavorites } from '../store/favoritesStore'; // <--- 1. Importar Store de Favoritos
import { startChat } from '../api/chat';
import { deleteProduct, getProduct, getProductRating, rateProduct, updateProductStatus } from '../api/products';
import { askToLogin } from '../navigation/navigationRef';
import { resolveImageUrl } from '../api/apiClient';
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';
import PressableScale from '../components/anim/PressableScale';
import PopOnChange from '../components/anim/PopOnChange';
import { haptic } from '../utils/haptics';
import Avatar from '../components/Avatar';
import { STATUS_LABEL } from '../utils/productStatus';
import { toast, confirm, apiErrorMessage } from '../store/feedbackStore';
import { useTheme, useThemedStyles, ThemeColors } from '../theme';

export default function ProductDetailScreen({ route, navigation }: any) {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [product, setProduct] = useState<Product>(route.params.product);
  const { token, user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const isOwner = !!user && product.sellerId === user.id;
  const status: ProductStatus = product.status ?? 'AVAILABLE';
  const isSold = status === 'SOLD';
  // La publicación se eliminó mientras la veías (o venías de favoritos)
  const [removed, setRemoved] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

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
      getProduct(product.id)
        .then(setProduct)
        .catch((error) => {
          if (error.response?.status === 404) setRemoved(true);
        });
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
      toast.error('No se guardó tu calificación', apiErrorMessage(error, 'Intenta de nuevo'));
    } finally {
      setSavingRating(false);
    }
  };

  const handleReport = () => {
    if (!token) {
      askToLogin('Inicia sesión para reportar publicaciones.');
      return;
    }
    navigation.navigate('ReportProduct', { product });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `¡Mira este producto en UniBuyC! ${product.title} por $${product.price}.`,
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
    } catch (error: any) {
      toast.error('No se pudo abrir el chat', apiErrorMessage(error, 'Intenta de nuevo'));
    } finally {
      setLoading(false);
    }
  };

  // Disponible <-> Agotado se puede cambiar; Vendido es definitivo
  const applyStatus = async (next: ProductStatus) => {
    if (!token || next === status) return;
    setChangingStatus(true);
    try {
      const updated = await updateProductStatus(product.id, next, token);
      setProduct((prev) => ({ ...prev, status: updated.status, soldAt: updated.soldAt }));
      const messages: Record<ProductStatus, [string, string]> = {
        AVAILABLE: ['Disponible de nuevo', 'Los compradores ya pueden contactarte'],
        SOLD_OUT: ['Marcado como agotado', 'Nadie nuevo podrá contactarte por este producto'],
        SOLD: ['¡Felicidades por tu venta!', 'Los chats de este producto quedaron como registro'],
      };
      toast.success(...messages[next]);
    } catch (error: any) {
      toast.error('No se pudo cambiar el estado', apiErrorMessage(error, 'Intenta de nuevo'));
    } finally {
      setChangingStatus(false);
    }
  };

  const changeStatus = async (next: ProductStatus) => {
    if (next !== 'SOLD') {
      haptic.selection();
      applyStatus(next);
      return;
    }
    const ok = await confirm({
      icon: 'sold',
      title: '¿Marcar como vendido?',
      message: 'Es definitivo: ya no podrás editarlo ni volver a ponerlo disponible, y los chats sobre este producto quedarán cerrados como registro de la venta.',
      confirmText: 'Sí, se vendió',
      cancelText: 'Cancelar',
    });
    if (ok) applyStatus('SOLD');
  };

  const handleEdit = () => {
    navigation.navigate('AddProduct', { product });
  };

  const handleDelete = async () => {
    const ok = await confirm({
      icon: 'danger',
      title: '¿Eliminar publicación?',
      message: 'Dejará de aparecer en la app. Los chats sobre este producto se conservan como registro, pero ya no se podrán enviar mensajes.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      destructive: true,
    });
    if (!ok || !token) return;
    setLoading(true);
    try {
      await deleteProduct(product.id, token);
      toast.success('Publicación eliminada');
      navigation.goBack();
    } catch (error) {
      toast.error('No se pudo eliminar', 'Intenta de nuevo');
      setLoading(false);
    }
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
          <ArrowLeft color={c.textSecondary} size={24} />
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
                  color={isFav ? c.danger : c.textSecondary} // Rojo si es fav, gris si no
                  fill={isFav ? c.danger : "transparent"} // Relleno si es fav
                  size={24}
                />
              </PopOnChange>
            </PressableScale>
          )}

          {/* Reportar: solo publicaciones de otros */}
          {!isOwner && !removed && (
            <PressableScale
              scaleTo={0.85}
              style={[styles.iconButton, { marginLeft: 10 }]}
              onPress={handleReport}
              accessibilityRole="button"
              accessibilityLabel="Reportar publicación"
            >
              {/* @ts-ignore */}
              <Flag color={c.danger} size={22} />
            </PressableScale>
          )}

          <TouchableOpacity onPress={handleShare} style={[styles.iconButton, { marginLeft: 10 }]}>
            {/* @ts-ignore */}
            <Share2 color={c.textSecondary} size={24} />
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

          {removed && (
            <View style={styles.removedBanner}>
              <Text style={styles.removedText}>Esta publicación ya no está disponible</Text>
            </View>
          )}

          <View style={styles.topRow}>
            <View style={{ flexDirection: 'row' }}>
              <View style={styles.tagContainer}>
                <Text style={styles.tagText}>{product.category}</Text>
              </View>
              {status !== 'AVAILABLE' && (
                <View style={[styles.tagContainer, { marginLeft: 8, backgroundColor: STATUS_LABEL[status].background }]}>
                  <Text style={[styles.tagText, { color: STATUS_LABEL[status].color }]}>{STATUS_LABEL[status].text}</Text>
                </View>
              )}
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
            <Avatar seed={product.sellerId} size={50} style={{ marginRight: 15 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.sellerName}>
                {isOwner ? 'Tú' : product.seller?.fullName || 'Estudiante UAM'}
              </Text>
              <View style={styles.ratingRow}>
                {/* @ts-ignore */}
                <Star size={14} color={c.star} fill={rating.count > 0 ? c.star : "transparent"} />
                <Text style={styles.ratingText}> {ratingSummary}</Text>
              </View>
            </View>
            {/* Indicador visual de que es clicable */}
            {/* @ts-ignore */}
            <ArrowLeft size={20} color={c.textFaint} style={{ transform: [{ rotate: '180deg' }] }} />
          </PressableScale>

          {/* ESTADO (solo el vendedor) */}
          {isOwner && !removed && (
            <View style={styles.statusSection}>
              <Text style={styles.sectionTitle}>Estado de la publicación</Text>
              {isSold ? (
                <View style={styles.soldNotice}>
                  {/* @ts-ignore */}
                  <Lock size={16} color={c.textMuted} />
                  <Text style={styles.soldNoticeText}>
                    Vendido{product.soldAt ? ` el ${new Date(product.soldAt).toLocaleDateString()}` : ''}. Los chats sobre este producto quedaron cerrados como registro.
                  </Text>
                </View>
              ) : (
                <View style={styles.statusOptions}>
                  {(['AVAILABLE', 'SOLD_OUT', 'SOLD'] as ProductStatus[]).map((option) => {
                    const active = status === option;
                    return (
                      <PressableScale
                        key={option}
                        scaleTo={0.95}
                        disabled={changingStatus}
                        onPress={() => changeStatus(option)}
                        style={[
                          styles.statusOption,
                          active && { backgroundColor: STATUS_LABEL[option].background, borderColor: STATUS_LABEL[option].color },
                        ]}
                      >
                        <Text style={[styles.statusOptionText, active && { color: STATUS_LABEL[option].color, fontWeight: 'bold' }]}>
                          {STATUS_LABEL[option].text}
                        </Text>
                      </PressableScale>
                    );
                  })}
                </View>
              )}
            </View>
          )}

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
                    disabled={isOwner || savingRating || removed}
                  >
                    {/* Al calificar, las estrellas rebotan una tras otra */}
                    <PopOnChange trigger={rating.myRating} when={filled && !isOwner} delay={(star - 1) * 70}>
                      {/* @ts-ignore */}
                      <Star
                        size={32}
                        color={c.star}
                        fill={filled ? c.star : "transparent"}
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

      {/* El pie con los botones sube desde abajo al abrir (sin rebote) */}
      <Animated.View
        entering={SlideInDown.delay(100).duration(260)}
        style={[styles.footerContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}
      >
        {removed ? (
          <View style={[styles.contactButton, styles.disabledButton]}>
            <Text style={[styles.buttonText, styles.disabledText]}>Publicación no disponible</Text>
          </View>
        ) : isOwner ? (
          <View style={styles.ownerActions}>
            {/* Un producto vendido ya no se edita: queda como registro */}
            {!isSold && (
              <PressableScale style={[styles.ownerButton, styles.editButton]} onPress={handleEdit} disabled={loading}>
                {/* @ts-ignore */}
                <Pencil color="white" size={20} style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Editar</Text>
              </PressableScale>
            )}
            <PressableScale style={[styles.ownerButton, styles.deleteButton]} onPress={handleDelete} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={c.danger} />
              ) : (
                <>
                  {/* @ts-ignore */}
                  <Trash2 color={c.danger} size={20} style={{ marginRight: 8 }} />
                  <Text style={[styles.buttonText, { color: c.danger }]}>Eliminar</Text>
                </>
              )}
            </PressableScale>
          </View>
        ) : status !== 'AVAILABLE' ? (
          // Agotado o vendido: ya no se puede contactar por este producto
          <View style={[styles.contactButton, styles.disabledButton]}>
            {/* @ts-ignore */}
            <Lock color={c.textFaint} size={20} style={{ marginRight: 10 }} />
            <Text style={[styles.buttonText, styles.disabledText]}>
              {isSold ? 'Producto vendido' : 'Producto agotado'}
            </Text>
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

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.muted },
  header: { position: 'absolute', left: 0, right: 0, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.card + 'E6', borderWidth: 1, borderColor: c.border, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  headerRight: { flexDirection: 'row' },
  scrollContent: { flexGrow: 1 },
  heroImage: { width: '100%', height: 350, backgroundColor: c.surface },
  contentCard: { flex: 1, backgroundColor: c.card, marginTop: -40, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 5 },
  removedBanner: { backgroundColor: c.dangerSoft, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, marginBottom: 15, alignSelf: 'flex-start' },
  removedText: { color: c.dangerText, fontWeight: '600', fontSize: 13 },
  statusSection: { marginBottom: 20 },
  statusOptions: { flexDirection: 'row' },
  statusOption: { flex: 1, paddingVertical: 10, marginRight: 8, borderRadius: 10, borderWidth: 1, borderColor: c.border, alignItems: 'center', backgroundColor: c.card },
  statusOptionText: { fontSize: 14, color: c.textMuted, fontWeight: '500' },
  soldNotice: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.muted, padding: 12, borderRadius: 10 },
  soldNoticeText: { flex: 1, marginLeft: 8, color: c.textTertiary, fontSize: 14, lineHeight: 20 },
  disabledButton: { backgroundColor: c.surface, shadowOpacity: 0, elevation: 0 },
  disabledText: { color: c.textFaint },
  ownerBanner: { backgroundColor: c.infoSoft, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, marginBottom: 15, alignSelf: 'flex-start' },
  ownerBannerText: { color: c.info, fontWeight: '600', fontSize: 13 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  tagContainer: { backgroundColor: c.primarySoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  tagText: { color: c.primary, fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' },
  price: { fontSize: 24, fontWeight: 'bold', color: c.primary },
  title: { fontSize: 26, fontWeight: 'bold', color: c.text, marginBottom: 20, lineHeight: 32 },
  sellerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: c.borderLight, marginBottom: 20 },
  sellerName: { fontSize: 16, fontWeight: '600', color: c.textSecondary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText: { fontSize: 13, color: c.textMuted },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: c.text, marginBottom: 10 },
  description: { fontSize: 16, lineHeight: 26, color: c.textTertiary, marginBottom: 30 },
  ratingSection: { backgroundColor: c.background, padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 20 },
  starsContainer: { flexDirection: 'row', marginVertical: 10 },
  thanksText: { marginTop: 8, color: c.primaryText, fontWeight: '600', fontSize: 14 },
  averageText: { marginTop: 5, color: c.textMuted, fontSize: 14, textAlign: 'center' },
  footerContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: c.card, paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: c.borderLight },
  contactButton: { backgroundColor: c.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: 16, shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  ownerActions: { flexDirection: 'row' },
  ownerButton: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: 16 },
  editButton: { backgroundColor: c.primary, marginRight: 10 },
  deleteButton: { backgroundColor: c.dangerSoft },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});
