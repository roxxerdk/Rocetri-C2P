import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Report, ReportDocument } from './schemas/report.schema';
import { GenerateReportDto } from './dto/generate-report.dto';
import { JobType } from '../shared/enums';
import { ProjectsService } from '../projects/projects.service';
import { JobsService } from '../jobs/jobs.service';
import { WorkflowService } from '../workflow/workflow.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
    private readonly projectsService: ProjectsService,
    private readonly jobsService: JobsService,
    private readonly workflowService: WorkflowService,
  ) {}

  async generateReport(projectId: string, dto: GenerateReportDto) {
    const project = await this.projectsService.findById(projectId);

    if (!project.currentContextRef || !project.currentProcessPlanRef) {
      throw new BadRequestException(
        'A verified context and a process plan are required before generating a report',
      );
    }

    const job = await this.jobsService.createJob({
      projectId: new Types.ObjectId(projectId),
      type: JobType.REPORT_GENERATION,
    });

    // TODO: Dispatch to AI module for report generation
    return { jobId: job._id, message: 'Report generation job queued' };
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
