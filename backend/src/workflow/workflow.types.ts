import { WorkflowStage } from '../shared/enums';

// ─── Allowed Operations ───
export type WorkflowOperation = 'extract' | 'correct' | 'verify' | 'plan' | 'report';

// ─── Transition Rules ───
// Defines which operations are allowed from each workflow stage
export const WORKFLOW_TRANSITIONS: Record<WorkflowStage, WorkflowOperation[]> = {
  [WorkflowStage.UPLOADED]: ['extract'],
  [WorkflowStage.EXTRACTED]: ['extract', 'correct', 'verify', 'plan'],
  [WorkflowStage.CORRECTED]: ['extract', 'correct', 'verify', 'plan'],
  [WorkflowStage.VERIFIED]: ['extract', 'correct', 'verify', 'plan'],
  [WorkflowStage.PLANNED]: ['extract', 'correct', 'verify', 'plan', 'report'],
};

// ─── Stage Progression ───
// Maps an operation to the stage the project moves to after completion
export const OPERATION_RESULT_STAGE: Record<WorkflowOperation, WorkflowStage> = {
  extract: WorkflowStage.EXTRACTED,
  correct: WorkflowStage.CORRECTED,
  verify: WorkflowStage.VERIFIED,
  plan: WorkflowStage.PLANNED,
  report: WorkflowStage.PLANNED, // Report doesn't change the stage
};

// ─── Invalidation Rules ───
// When a stage is reached, downstream outputs at or after these stages become OUTDATED
export const INVALIDATION_DOWNSTREAM: Record<string, WorkflowStage[]> = {
  EXTRACTED: [WorkflowStage.CORRECTED, WorkflowStage.VERIFIED, WorkflowStage.PLANNED],
  CORRECTED: [WorkflowStage.VERIFIED, WorkflowStage.PLANNED],
  VERIFIED: [WorkflowStage.PLANNED],
  PLANNED: [],
};
