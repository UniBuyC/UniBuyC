import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsPositive,
  Matches,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsString()
  @IsNotEmpty()
  category: string;

  // URL externa o una foto subida a este servidor (/uploads/...)
  @IsString()
  @Matches(/^(https?:\/\/|\/uploads\/)/, {
    message: 'La imagen debe ser una URL válida o una foto subida',
  })
  image: string;
}
