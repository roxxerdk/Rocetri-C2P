// ─── Workflow Stages ───
export enum WorkflowStage {
  UPLOADED = 'UPLOADED',
  EXTRACTED = 'EXTRACTED',
  CORRECTED = 'CORRECTED',
  VERIFIED = 'VERIFIED',
  PLANNED = 'PLANNED',
}

// ─── Derived Status ───
export enum DerivedStatus {
  PROCESSING = 'PROCESSING',
  VALID = 'VALID',
  OUTDATED = 'OUTDATED',
  FAILED = 'FAILED',
}

// ─── Context Types ───
export enum ContextType {
  EXTRACTED = 'EXTRACTED',
  USER_CORRECTED = 'USER_CORRECTED',
  VERIFIED = 'VERIFIED',
}

// ─── Conversation Types ───
export enum ConversationType {
  EXTRACTION = 'EXTRACTION',
  PLANNING = 'PLANNING',
}

// ─── Job Types ───
export enum JobType {
  EXTRACTION = 'EXTRACTION',
  VERIFICATION = 'VERIFICATION',
  PROCESS_PLANNING = 'PROCESS_PLANNING',
  REPORT_GENERATION = 'REPORT_GENERATION',
}

// ─── Job Status ───
export enum JobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// ─── Feature Types ───
export enum FeatureType {
  HOLE = 'HOLE',
  BORE = 'BORE',
  COUNTERBORE = 'COUNTERBORE',
  COUNTERSINK = 'COUNTERSINK',
  SLOT = 'SLOT',
  POCKET = 'POCKET',
  THREAD = 'THREAD',
  SHAFT = 'SHAFT',
  CYLINDER = 'CYLINDER',
  STEP = 'STEP',
  SHOULDER = 'SHOULDER',
  KEYWAY = 'KEYWAY',
  CHAMFER = 'CHAMFER',
  FILLET = 'FILLET',
  ARC = 'ARC',
  CUTOUT = 'CUTOUT',
  GEAR = 'GEAR',
  OTHER = 'OTHER',
}


export * from '../../planning/ontology/enums';
