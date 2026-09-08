import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { InstrumentType } from '../ontology/enums';

@Schema({ timestamps: true, collection: 'ont_measurement_methods' })
export class OntMeasurementMethod {
  @Prop({ type: String, default: null })
  measurementCategory: string | null;

  @Prop({ type: String, enum: InstrumentType, required: true })
  instrumentType: InstrumentType;

  @Prop({ type: [String], default: [] })
  measurableRequirementTypes: string[]; // RequirementType values

  @Prop({ type: Object, default: null })
  measurementRange: { min: number; max: number; unit: string } | null;

  @Prop({ type: Object, default: null })
  resolution: { value: number; unit: string } | null;

  @Prop({ type: Object, default: null })
  accuracy: { value: number; unit: string } | null;

  @Prop({ type: String, default: null })
  inspectionEnvironmentRequirements: string | null;
}

export type OntMeasurementMethodDocument = OntMeasurementMethod & Document;
export const OntMeasurementMethodSchema = SchemaFactory.createForClass(OntMeasurementMethod);
