import { IsOptional, IsObject } from 'class-validator';

export class StartVerificationDto {
  @IsOptional()
  @IsObject()
  options?: Record<string, any>;
}
