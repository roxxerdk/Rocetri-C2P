export class ReportResponseDto {
  _id: string;
  projectId: string;
  sourceContextId: string;
  sourceProcessPlanId: string;
  status: string;
  reportData: Record<string, any>;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
