import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ResolveReportDto {
  // RESOLVED: se tomó acción · DISMISSED: el reporte no procedía
  @IsIn(['RESOLVED', 'DISMISSED'], { message: 'Estado inválido' })
  status: 'RESOLVED' | 'DISMISSED';

  @IsOptional()
  @IsString()
  @MaxLength(300)
  resolution?: string;
}
