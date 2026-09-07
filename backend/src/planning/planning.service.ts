import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProcessPlan, ProcessPlanDocument } from './schemas/process-plan.schema';
import { GeneratePlanDto } from './dto/generate-plan.dto';
import { ModifyPlanDto } from './dto/modify-plan.dto';
import { ChatMessageDto } from './dto/chat-message.dto';
import { DerivedStatus, JobType } from '../shared/enums';
import { ProjectsService } from '../projects/projects.service';
import { JobsService } from '../jobs/jobs.service';
import { WorkflowService } from '../workflow/workflow.service';

@Injectable()
export class PlanningService {
  constructor(
    @InjectModel(ProcessPlan.name) private planModel: Model<ProcessPlanDocument>,
    private readonly projectsService: ProjectsService,
    private readonly jobsService: JobsService,
    private readonly workflowService: WorkflowService,
  ) {}

  async generatePlan(projectId: string, dto: GeneratePlanDto) {
    const project = await this.projectsService.findById(projectId);
    this.workflowService.validateTransition(project.primaryWorkflowStage, 'plan');

    const job = await this.jobsService.createJob({
      projectId: new Types.ObjectId(projectId),
      type: JobType.PROCESS_PLANNING,
    });

    // TODO: Kick off actual plan generation via AI module
    return { jobId: job._id, message: 'Plan generation started' };
  }

  async modifyPlan(projectId: string, dto: ModifyPlanDto) {
    const project = await this.projectsService.findById(projectId);
    if (!project.currentProcessPlanRef) {
      throw new BadRequestException('No current process plan to modify');
    }

    const currentPlan = await this.planModel.findById(project.currentProcessPlanRef).exec();
    if (!currentPlan) throw new NotFoundException('Current plan not found');

    // Create new version
    const nextVersion = await this.getNextVersion(projectId);
    const modified = new this.planModel({
      projectId: new Types.ObjectId(projectId),
      sourceVerifiedContextId: currentPlan.sourceVerifiedContextId,
      version: nextVersion,
      parentPlanId: currentPlan._id,
      planData: { ...currentPlan.planData, ...dto.modifications },
      status: DerivedStatus.VALID,
    });
    await modified.save();

    await this.projectsService.update(projectId, {
      currentProcessPlanRef: modified._id as Types.ObjectId,
    });

    return modified;
  }

  async chat(projectId: string, dto: ChatMessageDto) {
    // TODO: Implement planning chatbot via AI module
    return {
      reply: 'Planning chatbot is not yet implemented. Your message was: ' + dto.message,
    };
  }

  async getCurrentPlan(projectId: string) {
    const project = await this.projectsService.findById(projectId);
    if (!project.currentProcessPlanRef) return null;
    return this.planModel.findById(project.currentProcessPlanRef).exec();
  }

  async getPlanHistory(projectId: string) {
    return this.planModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  private async getNextVersion(projectId: string): Promise<number> {
    const latest = await this.planModel
      .findOne({ projectId: new Types.ObjectId(projectId) })
      .sort({ version: -1 })
      .exec();
    return latest ? latest.version + 1 : 1;
  }
}
