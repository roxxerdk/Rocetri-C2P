import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { WorkholdingType } from '../ontology/enums';

@Schema({ timestamps: true, collection: 'ont_workholding_resources' })
export class OntWorkholdingResource {
  @Prop({ type: String, enum: WorkholdingType, required: true })
  workholdingType: WorkholdingType;

  @Prop({ type: String, default: null })
  locationPrinciple: string | null;

  @Prop({ type: String, default: null })
  clampingPrinciple: string | null;

  @Prop({ type: [String], default: [] })
  supportedPartForms: string[]; // StockForm values

  @Prop({ type: [String], default: [] })
  supportedFeatureTypes: string[]; // GeometryType values

  @Prop({ type: String, default: null })
  repeatabilityLevel: string | null;

  @Prop({ type: String, default: null })
  rigidityLevel: string | null;

  @Prop({ type: String, default: null })
  accessConstraints: string | null;
}

export type OntWorkholdingResourceDocument = OntWorkholdingResource & Document;
export const OntWorkholdingResourceSchema = SchemaFactory.createForClass(OntWorkholdingResource);
