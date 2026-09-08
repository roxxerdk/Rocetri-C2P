export class JobResponseDto {
  _id: string;
  projectId: string;
  type: string;
  status: string;
  progress: number;
  resultReference: string | null;
  error: { message: string; code?: string; details?: any } | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}
