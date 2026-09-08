import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { HeatTreatmentType } from '../ontology/enums';

@Schema({ timestamps: true, collection: 'ont_heat_treatments' })
export class OntHeatTreatment {
  @Prop({ type: String, enum: HeatTreatmentType, required: true })
  heatTreatmentType: HeatTreatmentType;

  @Prop({ type: [String], default: [] })
  compatibleMaterialFamilies: string[]; // MaterialFamily values

  @Prop({ type: Types.ObjectId, ref: 'OntMaterialState', default: null })
  inputMaterialStateId: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'OntMaterialState', default: null })
  outputMaterialStateId: Types.ObjectId | null;

  // Effects
  @Prop({ type: Object, default: null })
  expectedHardnessChange: { delta: number; unit: string; direction: 'INCREASE' | 'DECREASE' } | null;

  @Prop({ type: String, default: 'UNKNOWN' })
  expectedDistortionRisk: string; // LOW | MEDIUM | HIGH | UNKNOWN

  @Prop({ type: String, default: 'UNKNOWN' })
  scaleRisk: string;

  @Prop({ type: [String], default: [] })
  postTreatmentRequirements: string[];

  // Effect descriptors (machine-readable, not NL description)
  @Prop({ type: Boolean, default: false })
  affectsDimension: boolean;

  @Prop({ type: Boolean, default: false })
  affectsDistortion: boolean;

  @Prop({ type: Boolean, default: false })
  affectsHardness: boolean;

  @Prop({ type: Boolean, default: false })
  affectsSurfaceCondition: boolean;

  @Prop({ type: Boolean, default: false })
  affectsMachinability: boolean;
}

export type OntHeatTreatmentDocument = OntHeatTreatment & Document;
export const OntHeatTreatmentSchema = SchemaFactory.createForClass(OntHeatTreatment);
