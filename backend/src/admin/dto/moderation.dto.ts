import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class SuspendDto {
  @IsInt()
  @Min(1, { message: 'La suspensión debe ser de al menos 1 día' })
  @Max(365, { message: 'La suspensión no puede pasar de 365 días' })
  days: number;

  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'El motivo no puede pasar de 300 caracteres' })
  reason?: string;
}

export class BanDto {
  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'El motivo no puede pasar de 300 caracteres' })
  reason?: string;
}
