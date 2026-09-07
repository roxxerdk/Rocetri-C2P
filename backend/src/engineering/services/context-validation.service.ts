import { Injectable } from '@nestjs/common';
import { EngineeringContextData } from '../interfaces/engineering-context.types';

// ─── Validation Result ────────────────────────────────────────────────────────
export interface ContextValidationResult {
  status: 'READY' | 'NOT_READY';
  missingRequiredFields: string[];
  warnings: string[];
}

@Injectable()
export class ContextValidationService {
  /**
   * Deterministic planning-readiness check.
   * No AI involvement — backend-only.
   *
   * Blocking requirements (NOT_READY if missing):
   *  A. Product identity — drawing.partName OR drawing.partNumber
   *  B. Drawing type    — SINGLE_PART or ASSEMBLY (not UNKNOWN/null)
   *  C. Units           — drawing.units must be present
   *  D. Material name   — material.name must be present
   *  E. Meaningful geometry — at least one usable dimension anywhere
   *
   * Warnings (non-blocking — context may still be READY):
   *  - material.grade missing
   *  - material.standard missing
   *  - material.condition missing
   *  - general tolerance missing
   *  - surface finish missing
   *
   * Extraction warnings are surfaced as informational warnings — they do NOT
   * automatically make a context NOT_READY. Readiness is decided on actual field values.
   */
  validate(contextData: EngineeringContextData): ContextValidationResult {
    const missing: string[] = [];
    const warnings: string[] = [];

    // ── A. Product Identity ───────────────────────────────────────────────────
    const hasPartName = !!contextData.drawing?.partName?.trim();
    const hasPartNumber = !!contextData.drawing?.partNumber?.trim();
    if (!hasPartName && !hasPartNumber) {
      missing.push('drawing.partName or drawing.partNumber');
    }

    // ── B. Drawing Type ───────────────────────────────────────────────────────
    const drawingType = contextData.drawing?.drawingType;
    if (!drawingType || drawingType === 'UNKNOWN') {
      missing.push('drawing.drawingType (must be SINGLE_PART or ASSEMBLY)');
    }

    // ── C. Units ──────────────────────────────────────────────────────────────
    if (!contextData.drawing?.units?.trim()) {
      missing.push('drawing.units');
    }

    // ── D. Material Name ──────────────────────────────────────────────────────
    if (!contextData.material?.name?.trim()) {
      missing.push('material.name');
    }

    // ── E. Meaningful Geometry / Usable Dimension ─────────────────────────────
    const hasUsableDimension = this.hasUsableDimension(contextData);
    if (!hasUsableDimension) {
      missing.push(
        'geometry (at least one usable dimension in overallDimensions or feature dimensions)',
      );
    }

    // ── Warnings (non-blocking) ───────────────────────────────────────────────
    if (!contextData.material?.grade?.trim()) {
      warnings.push('material.grade not specified');
    }

    if (!contextData.material?.standard?.trim()) {
      warnings.push('material.standard not specified');
    }

    if (!contextData.material?.condition?.trim()) {
      warnings.push('material.condition not specified');
    }

    if (!contextData.tolerances?.generalTolerance?.value?.trim()) {
      warnings.push('No general tolerance specified');
    }

    if (!contextData.manufacturingRequirements?.surfaceFinish?.length) {
      warnings.push('No surface finish specification found');
    }

    // ── Surface extraction warnings from source context (informational only) ──
    const extractionWarnings = contextData.extractionMetadata?.extractionWarnings ?? [];
    for (const w of extractionWarnings) {
      warnings.push(`Extraction warning: ${w}`);
    }

    return {
      status: missing.length === 0 ? 'READY' : 'NOT_READY',
      missingRequiredFields: missing,
      warnings,
    };
  }

  // ── Geometry helper ────────────────────────────────────────────────────────

  /**
   * A context has usable dimensional information if:
   * - overallDimensions has at least one entry with a non-empty rawValue
   * OR
   * - any feature has at least one dimension with a non-empty rawValue
   */
  private hasUsableDimension(contextData: EngineeringContextData): boolean {
    const overallDims = contextData.geometry?.overallDimensions ?? [];
    if (overallDims.some(d => d.rawValue?.trim())) return true;

    const features = contextData.geometry?.features ?? [];
    return features.some(f =>
      (f.dimensions ?? []).some(d => d.rawValue?.trim()),
    );
  }
}
