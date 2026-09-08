import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Report, ReportDocument } from './schemas/report.schema';
import { Context, ContextDocument } from '../engineering/schemas/context.schema';
import { ProcessPlan, ProcessPlanDocument } from '../planning/schemas/process-plan.schema';
import { GenerateReportDto } from './dto/generate-report.dto';
import { ContextType, DerivedStatus } from '../shared/enums';
import { ProjectsService } from '../projects/projects.service';
import { WorkflowService } from '../workflow/workflow.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
    @InjectModel(Context.name) private contextModel: Model<ContextDocument>,
    @InjectModel(ProcessPlan.name) private planModel: Model<ProcessPlanDocument>,
    private readonly projectsService: ProjectsService,
    private readonly workflowService: WorkflowService,
    private readonly aiService: AiService,
  ) {}

  async generateReport(projectId: string, dto: GenerateReportDto) {
    const project = await this.projectsService.findById(projectId);

    if (!project.currentContextRef || !project.currentProcessPlanRef) {
      throw new BadRequestException(
        'A verified context and a process plan are required before generating a report',
      );
    }

    let context = await this.contextModel.findOne({
      _id: project.currentContextRef,
      projectId: new Types.ObjectId(projectId),
    }).exec();

    if (!context) {
      context = await this.contextModel
        .findOne({ projectId: new Types.ObjectId(projectId) })
        .sort({ version: -1 })
        .exec();
    }

    const processPlan = await this.planModel.findOne({
      _id: project.currentProcessPlanRef,
      projectId: new Types.ObjectId(projectId),
    }).exec();

    if (!context || !processPlan) {
      throw new BadRequestException(
        'An extracted drawing context and a process plan are required before generating a report',
      );
    }

    const projectName = project.projectName;
    const reportResponse = await this.aiService.generate('claude', {
      systemPrompt: [
        'You are a senior manufacturing engineer preparing a professional engineering report.',
        'Use only the verified extracted drawing context and the validated process plan supplied below.',
        'Do not invent dimensions, tolerances, materials, operations, or inspection values.',
        'Return only valid JSON with this structure:',
        '{ "executiveSummary": "...", "partDefinition": { "partName": "...", "partNumber": "...", "material": "...", "drawingUnits": "..." }, "validatedInputs": [{ "item": "...", "value": "...", "source": "verified extraction" }], "processPlan": { "strategy": "...", "setups": [{ "sequence": 1, "purpose": "...", "machine": "...", "workholding": "...", "operations": [{ "sequence": 1, "name": "...", "processFamily": "...", "targetFeatures": [], "inspection": "...", "engineeringReason": "..." }] }], "heatTreatment": [], "qualityCheckpoints": [] }, "risksAndAssumptions": [], "releaseRecommendation": "..." }',
      ].join('\n'),
      prompt: JSON.stringify({
        project: { projectId, projectName },
        verifiedExtraction: context.contextData,
        validatedProcessPlan: processPlan.planData,
        options: dto.options || {},
      }),
      temperature: 0.1,
      maxTokens: 3500,
    });

    let cleanContent = (reportResponse.content || '').trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let reportData: Record<string, any>;
    try {
      reportData = JSON.parse(cleanContent);
    } catch (error) {
      throw new BadRequestException(`Report generation returned invalid document data: ${error.message}`);
    }

    const report = await this.reportModel.create({
      projectId: new Types.ObjectId(projectId),
      sourceContextId: context._id,
      sourceProcessPlanId: processPlan._id,
      status: DerivedStatus.VALID,
      reportData,
      metadata: {
        generatedAt: new Date().toISOString(),
        provider: 'claude',
        model: reportResponse.metadata?.model || 'configured Claude model',
        contextVersion: context.version,
        processPlanVersion: processPlan.version,
      },
    });

    await this.projectsService.update(projectId, {
      currentReportRef: report._id as Types.ObjectId,
    });

    return report;
  }

  async findByProject(projectId: string): Promise<ReportDocument[]> {
    return this.reportModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(projectId: string, reportId: string): Promise<ReportDocument> {
    const report = await this.reportModel
      .findOne({
        _id: new Types.ObjectId(reportId),
        projectId: new Types.ObjectId(projectId),
      })
      .exec();
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }
}
