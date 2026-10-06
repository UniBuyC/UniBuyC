// Clave para firmar los tokens. En la nube viene de la variable de entorno JWT_SECRET;
// la clave fija solo se acepta al desarrollar en local.
const DEV_SECRET = 'MI_SECRETO_SUPER_SEGURO';

export const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    throw new Error('Falta la variable de entorno JWT_SECRET');
  }
  return DEV_SECRET;
})();
