import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Context, ContextDocument } from './schemas/context.schema';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { StartExtractionDto } from './dto/start-extraction.dto';
import { SubmitCorrectionDto } from './dto/submit-correction.dto';
import { CreateExtractedContextDto } from './dto/create-extracted-context.dto';
import { SendMessageDto } from './dto/send-message.dto';
import {
  ContextType,
  DerivedStatus,
  JobStatus,
  JobType,
  WorkflowStage,
} from '../shared/enums';
import { ProjectsService } from '../projects/projects.service';
import { JobsService } from '../jobs/jobs.service';
import { WorkflowService } from '../workflow/workflow.service';
import { ContextValidationService } from './services/context-validation.service';
import { GeminiExtractionService } from './extraction/gemini-extraction.service';
import { GeminiProvider } from '../ai/providers/gemini.provider';
import { emptyEngineeringContextData, EngineeringContextData } from './interfaces/engineering-context.types';

@Injectable()
export class EngineeringService {
  constructor(
    @InjectModel(Context.name) private contextModel: Model<ContextDocument>,
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    private readonly projectsService: ProjectsService,
    private readonly jobsService: JobsService,
    private readonly workflowService: WorkflowService,
    private readonly contextValidationService: ContextValidationService,
    private readonly geminiExtractionService: GeminiExtractionService,
    private readonly geminiProvider: GeminiProvider,
  ) {}

  // ── Utility ─────────────────────────────────────────────────────────────────

  async validateProjectExists(projectId: string) {
    await this.projectsService.findById(projectId);
  }

  // ── Extraction ───────────────────────────────────────────────────────────────

  /**
   * Full extraction from uploaded files.
   * All files are treated as ONE product — one Gemini call, one EXTRACTED context.
   */
  async extractFromFiles(
    projectId: string,
    files: Express.Multer.File[],
  ): Promise<ContextDocument> {
    await this.projectsService.findById(projectId);

    const { contextData } = await this.geminiExtractionService.extractFromFiles(files);
    return this.storeExtractedContext(projectId, { contextData });
  }

  /**
   * Queue-based extraction (for async job pattern — used when files are pre-uploaded).
   * Returns a jobId the frontend can poll. Actual extraction runs async.
   * For hackathon: this queues the job but does not auto-run it.
   * Use extractFromFiles for synchronous extraction with file upload.
   */
  async startExtraction(projectId: string, dto: StartExtractionDto) {
    await this.projectsService.findById(projectId);

    const job = await this.jobsService.createJob({
      projectId: new Types.ObjectId(projectId),
      type: JobType.EXTRACTION,
      metadata: { fileReference: dto.caedFileReference },
    });

    return { jobId: job._id, message: 'Extraction job queued' };
  }

  /**
   * Called by the extraction pipeline (Gemini) once extraction is done.
   * Creates a new EXTRACTED context document — never overwrites previous ones.
   */
  async storeExtractedContext(
    projectId: string,
    dto: CreateExtractedContextDto,
  ): Promise<ContextDocument> {
    await this.projectsService.findById(projectId);

    const nextVersion = await this.getNextContextVersion(projectId, ContextType.EXTRACTED);

    const context = new this.contextModel({
      projectId: new Types.ObjectId(projectId),
      contextType: ContextType.EXTRACTED,
      version: nextVersion,
      parentContextId: null,
      contextData: dto.contextData ?? emptyEngineeringContextData(),
      status: DerivedStatus.VALID,
      metadata: dto.metadata ?? {},
    });
    await context.save();

    await this.projectsService.update(projectId, {
      currentContextRef: context._id as Types.ObjectId,
      primaryWorkflowStage: WorkflowStage.EXTRACTED,
    });

    return context;
  }

  // ── User Correction ──────────────────────────────────────────────────────────

  /**
   * User submits partial corrections to the current context.
   * Creates a new USER_CORRECTED document — the EXTRACTED document is preserved unchanged.
   * Corrections are section-level merged (e.g. material, drawing) — not field-by-field.
   */
  async submitCorrection(
    projectId: string,
    dto: SubmitCorrectionDto,
  ): Promise<ContextDocument> {
    await this.projectsService.findById(projectId);

    // Source: latest VALID context (EXTRACTED or a previous USER_CORRECTED)
    const sourceContext = await this.getLatestValidContext(projectId);
    if (!sourceContext) {
      throw new BadRequestException(
        'No valid context found to apply corrections to. Run extraction first.',
      );
    }

    if (sourceContext.contextType === ContextType.VERIFIED) {
      throw new ConflictException(
        'Cannot correct a VERIFIED context. Run extraction again to start a new version.',
      );
    }

    // Deep-merge corrections onto the source contextData (section-level)
    const mergedData = this.mergeContextData(
      sourceContext.contextData as EngineeringContextData,
      dto.corrections,
    );

    const nextVersion = await this.getNextContextVersion(projectId, ContextType.USER_CORRECTED);

    const correctedContext = new this.contextModel({
      projectId: new Types.ObjectId(projectId),
      contextType: ContextType.USER_CORRECTED,
      version: nextVersion,
      parentContextId: sourceContext._id,
      contextData: mergedData,
      status: DerivedStatus.VALID,
      metadata: { comment: dto.comment ?? '' },
    });
    await correctedContext.save();

    await this.projectsService.update(projectId, {
      currentContextRef: correctedContext._id as Types.ObjectId,
      primaryWorkflowStage: WorkflowStage.CORRECTED,
    });

    this.workflowService.invalidateDownstream(projectId, 'CORRECTED');
    return correctedContext;
  }

  // ── Verification ─────────────────────────────────────────────────────────────

  /**
   * Validates the current context and, if READY, promotes it to VERIFIED IN-PLACE.
   *
   * Spec: "Change the stage of the SAME context version to VERIFIED.
   *        Do not create another duplicate context version."
   *
   * - If NOT_READY: returns validation result, context unchanged.
   * - If READY: updates contextType on the existing document → VERIFIED.
   *             Updates project.primaryWorkflowStage → VERIFIED.
   */
  async verifyContext(projectId: string) {
    await this.projectsService.findById(projectId);

    const sourceContext = await this.getLatestValidContext(projectId);
    if (!sourceContext) {
      throw new BadRequestException(
        'No context available to verify. Run extraction first.',
      );
    }

    if (sourceContext.contextType === ContextType.VERIFIED) {
      throw new ConflictException('Current context is already VERIFIED.');
    }

    const contextData = sourceContext.contextData as EngineeringContextData;
    const validationResult = this.contextValidationService.validate(contextData);

    if (validationResult.status === 'NOT_READY') {
      // Return result — leave context unchanged
      return {
        verified: false,
        validation: validationResult,
        context: sourceContext,
      };
    }

    // READY — promote the SAME document to VERIFIED (in-place update)
    await this.contextModel.updateOne(
      { _id: sourceContext._id },
      {
        $set: {
          contextType: ContextType.VERIFIED,
          'metadata.verifiedAt': new Date().toISOString(),
          'metadata.validationWarnings': validationResult.warnings,
        },
      },
    );

    await this.projectsService.update(projectId, {
      primaryWorkflowStage: WorkflowStage.VERIFIED,
    });

    const verifiedContext = await this.contextModel.findById(sourceContext._id).exec();

    return {
      verified: true,
      validation: validationResult,
      context: verifiedContext,
    };
  }

  /**
   * Validates the current context without creating any documents.
   * Useful for the frontend to show the user what is missing before they confirm.
   */
  async previewValidation(projectId: string) {
    await this.projectsService.findById(projectId);

    const sourceContext = await this.getLatestValidContext(projectId);
    if (!sourceContext) {
      throw new BadRequestException('No context available. Run extraction first.');
    }

    const contextData = sourceContext.contextData as EngineeringContextData;
    return {
      sourceContextType: sourceContext.contextType,
      sourceContextId: sourceContext._id,
      validation: this.contextValidationService.validate(contextData),
    };
  }

  // ── Context Retrieval ────────────────────────────────────────────────────────

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

  // ── Conversations ────────────────────────────────────────────────────────────

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

    const context = await this.getLatestValidContext(projectId);

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

    const history = conversation.messages.slice(-12).map(message => ({
      role: message.role,
      content: message.content,
    }));
    const response = await this.geminiProvider.generate({
      systemPrompt: [
        'You are the C2P engineering assistant.',
        `You are assisting with the ${dto.type.toLowerCase()} workflow.`,
        'Answer using only the persisted engineering context below and the conversation history.',
        'Never invent dimensions, materials, tolerances, confidence values, or process data.',
        'If the context does not contain an answer, say that it is not available.',
        'Do not claim to persist a change. For changes, instruct the user to edit the extracted value and use the existing confirmation action.',
        `Persisted engineering context: ${JSON.stringify(context?.contextData ?? null)}`,
      ].join('\n'),
      prompt: JSON.stringify({ history, message: dto.message }),
      temperature: 0.2,
      maxTokens: 800,
    });
    conversation.messages.push({
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
    });

    await conversation.save();
    return conversation;
  }

  // ── Private Helpers ──────────────────────────────────────────────────────────

  /**
   * Gets the latest VALID context for a project, preferring USER_CORRECTED > EXTRACTED.
   * Does NOT return VERIFIED contexts as a correction source.
   */
  private async getLatestValidContext(projectId: string): Promise<ContextDocument | null> {
    return this.contextModel
      .findOne({
        projectId: new Types.ObjectId(projectId),
        status: DerivedStatus.VALID,
        contextType: { $in: [ContextType.EXTRACTED, ContextType.USER_CORRECTED, ContextType.VERIFIED] },
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Section-level deep merge: corrections override top-level sections of contextData.
   * Arrays within sections (e.g. features, overallDimensions) are fully replaced by the correction.
   */
  private mergeContextData(
    base: EngineeringContextData,
    corrections: Partial<Record<string, any>>,
  ): EngineeringContextData {
    const merged = { ...base };
    for (const section of Object.keys(corrections)) {
      if (corrections[section] !== undefined && typeof corrections[section] === 'object' && !Array.isArray(corrections[section])) {
        merged[section] = { ...(base[section] ?? {}), ...corrections[section] };
      } else {
        merged[section] = corrections[section];
      }
    }
    return merged;
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
