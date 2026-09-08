import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'ont_workholding_configurations' })
export class OntWorkholdingConfiguration {
  @Prop({ type: Types.ObjectId, ref: 'OntWorkholdingResource', required: true })
  primaryLocatorResourceId: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'OntWorkholdingResource', default: [] })
  secondarySupportResourceIds: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'OntWorkholdingResource', default: [] })
  clampingResourceIds: Types.ObjectId[];

  @Prop({ type: String, default: null })
  constraintStrategy: string | null;

  @Prop({ type: String, default: null })
  partContactStrategy: string | null;

  @Prop({ type: String, default: null })
  configurationRepeatability: string | null;

  @Prop({ type: String, default: null })
  configurationRigidity: string | null;
}

export type OntWorkholdingConfigurationDocument = OntWorkholdingConfiguration & Document;
export const OntWorkholdingConfigurationSchema = SchemaFactory.createForClass(OntWorkholdingConfiguration);
