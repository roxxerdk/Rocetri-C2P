import { IsOptional, IsString, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * SubmitCorrectionDto — user sends a partial contextData patch.
 *
 * The backend does a deep merge of the corrections onto the existing EXTRACTED
 * context to produce a new USER_CORRECTED context document.
 *
 * The user does NOT need to send the full contextData — only the sections they
 * are correcting. Example:
 *
 *  {
 *    "corrections": {
 *      "material": { "name": "Aluminium", "grade": "7075-T6" }
 *    },
 *    "comment": "Corrected material grade from drawing title block"
 *  }
 */
export class SubmitCorrectionDto {
  @IsObject()
  corrections: Partial<Record<string, any>>;

  @IsOptional()
  @IsString()
  comment?: string;
}
