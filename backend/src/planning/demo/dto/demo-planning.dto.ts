import { IsOptional, IsString, IsObject } from "class-validator";

export interface InputSourcesInfo {
  uploadedFile?: {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
  };
  extractedText?: string;
  userDescription?: string;
}

export interface PartPlanningInput {
  partName?: string;
  material?: string;
  materialFamily?: string;
  rawMaterial?: {
    stockForm?: string;
    dimensions?: Record<string, any>;
  };
  dimensions?: Record<string, any>;
  description?: string;
  inputSources: InputSourcesInfo;
}

export interface IdentifiedFeature {
  geometryType: string;
  functionalRole: string;
  description: string;
  confidence: number;
  source: string;
}

export interface IdentifiedRequirement {
  requirementType: string;
  toleranceClass: string | null;
  description: string;
}

export interface FeatureInterpretationResult {
  identifiedFeatures: IdentifiedFeature[];
  identifiedRequirements: IdentifiedRequirement[];
  assumptions: string[];
  unknownInformation: string[];
}

export interface OperationPlan {
  sequence: number;
  operationName: string;
  processFamily: string;
  processStage: string;
  targetFeatures: string[];
  inputState: string;
  outputState: string;
  toolRequirement: Record<string, any>;
  measurementRequirement: Record<string, any>;
  reason: string;
}

export interface SetupPlan {
  sequence: number;
  setupPurpose: string;
  machineRequirement: Record<string, any>;
  workholdingRequirement: Record<string, any>;
  operations: OperationPlan[];
}

export interface StructuredProcessPlan {
  planningSummary: string;
  manufacturingStates: string[];
  setups: SetupPlan[];
  heatTreatment: Array<Record<string, any>>;
  qualityCheckpoints: Array<Record<string, any>>;
  assumptions: string[];
  warnings: string[];
  unknownInformation: string[];
}

export class AnalyzePartDto {
  @IsOptional()
  @IsString()
  partName?: string;

  @IsOptional()
  @IsString()
  material?: string;

  @IsOptional()
  @IsString()
  materialFamily?: string;

  @IsOptional()
  rawMaterial?: any;

  @IsOptional()
  dimensions?: any;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  inputSources?: any;
}

export class GenerateProcessPlanDto {
  @IsObject()
  partInput: PartPlanningInput;

  @IsObject()
  interpretation: FeatureInterpretationResult;
}
