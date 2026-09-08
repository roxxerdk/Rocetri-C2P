import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { WorkflowStage, DerivedStatus } from '../../shared/enums';

export class CurrentStatuses {
  extraction?: DerivedStatus;
  verification?: DerivedStatus;
  planning?: DerivedStatus;
  report?: DerivedStatus;
}

@Schema({ timestamps: true, collection: 'projects' })
export class Project {
  @Prop({ required: true, trim: true })
  projectName: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ type: String, enum: WorkflowStage, default: WorkflowStage.UPLOADED })
  primaryWorkflowStage: WorkflowStage;

  @Prop({ type: Object, default: {} })
  currentStatuses: CurrentStatuses;

  @Prop({ type: Types.ObjectId, ref: 'Context', default: null })
  currentContextRef: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ProcessPlan', default: null })
  currentProcessPlanRef: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Report', default: null })
  currentReportRef: Types.ObjectId;
}

export type ProjectDocument = Project & Document;
export const ProjectSchema = SchemaFactory.createForClass(Project);
