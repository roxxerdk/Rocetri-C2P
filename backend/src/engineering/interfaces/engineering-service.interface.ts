export interface IEngineeringService {
  startExtraction(projectId: string, dto: any): Promise<any>;
  submitCorrection(projectId: string, dto: any): Promise<any>;
  startVerification(projectId: string, dto: any): Promise<any>;
  getCurrentContext(projectId: string): Promise<any>;
  getContextHistory(projectId: string): Promise<any[]>;
  getConversations(projectId: string): Promise<any[]>;
  getConversation(projectId: string, conversationId: string): Promise<any>;
}
