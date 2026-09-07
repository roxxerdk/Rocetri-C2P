import { IsObject, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ModifyPlanDto {
  @IsObject()
  @IsNotEmpty()
  modifications: Record<string, any>;

  @IsOptional()
  @IsString()
  comment?: string;
}
