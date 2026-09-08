import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ManufacturingStateLabel } from '../ontology/enums';

@Schema({ timestamps: true, collection: 'ont_manufacturing_states' })
export class OntManufacturingState {
  @Prop({ type: Types.ObjectId, ref: 'OntPart', required: true, index: true })
  partId: Types.ObjectId;

  @Prop({ type: String, required: true })
  stateName: string;

  @Prop({ type: String, enum: ManufacturingStateLabel, required: true })
  stateLabel: ManufacturingStateLabel;

  @Prop({ type: Types.ObjectId, ref: 'OntMaterialState', default: null })
  materialStateId: Types.ObjectId | null;

  // Descriptors for the part at this state
  @Prop({ type: String, default: null })
  geometryState: string | null;

  @Prop({ type: String, default: null })
  dimensionState: string | null;

  @Prop({ type: String, default: null })
  surfaceState: string | null;

  @Prop({ type: String, default: null })
  thermalState: string | null;

  @Prop({ type: String, default: 'UNKNOWN' })
  qualityStatus: string;

  @Prop({ type: Number, default: 0 })
  sequenceOrder: number; // lower = earlier in process
}

export type OntManufacturingStateDocument = OntManufacturingState & Document;
export const OntManufacturingStateSchema = SchemaFactory.createForClass(OntManufacturingState);
OntManufacturingStateSchema.index({ partId: 1, sequenceOrder: 1 });
