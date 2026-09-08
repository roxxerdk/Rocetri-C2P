import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { InspectionStage, QualityScope, RequirementType } from '../ontology/enums';

@Schema({ timestamps: true, collection: 'ont_quality_requirements' })
export class OntQualityRequirement {
  @Prop({ type: Types.ObjectId, ref: 'OntPart', required: true, index: true })
  partId: Types.ObjectId;

  @Prop({ type: String, enum: QualityScope, required: true })
  scope: QualityScope;

  @Prop({ type: String, enum: RequirementType, required: true })
  requirementType: RequirementType;

  @Prop({ type: Object, default: null })
  acceptanceCriteria: Record<string, any> | null;

  @Prop({ type: String, enum: InspectionStage, default: InspectionStage.FINAL_INSPECTION })
  inspectionStage: InspectionStage;

  @Prop({ type: String, default: 'EVERY_PART' })
  inspectionFrequency: string;

  @Prop({ type: String, default: 'MEDIUM' })
  failureSeverity: string;

  @Prop({ type: [Types.ObjectId], ref: 'OntMeasurementMethod', default: [] })
  verifiedByMethodIds: Types.ObjectId[];
}

export type OntQualityRequirementDocument = OntQualityRequirement & Document;
export const OntQualityRequirementSchema = SchemaFactory.createForClass(OntQualityRequirement);
OntQualityRequirementSchema.index({ partId: 1 });
