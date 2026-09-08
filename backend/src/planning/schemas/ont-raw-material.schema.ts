import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { StockForm } from '../ontology/enums';

@Schema({ timestamps: true, collection: 'ont_raw_materials' })
export class OntRawMaterial {
  @Prop({ type: Types.ObjectId, ref: 'OntMaterial', required: true, index: true })
  materialId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'OntMaterialState', default: null })
  materialStateId: Types.ObjectId | null;

  @Prop({ type: String, enum: StockForm, required: true })
  stockForm: StockForm;

  // Structured dimensions â€” no uncontrolled strings
  @Prop({ type: Object, default: null })
  diameter: { value: number; unit: string } | null;

  @Prop({ type: Object, default: null })
  length: { value: number; unit: string } | null;

  @Prop({ type: Object, default: null })
  width: { value: number; unit: string } | null;

  @Prop({ type: Object, default: null })
  height: { value: number; unit: string } | null;

  @Prop({ type: String, default: null })
  supplierCondition: string | null;

  @Prop({ type: String, default: null })
  incomingTolerance: string | null;

  @Prop({ type: String, default: 'NOT_INSPECTED' })
  inspectionStatus: string;
}

export type OntRawMaterialDocument = OntRawMaterial & Document;
export const OntRawMaterialSchema = SchemaFactory.createForClass(OntRawMaterial);
OntRawMaterialSchema.index({ materialId: 1 });
