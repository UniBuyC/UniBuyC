import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Igual que AuthGuard('jwt'), pero deja pasar a invitados (req.user queda vacío)
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(_err: unknown, user: TUser): TUser {
    return user;
  }
}
