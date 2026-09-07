import { IsOptional, IsObject } from 'class-validator';

export class GeneratePlanDto {
  @IsOptional()
  @IsObject()
  options?: Record<string, any>;
}
