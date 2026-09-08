import { Injectable, Logger } from '@nestjs/common';
import {
  EngineeringContextData,
  emptyEngineeringContextData,
  Feature,
  Dimension,
} from '../interfaces/engineering-context.types';
import { FeatureType } from '../../shared/enums';

const VALID_FEATURE_TYPES = Object.values(FeatureType);
const VALID_DRAWING_TYPES = ['SINGLE_PART', 'ASSEMBLY', 'UNKNOWN'];

@Injectable()
export class ExtractionSchemaValidator {
  private readonly logger = new Logger(ExtractionSchemaValidator.name);

  /**
   * Parses and validates Claude's raw text response.
   * Returns a sanitized EngineeringContextData on success.
   * Throws if the response cannot be parsed or is structurally invalid.
   *
   * NOTE: This is STRUCTURAL validation only — not planning-readiness validation.
   * Missing engineering values (null fields) are perfectly valid in EXTRACTED context.
   */
  parseAndValidate(rawResponse: string): EngineeringContextData {
    // ── 1. Strip markdown code fences if Claude wrapped its output ────────────
    const cleaned = this.stripMarkdown(rawResponse);

    // ── 2. Parse JSON ─────────────────────────────────────────────────────────
    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      throw new Error(`Claude response is not valid JSON: ${e.message}`);
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('Claude response must be a JSON object');
    }

    // ── 3. Strip any AI-generated database metadata fields ────────────────────
    delete parsed._id;
    delete parsed.projectId;
    delete parsed.contextId;
    delete parsed.stage;
    delete parsed.version;
    delete parsed.createdAt;
    delete parsed.updatedAt;
    delete parsed.partClassification; // explicitly forbidden per spec

    // ── 4. Build validated context — section by section ───────────────────────
    const base = emptyEngineeringContextData();
    const result: EngineeringContextData = { ...base };

    result.drawing = this.validateDrawing(parsed.drawing);
    result.material = this.validateMaterial(parsed.material);
    result.geometry = this.validateGeometry(parsed.geometry);
    result.tolerances = this.validateTolerances(parsed.tolerances);
    result.manufacturingRequirements = this.validateManufacturingRequirements(
      parsed.manufacturingRequirements,
    );
    result.assembly = this.validateAssembly(parsed.assembly, result.drawing.drawingType);
    result.extractionMetadata = this.validateExtractionMetadata(parsed.extractionMetadata);

    return result;
  }

  // ── Section validators ──────────────────────────────────────────────────────

  private validateDrawing(d: any): EngineeringContextData['drawing'] {
    if (!d || typeof d !== 'object') return emptyEngineeringContextData().drawing;

    const drawingType = VALID_DRAWING_TYPES.includes(d.drawingType)
      ? d.drawingType
      : 'UNKNOWN';

    return {
      partName: this.safeString(d.partName),
      partNumber: this.safeString(d.partNumber),
      revision: this.safeString(d.revision),
      drawingType,
      units: this.safeString(d.units),
      scale: this.safeString(d.scale),
      projection: this.safeString(d.projection),
    };
  }

  private validateMaterial(m: any): EngineeringContextData['material'] {
    if (!m || typeof m !== 'object') return emptyEngineeringContextData().material;
    return {
      name: this.safeString(m.name),
      grade: this.safeString(m.grade),
      standard: this.safeString(m.standard),
      condition: this.safeString(m.condition),
    };
  }

  private validateGeometry(g: any): EngineeringContextData['geometry'] {
    if (!g || typeof g !== 'object') return emptyEngineeringContextData().geometry;
    return {
      overallDimensions: this.validateDimensionArray(g.overallDimensions),
      features: this.validateFeatureArray(g.features),
    };
  }

  private validateDimensionArray(arr: any): Dimension[] {
    if (!Array.isArray(arr)) return [];
    return arr
      .map(d => this.validateDimension(d))
      .filter((d): d is Dimension => d !== null);
  }

  private validateDimension(d: any): Dimension | null {
    if (!d || typeof d !== 'object') return null;
    if (typeof d.rawValue !== 'string' || !d.rawValue.trim()) return null; // rawValue required

    return {
      name: typeof d.name === 'string' ? d.name : 'unnamed',
      value: typeof d.value === 'number' ? d.value : null,
      rawValue: d.rawValue.trim(),
      unit: this.safeString(d.unit),
      tolerance: this.safeString(d.tolerance),
      critical: d.critical === true,
    };
  }

  private validateFeatureArray(arr: any): Feature[] {
    if (!Array.isArray(arr)) return [];
    return arr
      .map(f => this.validateFeature(f))
      .filter((f): f is Feature => f !== null);
  }

  private validateFeature(f: any): Feature | null {
    if (!f || typeof f !== 'object') return null;

    const featureType: FeatureType = VALID_FEATURE_TYPES.includes(f.type)
      ? f.type
      : FeatureType.OTHER;

    return {
      type: featureType,
      name: this.safeString(f.name),
      quantity: typeof f.quantity === 'number' ? Math.floor(f.quantity) : null,
      dimensions: this.validateDimensionArray(f.dimensions),
      locationReference: this.safeString(f.locationReference),
      notes: Array.isArray(f.notes)
        ? f.notes.filter((n: any) => typeof n === 'string')
        : [],
    };
  }

  private validateTolerances(t: any): EngineeringContextData['tolerances'] {
    const base = emptyEngineeringContextData().tolerances;
    if (!t || typeof t !== 'object') return base;

    return {
      generalTolerance: {
        value: this.safeString(t.generalTolerance?.value),
        appliesUnlessSpecified: t.generalTolerance?.appliesUnlessSpecified === true,
      },
      geometricTolerances: Array.isArray(t.geometricTolerances)
        ? t.geometricTolerances
            .filter((gt: any) => gt && typeof gt === 'object')
            .map((gt: any) => ({
              type: typeof gt.type === 'string' ? gt.type : 'unknown',
              value: this.safeString(gt.value),
              datumReferences: Array.isArray(gt.datumReferences)
                ? gt.datumReferences.filter((r: any) => typeof r === 'string')
                : [],
              appliesTo: this.safeString(gt.appliesTo),
            }))
        : [],
    };
  }

  private validateManufacturingRequirements(
    mr: any,
  ): EngineeringContextData['manufacturingRequirements'] {
    const base = emptyEngineeringContextData().manufacturingRequirements;
    if (!mr || typeof mr !== 'object') return base;

    return {
      surfaceFinish: Array.isArray(mr.surfaceFinish)
        ? mr.surfaceFinish
            .filter((sf: any) => sf && typeof sf === 'object')
            .map((sf: any) => ({
              appliesTo: this.safeString(sf.appliesTo),
              roughnessRa: typeof sf.roughnessRa === 'number' ? sf.roughnessRa : null,
              unit: this.safeString(sf.unit),
              notes: this.safeString(sf.notes),
            }))
        : [],
      surfaceTreatment:
        mr.surfaceTreatment && typeof mr.surfaceTreatment === 'object'
          ? {
              type: typeof mr.surfaceTreatment.type === 'string' ? mr.surfaceTreatment.type : 'unknown',
              thickness: this.safeString(mr.surfaceTreatment.thickness),
              applyStage: this.safeString(mr.surfaceTreatment.applyStage),
              notes: this.safeString(mr.surfaceTreatment.notes),
            }
          : null,
      heatTreatment:
        mr.heatTreatment && typeof mr.heatTreatment === 'object'
          ? {
              specification:
                typeof mr.heatTreatment.specification === 'string'
                  ? mr.heatTreatment.specification
                  : 'unknown',
              temperatureRange: this.safeString(mr.heatTreatment.temperatureRange),
              coolingMethod: this.safeString(mr.heatTreatment.coolingMethod),
              standard: this.safeString(mr.heatTreatment.standard),
            }
          : null,
      manufacturingNotes: Array.isArray(mr.manufacturingNotes)
        ? mr.manufacturingNotes.filter((n: any) => typeof n === 'string')
        : [],
    };
  }

  private validateAssembly(
    a: any,
    drawingType: string,
  ): EngineeringContextData['assembly'] {
    // SINGLE_PART → assembly must be null
    if (drawingType === 'SINGLE_PART') return null;
    if (!a || typeof a !== 'object') return null;

    return {
      components: Array.isArray(a.components)
        ? a.components
            .filter((c: any) => c && typeof c === 'object' && typeof c.name === 'string')
            .map((c: any) => ({
              itemNumber: typeof c.itemNumber === 'number' ? c.itemNumber : null,
              name: c.name,
              partNumber: this.safeString(c.partNumber),
              material: this.safeString(c.material),
              quantity: typeof c.quantity === 'number' ? c.quantity : null,
            }))
        : [],
    };
  }

  private validateExtractionMetadata(
    em: any,
  ): EngineeringContextData['extractionMetadata'] {
    if (!em || typeof em !== 'object') {
      return emptyEngineeringContextData().extractionMetadata;
    }
    return {
      sourceViews: Array.isArray(em.sourceViews)
        ? em.sourceViews.filter((v: any) => typeof v === 'string')
        : [],
      confidence:
        typeof em.confidence === 'number'
          ? Math.min(1, Math.max(0, em.confidence))
          : null,
      extractionWarnings: Array.isArray(em.extractionWarnings)
        ? em.extractionWarnings.filter((w: any) => typeof w === 'string')
        : [],
    };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /** Returns a trimmed string, or null for empty/non-string values */
  private safeString(value: any): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  /** Strip markdown code fences Claude sometimes adds despite instructions */
  private stripMarkdown(text: string): string {
    return text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();
  }
}
