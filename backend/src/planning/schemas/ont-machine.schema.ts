import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { MachineCategory } from '../ontology/enums';

/**
 * OntMachine — Manufacturing resource capability entity.
 * Represents what a machine CAN do, not what it IS assigned to.
 * Phase 1: structure only. No selection, scheduling, or cost logic.
 */
@Schema({ timestamps: true, collection: 'ont_machines' })
export class OntMachine {
  @Prop({ type: String, enum: MachineCategory, required: true })
  machineCategory: MachineCategory;

  /** e.g. HORIZONTAL, VERTICAL, SLANT_BED, SWISS_TYPE */
  @Prop({ type: String, default: null })
  machineConfiguration: string | null;

  /** Number of controlled axes */
  @Prop({ type: Number, default: null })
  axisCount: number | null;

  /**
   * Spindle capabilities — structured, no uncontrolled string.
   * e.g. { maxRpm: 6000, maxPower: { value: 15, unit: 'kW' }, taperType: 'BT40' }
   */
  @Prop({ type: Object, default: null })
  spindleCapabilities: {
    maxRpm?: number;
    maxPower?: { value: number; unit: string };
    taperType?: string;
  } | null;

  /**
   * Work envelope — structured dimensions.
   * e.g. { xTravel: { value: 500, unit: 'mm' }, maxTurningDiameter: { value: 320, unit: 'mm' } }
   */
  @Prop({ type: Object, default: null })
  workEnvelope: Record<string, { value: number; unit: string }> | null;

  /** Positioning accuracy as a structured value */
  @Prop({ type: Object, default: null })
  positioningAccuracy: { value: number; unit: string } | null;

  /** Repeatability as a structured value */
  @Prop({ type: Object, default: null })
  repeatability: { value: number; unit: string } | null;

  /** ProcessFamily values this machine can perform */
  @Prop({ type: [String], default: [] })
  supportedProcessFamilies: string[];

  /** WorkholdingType values the machine spindle/table can accept */
  @Prop({ type: [String], default: [] })
  workholdingInterfaces: string[];

  /** Optional label for a specific machine instance */
  @Prop({ type: String, default: null })
  instanceLabel: string | null;

  @Prop({ type: String, default: null })
  notes: string | null;
}

export type OntMachineDocument = OntMachine & Document;
export const OntMachineSchema = SchemaFactory.createForClass(OntMachine);
OntMachineSchema.index({ machineCategory: 1 });
