import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ToolCategory } from '../ontology/enums';

/**
 * OntCuttingTool — Cutting tool resource capability entity.
 * Represents tool identity and what it CAN machine, not cutting parameters.
 * Phase 1: structure only. No selection, parameter optimization, or tool-life logic.
 */
@Schema({ timestamps: true, collection: 'ont_cutting_tools' })
export class OntCuttingTool {
  @Prop({ type: String, enum: ToolCategory, required: true })
  toolCategory: ToolCategory;

  /**
   * Tool material — controlled string.
   * e.g. CARBIDE, HSS, CERAMIC, CBN, DIAMOND, CERMET
   */
  @Prop({ type: String, required: true })
  toolMaterial: string;

  /**
   * Coating — controlled string.
   * e.g. TiN, TiAlN, AlTiN, TiCN, DLC, UNCOATED
   */
  @Prop({ type: String, default: null })
  coating: string | null;

  /**
   * Geometry descriptors — structured, not a long NL string.
   * e.g. { rakeAngle: { value: 5, unit: 'deg' }, reliefAngle: { value: 7, unit: 'deg' }, noseRadius: { value: 0.4, unit: 'mm' } }
   */
  @Prop({ type: Object, default: null })
  geometry: Record<string, { value: number; unit: string } | string> | null;

  /**
   * Size parameters — structured numeric values with units.
   * e.g. { diameter: { value: 10, unit: 'mm' }, overallLength: { value: 75, unit: 'mm' } }
   */
  @Prop({ type: Object, default: null })
  sizeParameters: Record<string, { value: number; unit: string }> | null;

  /** ProcessFamily values this tool is compatible with */
  @Prop({ type: [String], default: [] })
  compatibleProcessFamilies: string[];

  /** MaterialFamily values this tool can machine */
  @Prop({ type: [String], default: [] })
  compatibleMaterialFamilies: string[];

  /**
   * Known wear modes — descriptive labels only.
   * e.g. ['FLANK_WEAR', 'CRATER_WEAR', 'BUILT_UP_EDGE']
   * Phase 1: enumerated labels, no simulation.
   */
  @Prop({ type: [String], default: [] })
  wearModes: string[];

  /**
   * Known limitations — descriptive labels or short phrases.
   * e.g. ['NOT_FOR_INTERRUPTED_CUT', 'MAX_DEPTH_3MM']
   * Phase 1: recorded as-is, no enforcement logic.
   */
  @Prop({ type: [String], default: [] })
  limitations: string[];

  @Prop({ type: String, default: null })
  notes: string | null;
}

export type OntCuttingToolDocument = OntCuttingTool & Document;
export const OntCuttingToolSchema = SchemaFactory.createForClass(OntCuttingTool);
OntCuttingToolSchema.index({ toolCategory: 1 });
OntCuttingToolSchema.index({ compatibleProcessFamilies: 1 });
