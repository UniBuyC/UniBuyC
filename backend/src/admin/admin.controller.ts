import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { BanDto, SuspendDto } from './dto/moderation.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';

interface RequestWithUser {
  user: { id: string; email: string };
}

// 🔒 Todo el panel requiere sesión (JWT) y rol ADMIN
@UseGuards(AuthGuard('jwt'), AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  stats() {
    return this.adminService.stats();
  }

  @Get('users')
  listUsers() {
    return this.adminService.listUsers();
  }

  @Patch('users/:id/password')
  resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.adminService.resetPassword(id, dto.password);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.adminService.deleteUser(id, req.user.id);
  }

  // Suspensión temporal (días) con motivo opcional
  @Post('users/:id/suspend')
  suspend(@Param('id') id: string, @Body() dto: SuspendDto, @Request() req: RequestWithUser) {
    return this.adminService.suspend(id, dto.days, dto.reason, req.user.id);
  }

  // Bloqueo permanente (también bloquea su correo y matrícula)
  @Post('users/:id/ban')
  ban(@Param('id') id: string, @Body() dto: BanDto, @Request() req: RequestWithUser) {
    return this.adminService.ban(id, dto.reason, req.user.id);
  }

  @Post('users/:id/reactivate')
  reactivate(@Param('id') id: string) {
    return this.adminService.reactivate(id);
  }

  @Get('products')
  listProducts() {
    return this.adminService.listProducts();
  }

  @Get('products/:id')
  getProduct(@Param('id') id: string) {
    return this.adminService.getProduct(id);
  }

  // ?status=PENDING (por defecto), RESOLVED, DISMISSED o ALL
  @Get('reports')
  listReports(@Query('status') status?: string) {
    return this.adminService.listReports(status || 'PENDING');
  }

  @Post('reports/:id/resolve')
  resolveReport(@Param('id') id: string, @Body() dto: ResolveReportDto) {
    return this.adminService.resolveReport(id, dto.status, dto.resolution);
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') id: string) {
    return this.adminService.deleteProduct(id);
  }
}
