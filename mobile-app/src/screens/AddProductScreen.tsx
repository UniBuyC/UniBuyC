import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore
import { Camera, ImagePlus } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { createProduct, updateProduct, uploadProductImage } from '../api/products';
import { resolveImageUrl } from '../api/apiClient';
import { PRODUCT_CATEGORIES } from '../constants';
import { Product } from '../types';
import PressableScale from '../components/anim/PressableScale';
import { haptic } from '../utils/haptics';

const PLACEHOLDER_IMAGE = 'https://placehold.co/600x400/png';

export default function AddProductScreen({ navigation, route }: any) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const token = useAuthStore((state) => state.token); // Necesitamos el token para permiso
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  // Si recibimos un producto, estamos editando una publicación existente
  const editing: Product | undefined = route?.params?.product;

  // Estado del formulario
  const [form, setForm] = useState({
    title: editing?.title ?? '',
    price: editing ? String(editing.price) : '',
    description: editing?.description ?? '',
    category: editing?.category ?? '',
    image: editing?.image ?? PLACEHOLDER_IMAGE,
  });
  const hasPhoto = form.image !== PLACEHOLDER_IMAGE;

  // Elegir foto de la galería o tomarla con la cámara, y subirla al servidor
  const pickImage = async (source: 'camera' | 'library') => {
    if (!token) return;

    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso necesario', source === 'camera'
        ? 'Permite el acceso a la cámara para tomar la foto.'
        : 'Permite el acceso a tus fotos para elegir una imagen.');
      return;
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1], // Cuadrada, igual que las tarjetas del Inicio
      quality: 0.7, // Comprimida para que suba rápido
    };
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return;

    const asset = result.assets[0];
    setUploading(true);
    try {
      // Reducimos la foto a 1080 px de ancho en JPEG: las de cámara pueden pesar varios MB
      const context = ImageManipulator.manipulate(asset.uri);
      if (asset.width > 1080) context.resize({ width: 1080 });
      const rendered = await context.renderAsync();
      const photo = await rendered.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });

      const path = await uploadProductImage(photo.uri, token, 'image/jpeg');
      setForm((f) => ({ ...f, image: path }));
      haptic.success();
    } catch (error: any) {
      // Aparece en la terminal de Expo para poder diagnosticar
      console.log('Error subiendo foto:', error?.message, '| original:', asset.uri, asset.width, 'x', asset.height);
      Alert.alert('No se pudo subir la foto', error?.message || 'Intenta de nuevo');
    } finally {
      setUploading(false);
    }
  };

  const choosePhoto = () => {
    Alert.alert('Foto del producto', '¿De dónde quieres tomarla?', [
      { text: 'Cámara', onPress: () => pickImage('camera') },
      { text: 'Galería', onPress: () => pickImage('library') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handlePublish = async () => {
    // 1. Validaciones simples
    if (!form.title || !form.price || !form.description) {
      Alert.alert('Faltan datos', 'Por favor llena todos los campos');
      return;
    }
    if (!form.category) {
      Alert.alert('Falta la categoría', 'Elige una categoría para tu producto');
      return;
    }

    const price = parseFloat(form.price.replace(',', '.'));
    if (isNaN(price) || price <= 0) {
      Alert.alert('Precio inválido', 'Escribe un precio mayor a 0');
      return;
    }

    setLoading(true);
    try {
      // 2. Preparar datos (convertir precio a número)
      const productData = {
        ...form,
        price,
      };

      // 3. Enviar al backend
      if (token) {
        if (editing) {
          await updateProduct(editing.id, productData, token);
          haptic.success();
          Alert.alert('¡Listo!', 'Tu publicación se actualizó');
        } else {
          await createProduct(productData, token);
          haptic.success();
          Alert.alert('¡Éxito!', 'Tu producto ya está en el mercadito');
        }
        navigation.goBack(); // Regresar a la pantalla anterior
      }
    } catch (error) {
      haptic.error();
      Alert.alert('Error', editing ? 'No se pudieron guardar los cambios' : 'No se pudo publicar el producto');
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={headerHeight}>
      <ScrollView
        style={styles.container}
        // Espacio extra abajo para que el botón no quede bajo la barra del sistema
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 30 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* FOTO */}
        <PressableScale scaleTo={0.98} style={styles.photoBox} onPress={choosePhoto} disabled={uploading}>
          {hasPhoto ? (
            <>
              <Image source={{ uri: resolveImageUrl(form.image) }} style={styles.photo} />
              <View style={styles.changePhoto}>
                {/* @ts-ignore */}
                <Camera color="white" size={16} />
                <Text style={styles.changePhotoText}>Cambiar foto</Text>
              </View>
            </>
          ) : (
            <View style={styles.photoEmpty}>
              {/* @ts-ignore */}
              <ImagePlus color="#10B981" size={40} />
              <Text style={styles.photoEmptyText}>Agregar foto</Text>
              <Text style={styles.photoHint}>Cámara o galería</Text>
            </View>
          )}
          {uploading && (
            <View style={styles.photoOverlay}>
              <ActivityIndicator color="white" size="large" />
              <Text style={styles.changePhotoText}>Subiendo...</Text>
            </View>
          )}
        </PressableScale>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Título del Producto</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Calculadora HP, Bata blanca..."
            placeholderTextColor="#9CA3AF"
            value={form.title}
            onChangeText={(text) => setForm({...form, title: text})}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Precio ($)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#9CA3AF"
            keyboardType="decimal-pad"
            value={form.price}
            onChangeText={(text) => setForm({...form, price: text})}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Categoría</Text>
          <View style={styles.categories}>
            {PRODUCT_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryPill, form.category === cat && styles.categoryPillActive]}
                onPress={() => { haptic.selection(); setForm({ ...form, category: cat }); }}
              >
                <Text style={[styles.categoryText, form.category === cat && styles.categoryTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe el estado, lugar de entrega, etc."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={form.description}
            onChangeText={(text) => setForm({...form, description: text})}
          />
        </View>

        <PressableScale
          style={[styles.publishButton, (loading || uploading) && { opacity: 0.6 }]}
          onPress={handlePublish}
          disabled={loading || uploading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>{editing ? 'Guardar Cambios' : 'Publicar Ahora'}</Text>
          )}
        </PressableScale>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  photoBox: {
    width: '100%',
    aspectRatio: 1.4,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#F3F4F6',
  },
  photo: { width: '100%', height: '100%' },
  photoEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#A7F3D0',
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
  },
  photoEmptyText: { marginTop: 8, fontSize: 16, fontWeight: 'bold', color: '#059669' },
  photoHint: { marginTop: 2, fontSize: 13, color: '#6B7280' },
  changePhoto: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  changePhotoText: { color: 'white', fontWeight: '600', marginLeft: 6 },
  photoOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#111827',
  },
  textArea: {
    minHeight: 100,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    marginBottom: 8,
  },
  categoryPillActive: { backgroundColor: '#10B981' },
  categoryText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  categoryTextActive: { color: 'white', fontWeight: 'bold' },
  publishButton: {
    backgroundColor: '#10B981',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
