import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const REPORT_REASONS = ['SCAM', 'PROHIBITED', 'INAPPROPRIATE', 'WRONG_INFO', 'SPAM', 'OTHER'] as const;

export class ReportProductDto {
  @IsIn(REPORT_REASONS, { message: 'Motivo de reporte inválido' })
  reason: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'El comentario no puede pasar de 500 caracteres' })
  details?: string;
}
