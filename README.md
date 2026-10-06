# UniBuyC

Marketplace para estudiantes de la UAM: publica artículos con foto, busca productos y vendedores, chatea con compradores y califica productos.

- **`backend/`**: API en NestJS 11 + Prisma + PostgreSQL 15 (Docker)
- **`mobile-app/`**: app en Expo SDK 57 (React Native)

## Requisitos

- Node.js 20 o más reciente
- Docker Desktop
- La app **Expo Go** en el celular (la versión de la App Store / Play Store)

## Cómo correrlo

**1. Base de datos y backend**

```bash
cd backend
cp .env.example .env
npm install
docker compose up -d          # levanta PostgreSQL
npx prisma migrate deploy     # crea las tablas
npm run start:dev             # API en http://localhost:3000
```

**2. App móvil**

Cambia la IP en `mobile-app/src/api/apiClient.ts` por la IP de tu computadora en la red local (`ipconfig getifaddr en0` en macOS):

```ts
export const API_URL = 'http://TU_IP:3000';
```

```bash
cd mobile-app
npm install --legacy-peer-deps
npx expo start
```

Escanea el QR con Expo Go. El celular debe estar en la misma Wi‑Fi que la computadora.

## Notas

- Las fotos de productos se guardan en `backend/uploads/` y no se suben al repositorio.
- La clave para firmar los tokens JWT está escrita en `backend/src/auth/` (`MI_SECRETO_SUPER_SEGURO`). Antes de desplegar, muévela a una variable de entorno.
