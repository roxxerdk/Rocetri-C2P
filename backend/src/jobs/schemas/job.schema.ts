import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { JobType, JobStatus } from '../../shared/enums';

@Schema({ timestamps: true, collection: 'jobs' })
export class Job {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: Types.ObjectId;

  @Prop({ type: String, enum: JobType, required: true })
  type: JobType;

  @Prop({ type: String, enum: JobStatus, default: JobStatus.PENDING })
  status: JobStatus;

  @Prop({ type: Number, default: 0 })
  progress: number;

  @Prop({ type: Types.ObjectId, default: null })
  resultReference: Types.ObjectId;

  @Prop({ type: Object, default: null })
  error: { message: string; code?: string; details?: any } | null;

  @Prop({ type: Date, default: null })
  completedAt: Date;
}

export type JobDocument = Job & Document;
export const JobSchema = SchemaFactory.createForClass(Job);

JobSchema.index({ projectId: 1, status: 1 });
