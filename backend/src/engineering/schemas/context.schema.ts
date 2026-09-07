import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ContextType, DerivedStatus } from '../../shared/enums';

@Schema({ timestamps: true, collection: 'contexts' })
export class Context {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: Types.ObjectId;

  @Prop({ type: String, enum: ContextType, required: true })
  contextType: ContextType;

  @Prop({ type: Number, required: true, default: 1 })
  version: number;

  @Prop({ type: Types.ObjectId, ref: 'Context', default: null })
  parentContextId: Types.ObjectId;

  // Placeholder for engineering context data — structure defined later
  @Prop({ type: Object, default: {} })
  contextData: Record<string, any>;

  @Prop({ type: String, enum: DerivedStatus, default: DerivedStatus.PROCESSING })
  status: DerivedStatus;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export type ContextDocument = Context & Document;
export const ContextSchema = SchemaFactory.createForClass(Context);

// Compound index for version lookups
ContextSchema.index({ projectId: 1, contextType: 1, version: 1 }, { unique: true });
