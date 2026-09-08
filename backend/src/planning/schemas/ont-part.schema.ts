import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CriticalityLevel, PartStatus, ProductionType } from '../ontology/enums';

@Schema({ timestamps: true, collection: 'ont_parts' })
export class OntPart {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: Types.ObjectId;

  @Prop({ type: String, required: true })
  partName: string;

  @Prop({ type: String, default: null })
  partNumber: string | null;

  @Prop({ type: String, default: null })
  partFamily: string | null;

  @Prop({ type: Types.ObjectId, ref: 'OntMaterial', default: null })
  materialId: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'OntRawMaterial', default: null })
  rawMaterialId: Types.ObjectId | null;

  @Prop({ type: String, enum: ProductionType, default: ProductionType.PROTOTYPE })
  productionType: ProductionType;

  @Prop({ type: Number, default: null })
  productionQuantity: number | null;

  @Prop({ type: Number, default: null })
  batchSize: number | null;

  @Prop({ type: String, default: null })
  functionalDescription: string | null;

  @Prop({ type: String, enum: CriticalityLevel, default: CriticalityLevel.MEDIUM })
  criticalityLevel: CriticalityLevel;

  @Prop({ type: String, enum: PartStatus, default: PartStatus.DRAFT })
  status: PartStatus;
}

export type OntPartDocument = OntPart & Document;
export const OntPartSchema = SchemaFactory.createForClass(OntPart);
OntPartSchema.index({ projectId: 1 });
