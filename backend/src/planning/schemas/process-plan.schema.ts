import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DerivedStatus } from '../../shared/enums';

@Schema({ timestamps: true, collection: 'processPlans' })
export class ProcessPlan {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Context', required: true })
  sourceVerifiedContextId: Types.ObjectId;

  @Prop({ type: Number, required: true, default: 1 })
  version: number;

  @Prop({ type: Types.ObjectId, ref: 'ProcessPlan', default: null })
  parentPlanId: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  planData: Record<string, any>;

  @Prop({ type: String, enum: DerivedStatus, default: DerivedStatus.PROCESSING })
  status: DerivedStatus;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export type ProcessPlanDocument = ProcessPlan & Document;
export const ProcessPlanSchema = SchemaFactory.createForClass(ProcessPlan);

ProcessPlanSchema.index({ projectId: 1 });
ProcessPlanSchema.index({ sourceVerifiedContextId: 1 });
