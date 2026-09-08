import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CriticalityLevel, FunctionalRole, GeometryType } from '../ontology/enums';

@Schema({ timestamps: true, collection: 'ont_features' })
export class OntManufacturingFeature {
  @Prop({ type: Types.ObjectId, ref: 'OntPart', required: true, index: true })
  partId: Types.ObjectId;

  @Prop({ type: String, enum: GeometryType, required: true })
  geometryType: GeometryType;

  @Prop({ type: String, enum: FunctionalRole, default: FunctionalRole.UNKNOWN })
  functionalRole: FunctionalRole;

  // Geometry and dimensions as structured objects
  @Prop({ type: Object, default: {} })
  geometry: Record<string, any>; // overallShape, profile, etc.

  @Prop({ type: [Object], default: [] })
  dimensions: Array<{ name: string; value: number | null; unit: string; rawValue?: string }>;

  @Prop({ type: String, default: null })
  locationReference: string | null;

  @Prop({ type: String, default: null })
  orientationReference: string | null;

  @Prop({ type: Types.ObjectId, ref: 'OntManufacturingFeature', default: null })
  parentFeatureId: Types.ObjectId | null;

  @Prop({ type: String, enum: CriticalityLevel, default: CriticalityLevel.MEDIUM })
  criticalityLevel: CriticalityLevel;

  // Accessibility
  @Prop({ type: [String], default: [] })
  accessibleDirections: string[];

  @Prop({ type: String, default: null })
  toolAxisConstraints: string | null;

  @Prop({ type: Object, default: null })
  minimumToolClearance: { value: number; unit: string } | null;

  @Prop({ type: Object, default: null })
  depthAccessConstraint: { value: number; unit: string } | null;

  @Prop({ type: Boolean, default: false })
  internalAccessRequired: boolean;

  @Prop({ type: [Types.ObjectId], ref: 'OntDatum', default: [] })
  referencedDatumIds: Types.ObjectId[];

  @Prop({ type: String, default: null })
  notes: string | null;
}

export type OntManufacturingFeatureDocument = OntManufacturingFeature & Document;
export const OntManufacturingFeatureSchema = SchemaFactory.createForClass(OntManufacturingFeature);
OntManufacturingFeatureSchema.index({ partId: 1 });
