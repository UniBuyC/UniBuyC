import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { JWT_SECRET } from './jwt-secret';

// 1. Definimos qué datos esperamos recibir en el token para evitar "any"
interface JwtPayload {
  id: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Le decimos que busque el token en el encabezado "Authorization: Bearer ..."
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // IMPORTANTE: Debe ser la misma clave que pusimos en auth.module.ts
      secretOrKey: JWT_SECRET,
    });
  }

  // 2. Quitamos "async" porque no estamos haciendo consultas a la BD aquí (no hay await)
  // 3. Usamos la interfaz "JwtPayload" en lugar de "any"
  validate(payload: JwtPayload) {
    // Esto inyecta el usuario en "req.user" automáticamente
    return { id: payload.id, email: payload.email };
  }
}
