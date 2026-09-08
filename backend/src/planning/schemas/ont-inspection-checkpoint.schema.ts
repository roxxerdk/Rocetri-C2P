import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { FailureAction, InspectionStage } from '../ontology/enums';

@Schema({ timestamps: true, collection: 'ont_inspection_checkpoints' })
export class OntInspectionCheckpoint {
  @Prop({ type: Types.ObjectId, ref: 'OntPart', required: true, index: true })
  partId: Types.ObjectId;

  @Prop({ type: String, enum: InspectionStage, required: true })
  triggerStage: InspectionStage;

  @Prop({ type: Types.ObjectId, ref: 'OntOperation', default: null })
  triggerOperationId: Types.ObjectId | null;

  @Prop({ type: [Types.ObjectId], ref: 'OntManufacturingFeature', default: [] })
  targetFeatureIds: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'OntFeatureRequirement', default: [] })
  requirementIds: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'OntMeasurementMethod', default: [] })
  measurementMethodIds: Types.ObjectId[];

  @Prop({ type: Object, default: null })
  acceptanceCriteria: Record<string, any> | null;

  @Prop({ type: String, enum: FailureAction, default: FailureAction.HOLD })
  failureAction: FailureAction;

  @Prop({ type: String, default: 'UNKNOWN' })
  outputQualityStatus: string;
}

export type OntInspectionCheckpointDocument = OntInspectionCheckpoint & Document;
export const OntInspectionCheckpointSchema = SchemaFactory.createForClass(OntInspectionCheckpoint);
OntInspectionCheckpointSchema.index({ partId: 1 });
