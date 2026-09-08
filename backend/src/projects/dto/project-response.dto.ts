export class ProjectResponseDto {
  _id: string;
  projectName: string;
  metadata: Record<string, any>;
  primaryWorkflowStage: string;
  currentStatuses: Record<string, string>;
  currentContextRef: string | null;
  currentProcessPlanRef: string | null;
  currentReportRef: string | null;
  createdAt: string;
  updatedAt: string;
}
