import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DatumType, ReferenceRole } from '../ontology/enums';

@Schema({ timestamps: true, collection: 'ont_datums' })
export class OntDatum {
  @Prop({ type: Types.ObjectId, ref: 'OntPart', required: true, index: true })
  partId: Types.ObjectId;

  @Prop({ type: String, required: true })
  datumName: string; // e.g. A, B, C or descriptive name

  @Prop({ type: String, enum: DatumType, required: true })
  datumType: DatumType;

  @Prop({ type: Types.ObjectId, ref: 'OntManufacturingFeature', default: null })
  sourceFeatureId: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'OntOperation', default: null })
  creationOperationId: Types.ObjectId | null;

  @Prop({ type: String, enum: ReferenceRole, required: true })
  referenceRole: ReferenceRole;

  @Prop({ type: String, default: null })
  stabilityLevel: string | null; // e.g. STABLE, CONDITIONALLY_STABLE
}

export type OntDatumDocument = OntDatum & Document;
export const OntDatumSchema = SchemaFactory.createForClass(OntDatum);
OntDatumSchema.index({ partId: 1 });
