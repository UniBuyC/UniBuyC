import { Platform } from 'react-native';
import { api, API_URL } from './apiClient';
import { Product, ProductRating, ProductStatus, ReportReason } from '../types';

// 1. Obtener todos los productos (Público - Para el Home)
export const getProducts = async (): Promise<Product[]> => {
  const response = await api.get('/products');
  return response.data;
};

// Obtener un producto (Público - Para refrescar el detalle)
export const getProduct = async (id: string): Promise<Product> => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

// 2. Crear un producto (Privado - Requiere Token)
export const createProduct = async (productData: Partial<Product>, token: string) => {
  const response = await api.post('/products', productData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Editar un producto propio (Privado)
export const updateProduct = async (id: string, productData: Partial<Product>, token: string) => {
  const response = await api.patch(`/products/${id}`, productData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Cambiar estado: disponible, agotado o vendido (Privado, solo el vendedor)
export const updateProductStatus = async (id: string, status: ProductStatus, token: string): Promise<Product> => {
  const response = await api.patch(`/products/${id}/status`, { status }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// 3. Obtener MIS productos (Privado - Nuevo para Perfil)
export const getMyProducts = async (token: string): Promise<Product[]> => {
  const response = await api.get('/products/my', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// 4. Borrar un producto (Privado - Nuevo para eliminar)
export const deleteProduct = async (id: string, token: string) => {
  await api.delete(`/products/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// 5. Calificación del producto (si mandamos token, incluye la mía)
export const getProductRating = async (id: string, token?: string | null): Promise<ProductRating> => {
  const response = await api.get(`/products/${id}/rating`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return response.data;
};

// 6. Calificar producto de 1 a 5 (Privado)
export const rateProduct = async (id: string, value: number, token: string): Promise<ProductRating> => {
  const response = await api.post(`/products/${id}/rating`, { value }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// 7. Subir foto del producto (Privado). Devuelve la ruta para el campo "image"
// Usamos XMLHttpRequest: el fetch de Expo (SDK 57) no acepta archivos { uri, name, type } en FormData
export const uploadProductImage = async (uri: string, token: string, mimeType?: string | null): Promise<string> => {
  const extension = uri.split('.').pop()?.toLowerCase() || 'jpg';
  const type = mimeType || `image/${extension === 'jpg' ? 'jpeg' : extension}`;
  const formData = new FormData();
  if (Platform.OS === 'web') {
    // En el navegador la foto llega como blob: la convertimos en archivo
    const blob = await (await fetch(uri)).blob();
    formData.append('image', blob, 'foto.jpg');
  } else {
    formData.append('image', { uri, name: `foto.${extension}`, type } as any);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/products/upload-image`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.timeout = 30000;

    xhr.onload = () => {
      // Si el servidor no responde JSON, mostramos el código para saber qué pasó
      let data: any;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        reject(new Error(`Respuesta inesperada del servidor (${xhr.status})`));
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data.path);
      } else {
        const message = Array.isArray(data.message) ? data.message[0] : data.message;
        reject(new Error(`${message} (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error('No hay conexión con el servidor'));
    xhr.ontimeout = () => reject(new Error('El servidor tardó demasiado en responder'));
    xhr.send(formData);
  });
};

// 8. Reportar una publicación (Privado)
export const reportProduct = async (id: string, reason: ReportReason, details: string, token: string) => {
  await api.post(`/products/${id}/report`, { reason, details: details.trim() || undefined }, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
