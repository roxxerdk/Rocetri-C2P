export class ProcessPlanResponseDto {
  _id: string;
  projectId: string;
  sourceVerifiedContextId: string;
  version: number;
  parentPlanId: string | null;
  planData: Record<string, any>;
  status: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
