import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SetupStatus } from '../ontology/enums';

@Schema({ timestamps: true, collection: 'ont_setups' })
export class OntSetup {
  @Prop({ type: Types.ObjectId, ref: 'OntPart', required: true, index: true })
  partId: Types.ObjectId;

  @Prop({ type: String, required: true })
  setupName: string; // e.g. SETUP_1, OP10

  @Prop({ type: Types.ObjectId, ref: 'OntManufacturingState', default: null })
  inputManufacturingStateId: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'OntManufacturingState', default: null })
  outputManufacturingStateId: Types.ObjectId | null;

  @Prop({ type: [Types.ObjectId], ref: 'OntDatum', default: [] })
  datumIdsUsed: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'OntManufacturingFeature', default: [] })
  accessibleFeatureIds: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'OntWorkholdingConfiguration', default: null })
  workholdingConfigurationId: Types.ObjectId | null;

  @Prop({ type: String, default: null })
  partOrientation: string | null;

  @Prop({ type: String, default: null })
  clampingStrategy: string | null;

  @Prop({ type: String, default: null })
  machineRequirement: string | null; // machine category or specific ID

  @Prop({ type: Number, default: null })
  setupSequencePlaceholder: number | null;

  @Prop({ type: String, enum: SetupStatus, default: SetupStatus.DRAFT })
  status: SetupStatus;
}

export type OntSetupDocument = OntSetup & Document;
export const OntSetupSchema = SchemaFactory.createForClass(OntSetup);
OntSetupSchema.index({ partId: 1 });
