import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ClaudeProvider } from '../../ai/providers/claude.provider';
import { ExtractionInputPreparer } from './extraction-input.preparer';
import { ExtractionSchemaValidator } from './extraction-schema.validator';
import { EngineeringContextData } from '../interfaces/engineering-context.types';
import {
  E1_SYSTEM, E1_PROMPT,
  E2_SYSTEM, buildE2Prompt,
  E3_SYSTEM, buildE3Prompt,
} from './extraction.prompt';

export interface ExtractionResult {
  contextData: EngineeringContextData;
  inputCount: number;
  warnings: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Strip markdown fences and parse JSON — throws with stage name on failure */
function parseJson(raw: string, stage: string): any {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`${stage} returned invalid JSON: ${getErrorMessage(e)}`);
  }
}

/** Safe call — returns fallback + error string on failure, never throws */
async function safeCall<T>(
  fn: () => Promise<T>,
  fallback: T,
  logger: Logger,
  stage: string,
): Promise<{ result: T; error: string | null }> {
  try {
    return { result: await fn(), error: null };
  } catch (err) {
    const msg = getErrorMessage(err);
    logger.error(`${stage} failed: ${msg}`);
    return { result: fallback, error: msg };
  }
}

/**
 * Compact E1 summary passed to E2 — just the priority fields already extracted,
 * so E2 knows what NOT to re-extract and can focus on geometry/dimensions.
 */
function buildE1Summary(e1: any): object {
  return {
    material: e1?.material ?? null,
    generalTolerance: e1?.generalTolerance ?? null,
    hasDimensionalTolerances: (e1?.dimensionalTolerances ?? []).length > 0,
    hasGeometricTolerances: (e1?.geometricTolerances ?? []).length > 0,
    hasSpecialNotes: (e1?.specialNotes ?? []).length > 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class ClaudeExtractionService {
  private readonly logger = new Logger(ClaudeExtractionService.name);

  constructor(
    private readonly claudeProvider: ClaudeProvider,
    private readonly inputPreparer: ExtractionInputPreparer,
    private readonly schemaValidator: ExtractionSchemaValidator,
  ) {}

  /**
  * 3-stage Claude extraction pipeline for ONE product.
   *
   * Stage 1 (E1): Priority — tolerances, material, physical faces, special notes
   *   → original files + focused prompt
   *
   * Stage 2 (E2): Geometry — features, dimensions, drawing identity
   *   → original files + compact E1 summary (not full output)
   *
   * Stage 3 (E3): Consolidation — merge E1 + E2, deduplicate, completeness check
   *   → JSON only (no original files re-sent)
   *
   * Never creates a context document — caller (EngineeringService) does that.
   */
  async extractFromFiles(files: Express.Multer.File[]): Promise<ExtractionResult> {
    this.logger.log(`3-stage extraction: ${files.length} file(s)`);

    // ── Prepare inputs ────────────────────────────────────────────────────────
    const inputs = await this.inputPreparer.prepare(files);
    const pipelineWarnings: string[] = [];

    // ── Stage 1: Priority Engineering Information ─────────────────────────────
    this.logger.log('E1: Priority — tolerances, material, faces, notes');

    const { result: e1, error: e1Err } = await safeCall(
      async () => {
        const raw = await this.claudeProvider.generateMultimodal(E1_SYSTEM, E1_PROMPT, inputs);
        return parseJson(raw, 'E1');
      },
      {
        material: { name: null, grade: null, standard: null, condition: null },
        generalTolerance: { value: null, appliesUnlessSpecified: false },
        dimensionalTolerances: [],
        geometricTolerances: [],
        physicalFaces: [],
        heatTreatment: null,
        surfaceTreatment: null,
        surfaceFinish: [],
        specialNotes: [],
        manufacturingNotes: [],
        warnings: [],
      },
      this.logger,
      'E1',
    );

    if (e1Err) pipelineWarnings.push(`E1 Priority Extraction failed: ${e1Err}`);
    for (const w of e1?.warnings ?? []) pipelineWarnings.push(`E1: ${w}`);

    this.logger.log(
      `E1 complete — material: ${e1?.material?.name ?? 'unknown'}, ` +
      `tolerances: ${(e1?.dimensionalTolerances ?? []).length}, ` +
      `GD&T: ${(e1?.geometricTolerances ?? []).length}`,
    );

    // ── Stage 2: Geometry + Features + Dimensions ─────────────────────────────
    this.logger.log('E2: Geometry, features, dimensions');

    const e1Summary = buildE1Summary(e1);

    const { result: e2, error: e2Err } = await safeCall(
      async () => {
        const raw = await this.claudeProvider.generateMultimodal(
          E2_SYSTEM, buildE2Prompt(e1Summary), inputs,
        );
        return parseJson(raw, 'E2');
      },
      {
        overallShape: null,
        drawing: { partName: null, partNumber: null, revision: null, drawingType: 'UNKNOWN', units: null, scale: null, projection: null },
        overallDimensions: [],
        features: [],
        assembly: null,
        sourceViews: [],
        warnings: [],
      },
      this.logger,
      'E2',
    );

    if (e2Err) pipelineWarnings.push(`E2 Geometry Extraction failed: ${e2Err}`);
    for (const w of e2?.warnings ?? []) pipelineWarnings.push(`E2: ${w}`);

    this.logger.log(
      `E2 complete — drawingType: ${e2?.drawing?.drawingType}, ` +
      `overallDims: ${(e2?.overallDimensions ?? []).length}, ` +
      `features: ${(e2?.features ?? []).length}`,
    );

    // ── Stage 3: Consolidation + Final JSON ───────────────────────────────────
    this.logger.log('E3: Consolidation and final Unified Engineering Context');

    const { result: e3Raw, error: e3Err } = await safeCall(
      () => this.claudeProvider.generateText(E3_SYSTEM, buildE3Prompt(e1, e2)),
      null,
      this.logger,
      'E3',
    );

    if (e3Err || !e3Raw) {
      throw new InternalServerErrorException(
        `E3 Consolidation failed — cannot produce final context: ${e3Err ?? 'empty response'}`,
      );
    }

    // ── Structural validation ─────────────────────────────────────────────────
    let contextData: EngineeringContextData;
    try {
      contextData = this.schemaValidator.parseAndValidate(e3Raw);
    } catch (err) {
      this.logger.error(`Schema validation failed: ${getErrorMessage(err)}`);
      this.logger.debug(`Raw E3 response:\n${e3Raw}`);
      throw new InternalServerErrorException(
        `E3 response failed schema validation: ${getErrorMessage(err)}`,
      );
    }

    // Merge pipeline-level warnings into extractionMetadata
    const existing = contextData.extractionMetadata?.extractionWarnings ?? [];
    contextData.extractionMetadata.extractionWarnings = [...existing, ...pipelineWarnings];

    this.logger.log(
      `Extraction complete — drawingType: ${contextData.drawing.drawingType}, ` +
      `features: ${contextData.geometry.features.length}, ` +
      `overallDims: ${contextData.geometry.overallDimensions.length}, ` +
      `warnings: ${contextData.extractionMetadata.extractionWarnings.length}`,
    );

    return {
      contextData,
      inputCount: inputs.length,
      warnings: contextData.extractionMetadata.extractionWarnings,
    };
  }
}
