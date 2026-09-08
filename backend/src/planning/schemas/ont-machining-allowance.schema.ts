import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AllowanceType } from '../ontology/enums';

@Schema({ timestamps: true, collection: 'ont_machining_allowances' })
export class OntMachiningAllowance {
  @Prop({ type: Types.ObjectId, ref: 'OntManufacturingFeature', required: true, index: true })
  featureId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'OntManufacturingState', required: true })
  manufacturingStateId: Types.ObjectId;

  @Prop({ type: String, enum: AllowanceType, required: true })
  allowanceType: AllowanceType;

  @Prop({ type: String, default: null })
  direction: string | null;

  @Prop({ type: Object, required: true })
  nominalRemainingStock: { value: number; unit: string };

  @Prop({ type: String, default: null })
  intendedNextProcess: string | null;

  @Prop({ type: String, default: null })
  reason: string | null;
}

export type OntMachiningAllowanceDocument = OntMachiningAllowance & Document;
export const OntMachiningAllowanceSchema = SchemaFactory.createForClass(OntMachiningAllowance);
OntMachiningAllowanceSchema.index({ featureId: 1, manufacturingStateId: 1 });
