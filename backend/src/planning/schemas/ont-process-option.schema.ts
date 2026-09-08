import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { FeasibilityStatus, ProcessFamily, SelectionStatus } from '../ontology/enums';

@Schema({ timestamps: true, collection: 'ont_process_options' })
export class OntProcessOption {
  @Prop({ type: Types.ObjectId, ref: 'OntPart', required: true, index: true })
  partId: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'OntManufacturingFeature', default: [] })
  targetFeatureIds: Types.ObjectId[];

  @Prop({ type: String, enum: ProcessFamily, required: true })
  candidateOperationType: ProcessFamily;

  @Prop({ type: String, default: null })
  candidateMachineRequirement: string | null;

  @Prop({ type: String, default: null })
  candidateToolRequirement: string | null;

  @Prop({ type: String, default: null })
  candidateWorkholdingRequirement: string | null;

  @Prop({ type: String, enum: FeasibilityStatus, default: FeasibilityStatus.UNKNOWN })
  feasibilityStatus: FeasibilityStatus;

  @Prop({ type: String, enum: SelectionStatus, default: SelectionStatus.CANDIDATE })
  selectionStatus: SelectionStatus;

  @Prop({ type: String, default: null })
  rejectionReason: string | null;
}

export type OntProcessOptionDocument = OntProcessOption & Document;
export const OntProcessOptionSchema = SchemaFactory.createForClass(OntProcessOption);
OntProcessOptionSchema.index({ partId: 1 });
