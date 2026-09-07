import { IsObject, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SubmitCorrectionDto {
  @IsObject()
  @IsNotEmpty()
  corrections: Record<string, any>;

  @IsOptional()
  @IsString()
  comment?: string;
}
