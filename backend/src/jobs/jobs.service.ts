import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Job, JobDocument } from './schemas/job.schema';
import { JobStatus, JobType } from '../shared/enums';

export interface CreateJobInput {
  projectId: Types.ObjectId;
  type: JobType;
}

@Injectable()
export class JobsService {
  constructor(
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
  ) {}

  async createJob(input: CreateJobInput): Promise<JobDocument> {
    const job = new this.jobModel({
      projectId: input.projectId,
      type: input.type,
      status: JobStatus.PENDING,
      progress: 0,
    });
    return job.save();
  }

  async findById(jobId: string): Promise<JobDocument> {
    const job = await this.jobModel.findById(jobId).exec();
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);
    return job;
  }

  async updateStatus(
    jobId: string,
    status: JobStatus,
    extra?: { progress?: number; resultReference?: Types.ObjectId; error?: any; completedAt?: Date },
  ): Promise<JobDocument> {
    const update: any = { status, ...extra };
    const job = await this.jobModel
      .findByIdAndUpdate(jobId, { $set: update }, { new: true })
      .exec();
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);
    return job;
  }

  async findByProject(projectId: string): Promise<JobDocument[]> {
    return this.jobModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .sort({ createdAt: -1 })
      .exec();
  }
}
