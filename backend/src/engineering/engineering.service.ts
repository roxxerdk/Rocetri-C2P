import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Context, ContextDocument } from './schemas/context.schema';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { StartExtractionDto } from './dto/start-extraction.dto';
import { SubmitCorrectionDto } from './dto/submit-correction.dto';
import { StartVerificationDto } from './dto/start-verification.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ContextType, ConversationType, DerivedStatus, JobType, WorkflowStage } from '../shared/enums';
import { ProjectsService } from '../projects/projects.service';
import { JobsService } from '../jobs/jobs.service';
import { WorkflowService } from '../workflow/workflow.service';

@Injectable()
export class EngineeringService {
  constructor(
    @InjectModel(Context.name) private contextModel: Model<ContextDocument>,
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    private readonly projectsService: ProjectsService,
    private readonly jobsService: JobsService,
    private readonly workflowService: WorkflowService,
  ) {}

  async validateProjectExists(projectId: string) {
    await this.projectsService.findById(projectId);
  }

  async startExtraction(projectId: string, dto: StartExtractionDto) {
    const project = await this.projectsService.findById(projectId);
    this.workflowService.validateTransition(project.primaryWorkflowStage, 'extract');

    // Create async job — actual AI extraction wired here later
    const job = await this.jobsService.createJob({
      projectId: new Types.ObjectId(projectId),
      type: JobType.EXTRACTION,
    });

    // TODO: Dispatch job to AI module for CAED extraction
    return { jobId: job._id, message: 'Extraction job queued' };
  }

  async submitCorrection(projectId: string, dto: SubmitCorrectionDto) {
    const project = await this.projectsService.findById(projectId);
    this.workflowService.validateTransition(project.primaryWorkflowStage, 'correct');

    const latestContext = await this.contextModel
      .findOne({
        projectId: new Types.ObjectId(projectId),
        status: DerivedStatus.VALID,
      })
      .sort({ createdAt: -1 })
      .exec();

    if (!latestContext) {
      throw new BadRequestException('No valid context found to apply corrections to');
    }

    const nextVersion = await this.getNextContextVersion(projectId, ContextType.USER_CORRECTED);

    const correctedContext = new this.contextModel({
      projectId: new Types.ObjectId(projectId),
      contextType: ContextType.USER_CORRECTED,
      version: nextVersion,
      parentContextId: latestContext._id,
      contextData: { ...latestContext.contextData, ...dto.corrections },
      status: DerivedStatus.VALID,
      metadata: { comment: dto.comment || '' },
    });
    await correctedContext.save();

    await this.projectsService.update(projectId, {
      currentContextRef: correctedContext._id as Types.ObjectId,
      primaryWorkflowStage: WorkflowStage.CORRECTED,
    });

    this.workflowService.invalidateDownstream(projectId, 'CORRECTED');
    return correctedContext;
  }

  async startVerification(projectId: string, dto: StartVerificationDto) {
    const project = await this.projectsService.findById(projectId);
    this.workflowService.validateTransition(project.primaryWorkflowStage, 'verify');

    const job = await this.jobsService.createJob({
      projectId: new Types.ObjectId(projectId),
      type: JobType.VERIFICATION,
    });

    // TODO: Dispatch job to AI module for engineering verification
    return { jobId: job._id, message: 'Verification job queued' };
  }

  async getCurrentContext(projectId: string) {
    const project = await this.projectsService.findById(projectId);
    if (!project.currentContextRef) return null;
    return this.contextModel.findById(project.currentContextRef).exec();
  }

  async getContextHistory(projectId: string) {
    return this.contextModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getConversations(projectId: string) {
    return this.conversationModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getConversation(projectId: string, conversationId: string) {
    const conv = await this.conversationModel
      .findOne({
        _id: new Types.ObjectId(conversationId),
        projectId: new Types.ObjectId(projectId),
      })
      .exec();
    if (!conv) throw new NotFoundException('Conversation not found');
    return conv;
  }

  async sendMessage(projectId: string, dto: SendMessageDto) {
    await this.projectsService.findById(projectId);

    let conversation = await this.conversationModel
      .findOne({ projectId: new Types.ObjectId(projectId), type: dto.type })
      .sort({ createdAt: -1 })
      .exec();

    if (!conversation) {
      conversation = new this.conversationModel({
        projectId: new Types.ObjectId(projectId),
        type: dto.type,
        messages: [],
      });
    }

    conversation.messages.push({ role: 'user', content: dto.message, timestamp: new Date() });
    conversation.messages.push({
      role: 'assistant',
      content: `${dto.type} chatbot is not yet implemented. Your message was: ${dto.message}`,
      timestamp: new Date(),
    });

    await conversation.save();
    return conversation;
  }

  private async getNextContextVersion(
    projectId: string,
    contextType: ContextType,
  ): Promise<number> {
    const latest = await this.contextModel
      .findOne({ projectId: new Types.ObjectId(projectId), contextType })
      .sort({ version: -1 })
      .exec();
    return latest ? latest.version + 1 : 1;
  }
}
