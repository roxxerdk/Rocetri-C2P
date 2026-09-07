import { IsOptional, IsObject } from 'class-validator';

export class GenerateReportDto {
  @IsOptional()
  @IsObject()
  options?: Record<string, any>;
}
