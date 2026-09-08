import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OperationStatus, ProcessFamily, ProcessRiskLevel, ProcessStage } from '../ontology/enums';

@Schema({ timestamps: true, collection: 'ont_operations' })
export class OntOperation {
  @Prop({ type: Types.ObjectId, ref: 'OntPart', required: true, index: true })
  partId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'OntSetup', required: true, index: true })
  setupId: Types.ObjectId;

  @Prop({ type: String, enum: ProcessFamily, required: true })
  processFamily: ProcessFamily;

  @Prop({ type: String, enum: ProcessStage, required: true })
  processStage: ProcessStage;

  @Prop({ type: String, required: true })
  operationName: string;

  @Prop({ type: Types.ObjectId, ref: 'OntManufacturingState', default: null })
  inputManufacturingStateId: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'OntManufacturingState', default: null })
  outputManufacturingStateId: Types.ObjectId | null;

  @Prop({ type: [Types.ObjectId], ref: 'OntManufacturingFeature', default: [] })
  targetFeatureIds: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'OntManufacturingFeature', default: [] })
  createdFeatureIds: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'OntManufacturingFeature', default: [] })
  modifiedFeatureIds: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'OntDatum', default: [] })
  datumIdsUsed: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'OntDatum', default: [] })
  datumIdsCreated: Types.ObjectId[];

  @Prop({ type: Object, default: {} })
  machineCapabilityRequirements: Record<string, any>;

  @Prop({ type: Object, default: {} })
  workholdingRequirements: Record<string, any>;

  @Prop({ type: Object, default: {} })
  toolRequirements: Record<string, any>;

  @Prop({ type: Object, default: {} })
  measurementRequirements: Record<string, any>;

  @Prop({ type: String, enum: ProcessRiskLevel, default: ProcessRiskLevel.LOW })
  processRiskLevel: ProcessRiskLevel;

  @Prop({ type: String, enum: OperationStatus, default: OperationStatus.DRAFT })
  status: OperationStatus;

  @Prop({ type: Number, default: null })
  sequenceOrder: number | null;
}

export type OntOperationDocument = OntOperation & Document;
export const OntOperationSchema = SchemaFactory.createForClass(OntOperation);
OntOperationSchema.index({ partId: 1, setupId: 1 });
OntOperationSchema.index({ setupId: 1, sequenceOrder: 1 });
