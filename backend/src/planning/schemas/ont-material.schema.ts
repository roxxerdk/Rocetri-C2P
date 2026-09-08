import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { MaterialFamily } from '../ontology/enums';

@Schema({ timestamps: true, collection: 'ont_materials' })
export class OntMaterial {
  @Prop({ type: String, required: true })
  standard: string; // e.g. AISI, EN, DIN

  @Prop({ type: String, required: true })
  grade: string; // e.g. 4140, 316L

  @Prop({ type: String, enum: MaterialFamily, required: true })
  materialFamily: MaterialFamily;

  @Prop({ type: Number, min: 0, max: 100, default: null })
  machinabilityRating: number | null; // 0-100 relative scale

  @Prop({ type: String, default: null })
  thermalSensitivity: string | null;

  @Prop({ type: [String], default: [] })
  heatTreatmentCompatibility: string[]; // list of compatible HeatTreatmentType values

  @Prop({ type: String, default: null })
  notes: string | null;
}

export type OntMaterialDocument = OntMaterial & Document;
export const OntMaterialSchema = SchemaFactory.createForClass(OntMaterial);
OntMaterialSchema.index({ standard: 1, grade: 1 }, { unique: true });
