import { FeatureType } from '../../shared/enums';

// ─── Dimension ────────────────────────────────────────────────────────────────
export interface Dimension {
  name: string;
  value: number | null;        // parsed numeric — null when not safely parseable
  rawValue: string;            // original engineering string, e.g. "Ø40", "M10 x 1.5"
  unit: string | null;
  tolerance: string | null;
  critical: boolean;
}

// ─── Feature ──────────────────────────────────────────────────────────────────
export interface Feature {
  type: FeatureType;
  name: string | null;
  quantity: number | null;
  dimensions: Dimension[];
  locationReference: string | null;
  notes: string[];
}

// ─── Drawing ──────────────────────────────────────────────────────────────────
export interface DrawingInfo {
  partName: string | null;
  partNumber: string | null;
  revision: string | null;
  drawingType: 'SINGLE_PART' | 'ASSEMBLY' | 'UNKNOWN';
  units: string | null;
  scale: string | null;
  projection: string | null;
}

// ─── Material ─────────────────────────────────────────────────────────────────
export interface Material {
  name: string | null;
  grade: string | null;
  standard: string | null;
  condition: string | null;
}

// ─── Geometry ─────────────────────────────────────────────────────────────────
export interface Geometry {
  overallDimensions: Dimension[];
  features: Feature[];
}

// ─── Tolerances ───────────────────────────────────────────────────────────────
export interface GeometricTolerance {
  type: string;
  value: string | null;
  datumReferences: string[];
  appliesTo: string | null;
}

export interface Tolerances {
  generalTolerance: {
    value: string | null;
    appliesUnlessSpecified: boolean;
  };
  geometricTolerances: GeometricTolerance[];
}

// ─── Manufacturing Requirements ───────────────────────────────────────────────
export interface SurfaceFinish {
  appliesTo: string | null;
  roughnessRa: number | null;
  unit: string | null;
  notes: string | null;
}

export interface SurfaceTreatment {
  type: string;
  thickness: string | null;
  applyStage: string | null;
  notes: string | null;
}

export interface HeatTreatment {
  specification: string;
  temperatureRange: string | null;
  coolingMethod: string | null;
  standard: string | null;
}

export interface ManufacturingRequirements {
  surfaceFinish: SurfaceFinish[];
  surfaceTreatment: SurfaceTreatment | null;
  heatTreatment: HeatTreatment | null;
  manufacturingNotes: string[];
}

// ─── Assembly ─────────────────────────────────────────────────────────────────
export interface AssemblyComponent {
  itemNumber: number | null;
  name: string;
  partNumber: string | null;
  material: string | null;
  quantity: number | null;
}

export interface Assembly {
  components: AssemblyComponent[];
}

// ─── Extraction Metadata ──────────────────────────────────────────────────────
export interface ExtractionMetadata {
  sourceViews: string[];
  confidence: number | null;
  extractionWarnings: string[];
}

// ─── Unified Engineering Context Data ─────────────────────────────────────────
// This is the shape stored in context.contextData across ALL lifecycle stages:
// EXTRACTED → USER_CORRECTED → VERIFIED
export interface EngineeringContextData {
  drawing: DrawingInfo;
  material: Material;
  geometry: Geometry;
  tolerances: Tolerances;
  manufacturingRequirements: ManufacturingRequirements;
  assembly: Assembly | null;       // null for SINGLE_PART drawings
  extractionMetadata: ExtractionMetadata;
}

// ─── Empty context factory — used when seeding a new EXTRACTED context ────────
export function emptyEngineeringContextData(): EngineeringContextData {
  return {
    drawing: {
      partName: null,
      partNumber: null,
      revision: null,
      drawingType: 'UNKNOWN',
      units: null,
      scale: null,
      projection: null,
    },
    material: {
      name: null,
      grade: null,
      standard: null,
      condition: null,
    },
    geometry: {
      overallDimensions: [],
      features: [],
    },
    tolerances: {
      generalTolerance: { value: null, appliesUnlessSpecified: false },
      geometricTolerances: [],
    },
    manufacturingRequirements: {
      surfaceFinish: [],
      surfaceTreatment: null,
      heatTreatment: null,
      manufacturingNotes: [],
    },
    assembly: null,
    extractionMetadata: {
      sourceViews: [],
      confidence: null,
      extractionWarnings: [],
    },
  };
}
