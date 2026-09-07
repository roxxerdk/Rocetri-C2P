export class ContextResponseDto {
  _id: string;
  projectId: string;
  contextType: string;
  version: number;
  parentContextId: string | null;
  contextData: Record<string, any>;
  status: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export class ConversationResponseDto {
  _id: string;
  projectId: string;
  type: string;
  contextReference: string | null;
  messages: Array<{ role: string; content: string; timestamp: string }>;
  createdAt: string;
  updatedAt: string;
}
