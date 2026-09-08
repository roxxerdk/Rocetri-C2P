import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CriticalityLevel, RequirementType } from '../ontology/enums';

@Schema({ timestamps: true, collection: 'ont_feature_requirements' })
export class OntFeatureRequirement {
  @Prop({ type: Types.ObjectId, ref: 'OntManufacturingFeature', required: true, index: true })
  featureId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'OntPart', required: true, index: true })
  partId: Types.ObjectId;

  @Prop({ type: String, enum: RequirementType, required: true })
  requirementType: RequirementType;

  @Prop({ type: Object, default: null })
  nominalValue: { value: number; unit: string } | null;

  @Prop({ type: Object, default: null })
  lowerLimit: { value: number; unit: string } | null;

  @Prop({ type: Object, default: null })
  upperLimit: { value: number; unit: string } | null;

  @Prop({ type: String, default: null })
  toleranceClass: string | null; // e.g. h6, H7, IT6

  @Prop({ type: String, enum: CriticalityLevel, default: CriticalityLevel.MEDIUM })
  criticality: CriticalityLevel;

  @Prop({ type: String, default: null })
  functionalReason: string | null;

  // Verification link
  @Prop({ type: [Types.ObjectId], ref: 'OntMeasurementMethod', default: [] })
  verifiedByMethodIds: Types.ObjectId[];
}

export type OntFeatureRequirementDocument = OntFeatureRequirement & Document;
export const OntFeatureRequirementSchema = SchemaFactory.createForClass(OntFeatureRequirement);
OntFeatureRequirementSchema.index({ featureId: 1, partId: 1 });
