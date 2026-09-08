import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProcessPlan, ProcessPlanDocument } from './schemas/process-plan.schema';
import { Context, ContextDocument } from '../engineering/schemas/context.schema';
import { Conversation, ConversationDocument } from '../engineering/schemas/conversation.schema';
import { GeneratePlanDto } from './dto/generate-plan.dto';
import { ModifyPlanDto } from './dto/modify-plan.dto';
import { ChatMessageDto } from './dto/chat-message.dto';
import { DerivedStatus, JobType } from '../shared/enums';
import { ProjectsService } from '../projects/projects.service';
import { JobsService } from '../jobs/jobs.service';
import { WorkflowService } from '../workflow/workflow.service';
import { AiService } from '../ai/ai.service';

import { DemoPlanningService } from './demo/demo-planning.service';

@Injectable()
export class PlanningService {
  constructor(
    @InjectModel(ProcessPlan.name) private planModel: Model<ProcessPlanDocument>,
    @InjectModel(Context.name) private contextModel: Model<ContextDocument>,
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    private readonly projectsService: ProjectsService,
    private readonly jobsService: JobsService,
    private readonly workflowService: WorkflowService,
    private readonly demoPlanningService: DemoPlanningService,
    private readonly aiService: AiService,
  ) {}

  async generatePlan(projectId: string, dto?: GeneratePlanDto) {
    const project = await this.projectsService.findById(projectId);
    try {
      this.workflowService.validateTransition(project.primaryWorkflowStage, 'plan');
    } catch (e) {
      // allow regeneration even if already in PLANNED stage
    }

    return this.demoPlanningService.generatePlanFromProjectContext(projectId);
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
    const project = await this.projectsService.findById(projectId);
    const context = project.currentContextRef
      ? await this.contextModel.findById(project.currentContextRef).exec()
      : await this.contextModel
        .findOne({ projectId: new Types.ObjectId(projectId) })
        .sort({ createdAt: -1 })
        .exec();
    const currentPlan = project.currentProcessPlanRef
      ? await this.planModel.findById(project.currentProcessPlanRef).exec()
      : null;

    let conversation = await this.conversationModel
      .findOne({ projectId: new Types.ObjectId(projectId), type: 'PLANNING' })
      .sort({ createdAt: -1 })
      .exec();

    if (!conversation) {
      conversation = new this.conversationModel({
        projectId: new Types.ObjectId(projectId),
        type: 'PLANNING',
        messages: [],
      });
    }

    conversation.messages.push({ role: 'user', content: dto.message, timestamp: new Date() });
    const history = conversation.messages.slice(-14).map((message) => ({
      role: message.role,
      content: message.content,
    }));
    const contextData = context?.contextData || null;
    const planData = currentPlan?.planData || null;

    const response = await this.aiService.generate('claude', {
      systemPrompt: [
        'You are the C2P process planning assistant for manufacturing engineers.',
        'Use the extracted CAED context and current process plan below as the source of truth.',
        'Answer questions about setups, operations, tooling, inspection, risks, and planning assumptions.',
        'When the user requests a change, explain the requested change clearly; do not claim it was persisted unless a plan modification endpoint is used.',
        'Be concise, technical, and do not invent drawing values.',
        `EXTRACTED CAED CONTEXT:\n${JSON.stringify(contextData)}`,
        `CURRENT PROCESS PLAN:\n${JSON.stringify(planData)}`,
      ].join('\n\n'),
      prompt: JSON.stringify({ conversationHistory: history, userMessage: dto.message }),
      temperature: 0.2,
      maxTokens: 900,
    });

    conversation.messages.push({ role: 'assistant', content: response.content, timestamp: new Date() });
    await conversation.save();
    return conversation;
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
