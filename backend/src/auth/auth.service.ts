import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service'; // Necesitamos acceso a los usuarios
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { assertAccountActive } from './account-status';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 1. Buscar usuario en la base de datos
    const user = await this.usersService.findByEmailWithPassword(email);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas (Email)');
    }

    // 2. Comparar contraseñas
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas (Password)');
    }

    // Cuenta suspendida o bloqueada: no se entrega token
    assertAccountActive(user);

    // 3. Generar Token
    return {
      token: this.jwtService.sign({ id: user.id, email: user.email }),
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        matricula: user.matricula,
        role: user.role, // El panel de administración lo usa para saber si puede entrar
      },
    };
  }
}
