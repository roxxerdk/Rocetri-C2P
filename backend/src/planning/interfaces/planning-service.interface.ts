export interface IPlanningService {
  generatePlan(projectId: string, dto: any): Promise<any>;
  modifyPlan(projectId: string, dto: any): Promise<any>;
  chat(projectId: string, dto: any): Promise<any>;
  getCurrentPlan(projectId: string): Promise<any>;
  getPlanHistory(projectId: string): Promise<any[]>;
}
