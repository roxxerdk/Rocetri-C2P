import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DependencyType } from '../ontology/enums';

@Schema({ timestamps: true, collection: 'ont_operation_dependencies' })
export class OntOperationDependency {
  @Prop({ type: Types.ObjectId, ref: 'OntOperation', required: true, index: true })
  sourceOperationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'OntOperation', required: true, index: true })
  targetOperationId: Types.ObjectId;

  @Prop({ type: String, enum: DependencyType, required: true })
  dependencyType: DependencyType;

  @Prop({ type: String, default: null })
  reason: string | null;
}

export type OntOperationDependencyDocument = OntOperationDependency & Document;
export const OntOperationDependencySchema = SchemaFactory.createForClass(OntOperationDependency);
OntOperationDependencySchema.index({ sourceOperationId: 1, targetOperationId: 1 });
