import { IsString, IsNumber, IsObject, IsOptional, Min, Max } from 'class-validator';

/**
 * Error details for a failed job
 */
export class JobErrorDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  details?: any;
}

/**
 * Response DTO for job status and details
 */
export class JobResponseDto {
  @IsString()
  _id: string;

  @IsString()
  projectId: string;

  @IsString()
  type: string;

  @IsString()
  status: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  progress: number;

  @IsOptional()
  @IsString()
  resultReference: string | null;

  @IsOptional()
  @IsObject()
  error: JobErrorDto | null;

  @IsString()
  createdAt: string;

  @IsString()
  updatedAt: string;

  @IsOptional()
  @IsString()
  completedAt: string | null;
}
