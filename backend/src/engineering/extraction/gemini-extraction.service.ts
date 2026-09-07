import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { GeminiProvider } from '../../ai/providers/gemini.provider';
import { ExtractionInputPreparer } from './extraction-input.preparer';
import { ExtractionSchemaValidator } from './extraction-schema.validator';
import { EngineeringContextData } from '../interfaces/engineering-context.types';
import { EngineeringInput } from '../interfaces/engineering-input.types';
import {
  C1_SYSTEM, C1_PROMPT,
  C2_SYSTEM, buildC2Prompt,
  C3_SYSTEM, buildC3Prompt,
  C4_SYSTEM, buildC4Prompt,
  C5_SYSTEM, buildC5Prompt,
  C6_SYSTEM, buildC6Prompt,
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

/** Strip markdown code fences and parse JSON — throws on failure */
function parseJson(raw: string, containerName: string): any {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`${containerName} returned invalid JSON: ${getErrorMessage(e)}`);
  }
}

/** Safe container call — returns fallback on error instead of throwing */
async function safeCall<T>(
  fn: () => Promise<T>,
  fallback: T,
  logger: Logger,
  containerName: string,
): Promise<{ result: T; error: string | null }> {
  try {
    const result = await fn();
    return { result, error: null };
  } catch (err) {
    const msg = getErrorMessage(err);
    logger.error(`${containerName} failed: ${msg}`);
    return { result: fallback, error: msg };
  }
}

// ── Compact feature summary for C5 (avoids sending full C4 output) ────────────
function buildFeatureSummary(c4: any): object {
  const features = Array.isArray(c4?.features) ? c4.features : [];
  return {
    overallShape: c4?.overallShape ?? null,
    featureNames: features.map((f: any) => ({
      type: f.type ?? 'OTHER',
      name: f.name ?? null,
      quantity: f.quantity ?? null,
      locationReference: f.locationReference ?? null,
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class GeminiExtractionService {
  private readonly logger = new Logger(GeminiExtractionService.name);

  constructor(
    private readonly geminiProvider: GeminiProvider,
    private readonly inputPreparer: ExtractionInputPreparer,
    private readonly schemaValidator: ExtractionSchemaValidator,
  ) {}

  /**
   * 6-container extraction pipeline for ONE product.
   *
   * Flow:
   *   files → prepare inputs
   *     → C1 (Input Understanding) → drawingMap
   *     → C2 (Drawing Identity) ──┐
   *     → C3 (Material & Reqs)   ├─ run independently (files + drawingMap)
   *     → C4 (Geometry)          ┘
   *     → C5 (Dimensions) — files + drawingMap + compact C4 summary
   *     → C6 (Merge) — JSON only
   *     → structural validation → EngineeringContextData
   *
   * Never creates a context document — caller (EngineeringService) does that.
   */
  async extractFromFiles(files: Express.Multer.File[]): Promise<ExtractionResult> {
    this.logger.log(`6-container extraction: ${files.length} file(s)`);

    // ── Prepare inputs ────────────────────────────────────────────────────────
    const inputs = await this.inputPreparer.prepare(files);
    const pipelineWarnings: string[] = [];

    // ── Container 1: Input Understanding ─────────────────────────────────────
    this.logger.log('C1: Input Understanding');
    let drawingMap: any = { views: [], warnings: [], informationLocations: {} };

    const { result: c1Raw, error: c1Err } = await safeCall(
      () => this.geminiProvider.generateMultimodal(C1_SYSTEM, C1_PROMPT, inputs),
      null,
      this.logger,
      'C1',
    );

    if (c1Err || !c1Raw) {
      pipelineWarnings.push(`C1 Input Understanding failed: ${c1Err ?? 'empty response'}`);
    } else {
      try {
        drawingMap = parseJson(c1Raw, 'C1');
        if (Array.isArray(drawingMap.warnings)) {
          pipelineWarnings.push(...drawingMap.warnings.map((w: string) => `C1: ${w}`));
        }
      } catch (e) {
        pipelineWarnings.push(getErrorMessage(e));
      }
    }
    this.logger.log(`C1 complete — views: ${(drawingMap.views ?? []).length}`);

    // ── Containers 2, 3, 4: Independent (parallel) ───────────────────────────
    this.logger.log('C2/C3/C4: Running independently');

    const [c2Outcome, c3Outcome, c4Outcome] = await Promise.all([
      // C2: Drawing Identity
      safeCall(
        async () => {
          const raw = await this.geminiProvider.generateMultimodal(
            C2_SYSTEM, buildC2Prompt(drawingMap), inputs,
          );
          return parseJson(raw, 'C2');
        },
        { partName: null, partNumber: null, revision: null, drawingType: 'UNKNOWN', units: null, scale: null, projection: null, warnings: [] },
        this.logger,
        'C2',
      ),

      // C3: Material & Requirements
      safeCall(
        async () => {
          const raw = await this.geminiProvider.generateMultimodal(
            C3_SYSTEM, buildC3Prompt(drawingMap), inputs,
          );
          return parseJson(raw, 'C3');
        },
        { material: { name: null, grade: null, standard: null, condition: null }, heatTreatment: null, surfaceTreatment: null, surfaceFinish: [], manufacturingNotes: [], warnings: [] },
        this.logger,
        'C3',
      ),

      // C4: Geometry & Features
      safeCall(
        async () => {
          const raw = await this.geminiProvider.generateMultimodal(
            C4_SYSTEM, buildC4Prompt(drawingMap), inputs,
          );
          return parseJson(raw, 'C4');
        },
        { overallShape: null, overallDimensions: [], features: [], warnings: [] },
        this.logger,
        'C4',
      ),
    ]);

    const c2 = c2Outcome.result;
    const c3 = c3Outcome.result;
    const c4 = c4Outcome.result;

    if (c2Outcome.error) pipelineWarnings.push(`C2 Drawing Identity failed: ${c2Outcome.error}`);
    if (c3Outcome.error) pipelineWarnings.push(`C3 Material failed: ${c3Outcome.error}`);
    if (c4Outcome.error) pipelineWarnings.push(`C4 Geometry failed: ${c4Outcome.error}`);

    // Collect per-container warnings
    for (const w of c2?.warnings ?? []) pipelineWarnings.push(`C2: ${w}`);
    for (const w of c3?.warnings ?? []) pipelineWarnings.push(`C3: ${w}`);
    for (const w of c4?.warnings ?? []) pipelineWarnings.push(`C4: ${w}`);

    this.logger.log(
      `C2/C3/C4 complete — drawingType: ${c2?.drawingType}, ` +
      `material: ${c3?.material?.name}, features: ${c4?.features?.length ?? 0}`,
    );

    // ── Container 5: Dimensions & Tolerances ──────────────────────────────────
    this.logger.log('C5: Dimensions & Tolerances');

    const featureSummary = buildFeatureSummary(c4);

    const { result: c5, error: c5Err } = await safeCall(
      async () => {
        const raw = await this.geminiProvider.generateMultimodal(
          C5_SYSTEM, buildC5Prompt(drawingMap, featureSummary), inputs,
        );
        return parseJson(raw, 'C5');
      },
      { overallDimensions: [], featureDimensions: [], generalTolerance: { value: null, appliesUnlessSpecified: false }, geometricTolerances: [], warnings: [] },
      this.logger,
      'C5',
    );

    if (c5Err) pipelineWarnings.push(`C5 Dimensions failed: ${c5Err}`);
    for (const w of c5?.warnings ?? []) pipelineWarnings.push(`C5: ${w}`);

    this.logger.log(
      `C5 complete — overallDims: ${c5?.overallDimensions?.length ?? 0}, ` +
      `featureDims: ${c5?.featureDimensions?.length ?? 0}`,
    );

    // ── Container 6: Final Merge (JSON only — no original files) ─────────────
    this.logger.log('C6: Final Merge & Conflict Resolution');

    const { result: c6Raw, error: c6Err } = await safeCall(
      () => this.geminiProvider.generateText(
        C6_SYSTEM,
        buildC6Prompt(drawingMap, c2, c3, c4, c5),
      ),
      null,
      this.logger,
      'C6',
    );

    if (c6Err || !c6Raw) {
      throw new InternalServerErrorException(
        `C6 Final Merge failed — cannot produce Unified Engineering Context: ${c6Err ?? 'empty response'}`,
      );
    }

    // ── Structural validation ─────────────────────────────────────────────────
    let contextData: EngineeringContextData;
    try {
      contextData = this.schemaValidator.parseAndValidate(c6Raw);
    } catch (err) {
      this.logger.error(`Schema validation failed: ${getErrorMessage(err)}`);
      this.logger.debug(`Raw C6 response:\n${c6Raw}`);
      throw new InternalServerErrorException(
        `C6 response failed schema validation: ${getErrorMessage(err)}`,
      );
    }

    // Merge pipeline-level warnings into extractionMetadata
    const existingWarnings = contextData.extractionMetadata?.extractionWarnings ?? [];
    contextData.extractionMetadata.extractionWarnings = [
      ...existingWarnings,
      ...pipelineWarnings,
    ];

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
