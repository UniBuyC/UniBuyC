import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module'; // Importamos usuarios
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { JWT_SECRET } from './jwt-secret';

@Module({
  imports: [
    UsersModule, // Para poder buscar si el usuario existe
    PassportModule,
    JwtModule.register({
      secret: JWT_SECRET, // Viene de la variable de entorno JWT_SECRET
      signOptions: { expiresIn: '24h' }, // El token dura 24 horas
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
