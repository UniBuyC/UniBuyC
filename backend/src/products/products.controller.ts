import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { RateProductDto } from './dto/rate-product.dto';
import { AuthGuard } from '@nestjs/passport';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';

// 1. Definimos esta interfaz para que TS sepa qué esperar del Request
interface RequestWithUser {
  user: {
    id: string;
    email: string;
  };
}

interface RequestWithOptionalUser {
  user?: {
    id: string;
    email: string;
  };
}

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // 🔒 RUTA PROTEGIDA
  @UseGuards(AuthGuard('jwt'))
  @Post()
  // 2. Usamos RequestWithUser en lugar de 'any'
  create(
    @Body() createProductDto: CreateProductDto,
    @Request() req: RequestWithUser,
  ) {
    // Ahora TS sabe que req.user.id es un string, ¡cero errores!
    return this.productsService.create(createProductDto, req.user.id);
  }

  // 🔒 Subir foto de producto (multipart, campo "image", máx. 10 MB)
  // Devuelve la ruta para guardarla en el campo "image" del producto
  @UseGuards(AuthGuard('jwt'))
  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) =>
          cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase() || '.jpg'}`),
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Solo se permiten imágenes'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió ninguna imagen');
    return { path: `/uploads/${file.filename}` };
  }

  // 🔓 RUTA PÚBLICA
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  // 🔒 Mis productos (va antes de ':id' para que "my" no se tome como id)
  @UseGuards(AuthGuard('jwt'))
  @Get('my')
  findMine(@Request() req: RequestWithUser) {
    return this.productsService.findMine(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // 🔓 Calificación del producto (si hay sesión, incluye la mía)
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/rating')
  getRating(@Param('id') id: string, @Request() req: RequestWithOptionalUser) {
    return this.productsService.getRating(id, req.user?.id);
  }

  // 🔒 Calificar producto (1 a 5)
  @UseGuards(AuthGuard('jwt'))
  @Post(':id/rating')
  rate(
    @Param('id') id: string,
    @Body() rateProductDto: RateProductDto,
    @Request() req: RequestWithUser,
  ) {
    return this.productsService.rate(id, req.user.id, rateProductDto.value);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Request() req: RequestWithUser,
  ) {
    return this.productsService.update(id, updateProductDto, req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.productsService.remove(id, req.user.id);
  }
}
