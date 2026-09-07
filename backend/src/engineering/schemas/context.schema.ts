import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ContextType, DerivedStatus } from '../../shared/enums';
import { EngineeringContextData } from '../interfaces/engineering-context.types';

@Schema({ timestamps: true, collection: 'contexts' })
export class Context {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: Types.ObjectId;

  // Lifecycle stage: EXTRACTED | USER_CORRECTED | VERIFIED
  @Prop({ type: String, enum: ContextType, required: true })
  contextType: ContextType;

  @Prop({ type: Number, required: true, default: 1 })
  version: number;

  // Reference to the context this was derived from (for lineage tracking)
  @Prop({ type: Types.ObjectId, ref: 'Context', default: null })
  parentContextId: Types.ObjectId | null;

  // The unified engineering context data — same structure across all lifecycle stages.
  // Stored as a flexible Mixed type in Mongo so sub-structure can evolve without migrations.
  @Prop({ type: Object, default: {} })
  contextData: EngineeringContextData;

  @Prop({ type: String, enum: DerivedStatus, default: DerivedStatus.PROCESSING })
  status: DerivedStatus;

  // Optional free-form metadata (e.g. correction comment, validation timestamp)
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export type ContextDocument = Context & Document;
export const ContextSchema = SchemaFactory.createForClass(Context);

// Compound index: one context per (project, type, version)
ContextSchema.index({ projectId: 1, contextType: 1, version: 1 }, { unique: true });
// Quick lookup of latest context by type
ContextSchema.index({ projectId: 1, contextType: 1 });
