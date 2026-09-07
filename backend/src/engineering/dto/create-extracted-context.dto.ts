import { IsObject, IsOptional } from 'class-validator';
import { EngineeringContextData } from '../interfaces/engineering-context.types';

/**
 * Used by the extraction pipeline (Gemini) to store the extracted context.
 * At this stage contextData may be partial — fields can be null.
 */
export class CreateExtractedContextDto {
  @IsObject()
  contextData: EngineeringContextData;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
