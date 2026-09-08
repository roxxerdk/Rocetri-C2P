import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MaterialCondition } from '../ontology/enums';

@Schema({ timestamps: true, collection: 'ont_material_states' })
export class OntMaterialState {
  @Prop({ type: Types.ObjectId, ref: 'OntMaterial', required: true, index: true })
  materialId: Types.ObjectId;

  @Prop({ type: String, enum: MaterialCondition, required: true })
  condition: MaterialCondition;

  @Prop({ type: Object, default: null })
  hardness: { value: number; unit: string } | null; // e.g. { value: 58, unit: 'HRC' }

  @Prop({ type: String, default: null })
  thermalCondition: string | null;

  @Prop({ type: String, default: null })
  surfaceCondition: string | null;

  @Prop({ type: String, default: null })
  notes: string | null;
}

export type OntMaterialStateDocument = OntMaterialState & Document;
export const OntMaterialStateSchema = SchemaFactory.createForClass(OntMaterialState);
OntMaterialStateSchema.index({ materialId: 1 });
