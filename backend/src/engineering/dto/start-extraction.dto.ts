import { IsString, IsOptional, IsObject } from 'class-validator';

export class StartExtractionDto {
  @IsOptional()
  @IsString()
  caedFileReference?: string;

  @IsOptional()
  @IsObject()
  options?: Record<string, any>;
}
