import { IsEnum } from 'class-validator';
import { ProductStatus } from '@prisma/client';

export class UpdateStatusDto {
  @IsEnum(ProductStatus, { message: 'Estado inválido (AVAILABLE, SOLD_OUT o SOLD)' })
  status: ProductStatus;
}
