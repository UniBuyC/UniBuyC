import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { assertAccountActive } from './account-status';
import { JWT_SECRET } from './jwt-secret';

// 1. Definimos qué datos esperamos recibir en el token para evitar "any"
interface JwtPayload {
  id: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      // Le decimos que busque el token en el encabezado "Authorization: Bearer ..."
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // IMPORTANTE: Debe ser la misma clave que pusimos en auth.module.ts
      secretOrKey: JWT_SECRET,
    });
  }

  // En cada petición revisamos que la cuenta siga existiendo y no esté suspendida:
  // así una suspensión surte efecto de inmediato, aunque el token siga vigente
  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.id },
      select: { suspendedUntil: true, bannedAt: true, suspensionReason: true },
    });
    if (!user) throw new UnauthorizedException('La cuenta ya no existe');
    assertAccountActive(user);
    // Esto inyecta el usuario en "req.user" automáticamente
    return { id: payload.id, email: payload.email };
  }
}
