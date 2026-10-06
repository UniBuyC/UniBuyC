import { IsInt, Max, Min } from 'class-validator';

export class RateProductDto {
  @IsInt()
  @Min(1, { message: 'La calificación mínima es 1 estrella' })
  @Max(5, { message: 'La calificación máxima es 5 estrellas' })
  value: number;
}
