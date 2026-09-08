import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DerivedStatus } from '../../shared/enums';

@Schema({ timestamps: true, collection: 'reports' })
export class Report {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Context', required: true })
  sourceContextId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ProcessPlan', required: true })
  sourceProcessPlanId: Types.ObjectId;

  @Prop({ type: String, enum: DerivedStatus, default: DerivedStatus.PROCESSING })
  status: DerivedStatus;

  @Prop({ type: Object, default: {} })
  reportData: Record<string, any>;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export type ReportDocument = Report & Document;
export const ReportSchema = SchemaFactory.createForClass(Report);

ReportSchema.index({ projectId: 1 });
