import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  MaterialFamily, MaterialCondition, StockForm, ProductionType, CriticalityLevel,
  ManufacturingStateLabel, GeometryType, FunctionalRole, DatumType, ReferenceRole,
  RequirementType, InstrumentType, WorkholdingType, ProcessFamily, ProcessStage,
  AllowanceType, HeatTreatmentType, InspectionStage, FailureAction, DependencyType,
  FeasibilityStatus, SelectionStatus, QualityScope, MachineCategory, ToolCategory,
} from '../ontology/enums';
import { OntMaterial } from '../schemas/ont-material.schema';
import { OntMaterialState } from '../schemas/ont-material-state.schema';
import { OntRawMaterial } from '../schemas/ont-raw-material.schema';
import { OntPart } from '../schemas/ont-part.schema';
import { OntManufacturingState } from '../schemas/ont-manufacturing-state.schema';
import { OntManufacturingFeature } from '../schemas/ont-manufacturing-feature.schema';
import { OntDatum } from '../schemas/ont-datum.schema';
import { OntMeasurementMethod } from '../schemas/ont-measurement-method.schema';
import { OntFeatureRequirement } from '../schemas/ont-feature-requirement.schema';
import { OntWorkholdingResource } from '../schemas/ont-workholding-resource.schema';
import { OntWorkholdingConfiguration } from '../schemas/ont-workholding-configuration.schema';
import { OntSetup } from '../schemas/ont-setup.schema';
import { OntOperation } from '../schemas/ont-operation.schema';
import { OntMachiningAllowance } from '../schemas/ont-machining-allowance.schema';
import { OntHeatTreatment } from '../schemas/ont-heat-treatment.schema';
import { OntInspectionCheckpoint } from '../schemas/ont-inspection-checkpoint.schema';
import { OntOperationDependency } from '../schemas/ont-operation-dependency.schema';
import { OntProcessOption } from '../schemas/ont-process-option.schema';
import { OntQualityRequirement } from '../schemas/ont-quality-requirement.schema';
import { OntMachine } from '../schemas/ont-machine.schema';
import { OntCuttingTool } from '../schemas/ont-cutting-tool.schema';

/**
 * SGS-001 Stepped Gearbox Shaft - Canonical Seed
 * Ground-truth: AISI 4140, Ø65x320mm bar, h6 bearing seat, through-hardening, cylindrical OD grinding.
 * All synthetic numeric values removed. Unspecified values are null.
 * Setup sequence: SETUP_1(Lathe/1st) -> SETUP_2(Lathe/Flipped) -> SETUP_3(VMC-4ax) -> SETUP_HT -> SETUP_4(Grinder)
 */
@Injectable()
export class OntologySeedService implements OnModuleInit {
  private readonly logger = new Logger(OntologySeedService.name);

  constructor(
    @InjectModel(OntMaterial.name) private materialModel: Model<OntMaterial>,
    @InjectModel(OntMaterialState.name) private materialStateModel: Model<OntMaterialState>,
    @InjectModel(OntRawMaterial.name) private rawMaterialModel: Model<OntRawMaterial>,
    @InjectModel(OntPart.name) private partModel: Model<OntPart>,
    @InjectModel(OntManufacturingState.name) private mfgStateModel: Model<OntManufacturingState>,
    @InjectModel(OntManufacturingFeature.name) private featureModel: Model<OntManufacturingFeature>,
    @InjectModel(OntDatum.name) private datumModel: Model<OntDatum>,
    @InjectModel(OntMeasurementMethod.name) private measurementModel: Model<OntMeasurementMethod>,
    @InjectModel(OntFeatureRequirement.name) private requirementModel: Model<OntFeatureRequirement>,
    @InjectModel(OntWorkholdingResource.name) private whResourceModel: Model<OntWorkholdingResource>,
    @InjectModel(OntWorkholdingConfiguration.name) private whConfigModel: Model<OntWorkholdingConfiguration>,
    @InjectModel(OntSetup.name) private setupModel: Model<OntSetup>,
    @InjectModel(OntOperation.name) private operationModel: Model<OntOperation>,
    @InjectModel(OntMachiningAllowance.name) private allowanceModel: Model<OntMachiningAllowance>,
    @InjectModel(OntHeatTreatment.name) private htModel: Model<OntHeatTreatment>,
    @InjectModel(OntInspectionCheckpoint.name) private icModel: Model<OntInspectionCheckpoint>,
    @InjectModel(OntOperationDependency.name) private depModel: Model<OntOperationDependency>,
    @InjectModel(OntProcessOption.name) private optionModel: Model<OntProcessOption>,
    @InjectModel(OntQualityRequirement.name) private qrModel: Model<OntQualityRequirement>,
    @InjectModel(OntMachine.name) private machineModel: Model<OntMachine>,
    @InjectModel(OntCuttingTool.name) private toolModel: Model<OntCuttingTool>,
  ) {}

  async onModuleInit() {
    try {
      const existing = await this.partModel.findOne({ partName: 'Stepped Gearbox Shaft' }).exec();
      if (existing) { this.logger.log('Already seeded - skipping.'); return; }
      this.logger.log('Seeding SGS-001...');
      await this.seed();
      this.logger.log('Seed complete.');
    } catch (err) {
      this.logger.error('Seed failed:', err);
    }
  }

  private async seed() {
    // MATERIAL
    const material = await this.materialModel.create({
      standard: 'AISI', grade: '4140',
      materialFamily: MaterialFamily.ALLOY_STEEL,
      machinabilityRating: null, thermalSensitivity: null,
      heatTreatmentCompatibility: [HeatTreatmentType.THROUGH_HARDENING, HeatTreatmentType.TEMPERING, HeatTreatmentType.STRESS_RELIEF],
    });

    // MATERIAL STATES
    const msAR = await this.materialStateModel.create({ materialId: material._id, condition: MaterialCondition.AS_RECEIVED, hardness: null, thermalCondition: null, surfaceCondition: null });
    const msTH = await this.materialStateModel.create({ materialId: material._id, condition: MaterialCondition.THROUGH_HARDENED, hardness: null, thermalCondition: null, surfaceCondition: null });

    // RAW MATERIAL - ground truth: Ø65x320mm ROUND_BAR
    const rawMat = await this.rawMaterialModel.create({
      materialId: material._id, materialStateId: msAR._id,
      stockForm: StockForm.ROUND_BAR,
      diameter: { value: 65, unit: 'mm' }, length: { value: 320, unit: 'mm' },
      width: null, height: null, supplierCondition: null, incomingTolerance: null, inspectionStatus: 'NOT_INSPECTED',
    });

    // PART
    const part = await this.partModel.create({
      projectId: new Types.ObjectId(), partName: 'Stepped Gearbox Shaft', partNumber: 'SGS-001',
      partFamily: 'SHAFT', productionType: ProductionType.PROTOTYPE, criticalityLevel: CriticalityLevel.HIGH,
      materialId: material._id, rawMaterialId: rawMat._id,
      functionalDescription: 'Stepped transmission shaft with bearing journals, keyway, external thread, circlip grooves, radial oil-feed holes.',
    });

    // MANUFACTURING STATES: RAW->ROUGH->SEMI->HEAT_TREATED->PRECISION
    const sRaw   = await this.mfgStateModel.create({ partId: part._id, stateName: 'RAW',              stateLabel: ManufacturingStateLabel.RAW,               materialStateId: msAR._id, sequenceOrder: 0 });
    const sRough = await this.mfgStateModel.create({ partId: part._id, stateName: 'ROUGH_MACHINED',   stateLabel: ManufacturingStateLabel.ROUGH_MACHINED,      materialStateId: msAR._id, geometryState: 'OD_ROUGHED', sequenceOrder: 1 });
    const sSemi  = await this.mfgStateModel.create({ partId: part._id, stateName: 'SEMI_FINISHED',    stateLabel: ManufacturingStateLabel.SEMI_FINISHED,       materialStateId: msAR._id, geometryState: 'NEAR_NET_SHAPE', dimensionState: 'GRINDING_ALLOWANCE_REMAINING', sequenceOrder: 2 });
    const sHT    = await this.mfgStateModel.create({ partId: part._id, stateName: 'HEAT_TREATED',     stateLabel: ManufacturingStateLabel.HEAT_TREATED,        materialStateId: msTH._id, geometryState: 'DISTORTION_POSSIBLE', thermalState: 'THROUGH_HARDENED', sequenceOrder: 3 });
    const sPrec  = await this.mfgStateModel.create({ partId: part._id, stateName: 'PRECISION_FINISHED',stateLabel: ManufacturingStateLabel.PRECISION_FINISHED,  materialStateId: msTH._id, geometryState: 'FINAL_GEOMETRY', dimensionState: 'TO_DRAWING', sequenceOrder: 4 });

    // FEATURES - 5 canonical. Dimensions null (not specified in source).
    const f1 = await this.featureModel.create({ partId: part._id, geometryType: GeometryType.EXTERNAL_CYLINDER, functionalRole: FunctionalRole.BEARING_SEAT,       dimensions: [], criticalityLevel: CriticalityLevel.HIGH,   accessibleDirections: ['RADIAL','AXIAL'], notes: 'Bearing journal. h6. Final: cylindrical OD grinding.' });
    const f2 = await this.featureModel.create({ partId: part._id, geometryType: GeometryType.KEYWAY,            functionalRole: FunctionalRole.TORQUE_TRANSMISSION, dimensions: [], criticalityLevel: CriticalityLevel.MEDIUM, accessibleDirections: ['RADIAL_TOP'] });
    const f3 = await this.featureModel.create({ partId: part._id, geometryType: GeometryType.THREAD_EXTERNAL,   functionalRole: FunctionalRole.FASTENER_INTERFACE,  dimensions: [], criticalityLevel: CriticalityLevel.MEDIUM, accessibleDirections: ['AXIAL'] });
    const f4 = await this.featureModel.create({ partId: part._id, geometryType: GeometryType.CIRCLIP_GROOVE,   functionalRole: FunctionalRole.RETENTION,           dimensions: [], criticalityLevel: CriticalityLevel.MEDIUM, accessibleDirections: ['RADIAL'] });
    const f5 = await this.featureModel.create({ partId: part._id, geometryType: GeometryType.RADIAL_HOLE,      functionalRole: FunctionalRole.LUBRICATION_CHANNEL, dimensions: [], criticalityLevel: CriticalityLevel.LOW,   accessibleDirections: ['RADIAL'], notes: 'Radial oil-feed lubrication hole.' });

    // DATUM A
    const d1 = await this.datumModel.create({ partId: part._id, datumName: 'A', datumType: DatumType.AXIAL, referenceRole: ReferenceRole.PRIMARY, sourceFeatureId: f1._id, stabilityLevel: 'STABLE' });

    // MEASUREMENT METHOD
    const mm1 = await this.measurementModel.create({ instrumentType: InstrumentType.OUTSIDE_MICROMETER, measurementCategory: 'DIMENSIONAL', measurableRequirementTypes: [RequirementType.DIMENSION, RequirementType.DIMENSIONAL_TOLERANCE, RequirementType.ROUNDNESS, RequirementType.CYLINDRICITY], measurementRange: null, resolution: null, accuracy: null });

    // FEATURE REQUIREMENT: h6 ground truth. Nominal null - not in source.
    const r1 = await this.requirementModel.create({ featureId: f1._id, partId: part._id, requirementType: RequirementType.DIMENSIONAL_TOLERANCE, toleranceClass: 'h6', nominalValue: null, upperLimit: null, lowerLimit: null, criticality: CriticalityLevel.HIGH, functionalReason: 'Bearing journal h6 fit for bearing inner race.', verifiedByMethodIds: [mm1._id] });

    // HEAT TREATMENT ENTITY
    const ht1 = await this.htModel.create({ heatTreatmentType: HeatTreatmentType.THROUGH_HARDENING, compatibleMaterialFamilies: [MaterialFamily.ALLOY_STEEL, MaterialFamily.CARBON_STEEL], inputMaterialStateId: msAR._id, outputMaterialStateId: msTH._id, expectedHardnessChange: null, expectedDistortionRisk: 'MEDIUM', scaleRisk: 'MEDIUM', postTreatmentRequirements: ['STRAIGHTENING_CHECK','DIMENSIONAL_INSPECTION'], affectsHardness: true, affectsDimension: true, affectsDistortion: true, affectsSurfaceCondition: true, affectsMachinability: true });

    // MACHINES (4 - min 3 required)
    const mLathe   = await this.machineModel.create({ machineCategory: MachineCategory.LATHE,                   machineConfiguration: 'CNC_SLANT_BED',      axisCount: 2,    spindleCapabilities: null, workEnvelope: null, positioningAccuracy: null, repeatability: null, supportedProcessFamilies: [ProcessFamily.TURNING,ProcessFamily.BORING,ProcessFamily.THREADING,ProcessFamily.DRILLING,ProcessFamily.REAMING,ProcessFamily.HARD_TURNING], workholdingInterfaces: [WorkholdingType.THREE_JAW_CHUCK,WorkholdingType.SOFT_JAWS,WorkholdingType.COLLET_CHUCK,WorkholdingType.LIVE_CENTER,WorkholdingType.DEAD_CENTER], instanceLabel: 'CNC_LATHE' });
    const mVMC     = await this.machineModel.create({ machineCategory: MachineCategory.MACHINING_CENTER,        machineConfiguration: 'VERTICAL_4_AXIS',    axisCount: 4,    spindleCapabilities: null, workEnvelope: null, positioningAccuracy: null, repeatability: null, supportedProcessFamilies: [ProcessFamily.MILLING,ProcessFamily.DRILLING,ProcessFamily.BORING,ProcessFamily.THREADING], workholdingInterfaces: [WorkholdingType.FOUR_JAW_CHUCK,WorkholdingType.TOMBSTONE_FIXTURE], instanceLabel: '4_AXIS_VMC' });
    const mGrinder = await this.machineModel.create({ machineCategory: MachineCategory.GRINDING_MACHINE,        machineConfiguration: 'CYLINDRICAL_OD',     axisCount: 2,    spindleCapabilities: null, workEnvelope: null, positioningAccuracy: null, repeatability: null, supportedProcessFamilies: [ProcessFamily.GRINDING], workholdingInterfaces: [WorkholdingType.BETWEEN_CENTERS,WorkholdingType.LIVE_CENTER,WorkholdingType.DEAD_CENTER], instanceLabel: 'CYLINDRICAL_GRINDER' });
    const mFurnace = await this.machineModel.create({ machineCategory: MachineCategory.HEAT_TREATMENT_FURNACE, machineConfiguration: 'BATCH_FURNACE',      axisCount: null, spindleCapabilities: null, workEnvelope: null, positioningAccuracy: null, repeatability: null, supportedProcessFamilies: [ProcessFamily.HEAT_TREATMENT], workholdingInterfaces: [], instanceLabel: 'HT_FURNACE' });

    // CUTTING TOOLS (10 - min 8 required)
    const tFace    = await this.toolModel.create({ toolCategory: ToolCategory.TURNING_INSERT,  toolMaterial: 'CARBIDE',       coating: 'TiAlN', geometry: null, sizeParameters: null, compatibleProcessFamilies: [ProcessFamily.TURNING],            compatibleMaterialFamilies: [MaterialFamily.ALLOY_STEEL,MaterialFamily.CARBON_STEEL], wearModes: ['FLANK_WEAR','CRATER_WEAR'],    limitations: [],                            notes: 'General-purpose facing and turning insert.' });
    const tCenter  = await this.toolModel.create({ toolCategory: ToolCategory.DRILL,           toolMaterial: 'HSS',           coating: null,    geometry: null, sizeParameters: null, compatibleProcessFamilies: [ProcessFamily.DRILLING],           compatibleMaterialFamilies: [MaterialFamily.ALLOY_STEEL,MaterialFamily.CARBON_STEEL], wearModes: ['FLANK_WEAR'],               limitations: ['COMBINED_DRILL_COUNTERSINK'], notes: 'Combined center drill for work-center establishment.' });
    const tRough   = await this.toolModel.create({ toolCategory: ToolCategory.TURNING_INSERT,  toolMaterial: 'CARBIDE',       coating: 'TiAlN', geometry: null, sizeParameters: null, compatibleProcessFamilies: [ProcessFamily.TURNING],            compatibleMaterialFamilies: [MaterialFamily.ALLOY_STEEL,MaterialFamily.CARBON_STEEL], wearModes: ['FLANK_WEAR','BUILT_UP_EDGE'], limitations: [],                            notes: 'Heavy-duty roughing insert.' });
    const tFinish  = await this.toolModel.create({ toolCategory: ToolCategory.TURNING_INSERT,  toolMaterial: 'CARBIDE',       coating: 'TiAlN', geometry: null, sizeParameters: null, compatibleProcessFamilies: [ProcessFamily.TURNING,ProcessFamily.BORING], compatibleMaterialFamilies: [MaterialFamily.ALLOY_STEEL,MaterialFamily.CARBON_STEEL], wearModes: ['FLANK_WEAR'],               limitations: [],                            notes: 'Finish turning insert.' });
    const tPart    = await this.toolModel.create({ toolCategory: ToolCategory.TURNING_INSERT,  toolMaterial: 'CARBIDE',       coating: 'TiN',   geometry: null, sizeParameters: null, compatibleProcessFamilies: [ProcessFamily.TURNING],            compatibleMaterialFamilies: [MaterialFamily.ALLOY_STEEL,MaterialFamily.CARBON_STEEL], wearModes: ['FLANK_WEAR'],               limitations: ['PARTING_GROOVING_ONLY'],     notes: 'Parting / cutoff blade insert.' });
    const tGroove  = await this.toolModel.create({ toolCategory: ToolCategory.TURNING_INSERT,  toolMaterial: 'CARBIDE',       coating: 'TiN',   geometry: null, sizeParameters: null, compatibleProcessFamilies: [ProcessFamily.TURNING],            compatibleMaterialFamilies: [MaterialFamily.ALLOY_STEEL,MaterialFamily.CARBON_STEEL], wearModes: ['FLANK_WEAR'],               limitations: ['GROOVING_ONLY'],             notes: 'Grooving insert for circlip grooves.' });
    const tThread  = await this.toolModel.create({ toolCategory: ToolCategory.THREADING_TOOL,  toolMaterial: 'CARBIDE',       coating: 'TiN',   geometry: null, sizeParameters: null, compatibleProcessFamilies: [ProcessFamily.THREADING],          compatibleMaterialFamilies: [MaterialFamily.ALLOY_STEEL,MaterialFamily.CARBON_STEEL], wearModes: ['FLANK_WEAR'],               limitations: ['EXTERNAL_THREAD_ONLY'],      notes: 'Single-point external threading insert.' });
    const tKeyway  = await this.toolModel.create({ toolCategory: ToolCategory.MILLING_CUTTER,  toolMaterial: 'CARBIDE',       coating: 'TiAlN', geometry: null, sizeParameters: null, compatibleProcessFamilies: [ProcessFamily.MILLING],            compatibleMaterialFamilies: [MaterialFamily.ALLOY_STEEL,MaterialFamily.CARBON_STEEL], wearModes: ['FLANK_WEAR','CHIPPING'],      limitations: [],                            notes: 'Solid carbide end mill for keyway milling.' });
    const tDrill   = await this.toolModel.create({ toolCategory: ToolCategory.DRILL,           toolMaterial: 'CARBIDE',       coating: 'TiAlN', geometry: null, sizeParameters: null, compatibleProcessFamilies: [ProcessFamily.DRILLING],           compatibleMaterialFamilies: [MaterialFamily.ALLOY_STEEL,MaterialFamily.CARBON_STEEL], wearModes: ['FLANK_WEAR'],               limitations: [],                            notes: 'Solid carbide drill for radial lubrication holes.' });
    const tGrind   = await this.toolModel.create({ toolCategory: ToolCategory.GRINDING_WHEEL,  toolMaterial: 'ALUMINUM_OXIDE', coating: null,   geometry: null, sizeParameters: null, compatibleProcessFamilies: [ProcessFamily.GRINDING],           compatibleMaterialFamilies: [MaterialFamily.ALLOY_STEEL,MaterialFamily.CARBON_STEEL], wearModes: ['GLAZING','LOADING'],          limitations: ['OD_CYLINDRICAL_GRINDING_ONLY'], notes: 'Aluminum oxide wheel for OD grinding of hardened steel.' });

    // WORKHOLDING RESOURCES (6)
    const whC3  = await this.whResourceModel.create({ workholdingType: WorkholdingType.THREE_JAW_CHUCK,   locationPrinciple: 'EXTERNAL_DIAMETER_3_POINT',       clampingPrinciple: 'RADIAL_CLAMPING',     supportedPartForms: [StockForm.ROUND_BAR,StockForm.FORGING], repeatabilityLevel: 'MEDIUM', rigidityLevel: 'HIGH' });
    const whLC  = await this.whResourceModel.create({ workholdingType: WorkholdingType.LIVE_CENTER,       locationPrinciple: 'AXIAL_CENTER_POINT',              clampingPrinciple: 'SPRING_LOADED_CENTER', supportedPartForms: [StockForm.ROUND_BAR],                  repeatabilityLevel: 'HIGH',   rigidityLevel: 'MEDIUM', accessConstraints: 'REQUIRES_CENTER_DRILLED_END' });
    const whSJ  = await this.whResourceModel.create({ workholdingType: WorkholdingType.SOFT_JAWS,         locationPrinciple: 'EXTERNAL_DIAMETER_CONTOURED',     clampingPrinciple: 'RADIAL_CLAMPING',     supportedPartForms: [StockForm.ROUND_BAR],                  repeatabilityLevel: 'HIGH',   rigidityLevel: 'HIGH',   notes: 'Grips semi-finished OD without damage.' });
    const whRC  = await this.whResourceModel.create({ workholdingType: WorkholdingType.FOUR_JAW_CHUCK,    locationPrinciple: 'INDEXING_ROTARY',                 clampingPrinciple: 'RADIAL_CLAMPING',     supportedPartForms: [StockForm.ROUND_BAR],                  repeatabilityLevel: 'HIGH',   rigidityLevel: 'HIGH',   notes: 'Indexing rotary chuck for 4-axis VMC.' });
    const whDC  = await this.whResourceModel.create({ workholdingType: WorkholdingType.DEAD_CENTER,       locationPrinciple: 'AXIAL_CENTER_POINT',              clampingPrinciple: 'FIXED_TAILSTOCK',     supportedPartForms: [StockForm.ROUND_BAR],                  repeatabilityLevel: 'HIGH',   rigidityLevel: 'HIGH' });
    const whBC  = await this.whResourceModel.create({ workholdingType: WorkholdingType.BETWEEN_CENTERS,   locationPrinciple: 'AXIAL_DUAL_CENTER_DRIVE_DOG',    clampingPrinciple: 'DRIVE_DOG',           supportedPartForms: [StockForm.ROUND_BAR],                  repeatabilityLevel: 'HIGH',   rigidityLevel: 'HIGH',   notes: 'Between centers for cylindrical grinding.' });

    // WORKHOLDING CONFIGURATIONS (4)
    const wc1 = await this.whConfigModel.create({ primaryLocatorResourceId: whC3._id, secondarySupportResourceIds: [whLC._id], clampingResourceIds: [whC3._id], constraintStrategy: 'CHUCK_AND_CENTER',        partContactStrategy: 'EXTERNAL_OD_GRIP_WITH_TAIL_SUPPORT',         configurationRepeatability: 'MEDIUM', configurationRigidity: 'HIGH' });
    const wc2 = await this.whConfigModel.create({ primaryLocatorResourceId: whSJ._id, secondarySupportResourceIds: [whLC._id], clampingResourceIds: [whSJ._id], constraintStrategy: 'SOFT_JAWS_AND_CENTER',    partContactStrategy: 'CONTOURED_SOFT_JAW_GRIP_WITH_TAIL_SUPPORT',  configurationRepeatability: 'HIGH',   configurationRigidity: 'HIGH' });
    const wc3 = await this.whConfigModel.create({ primaryLocatorResourceId: whRC._id, secondarySupportResourceIds: [],         clampingResourceIds: [whRC._id], constraintStrategy: 'INDEXING_ROTARY_CHUCK',   partContactStrategy: 'EXTERNAL_OD_GRIP_INDEXED',                   configurationRepeatability: 'HIGH',   configurationRigidity: 'MEDIUM' });
    const wc4 = await this.whConfigModel.create({ primaryLocatorResourceId: whBC._id, secondarySupportResourceIds: [whDC._id], clampingResourceIds: [],         constraintStrategy: 'BETWEEN_CENTERS',         partContactStrategy: 'DUAL_AXIAL_CENTER_DRIVE_DOG',                configurationRepeatability: 'HIGH',   configurationRigidity: 'HIGH' });

    // SETUP 1 - CNC Lathe / First Orientation (3-jaw + live center)
    const s1 = await this.setupModel.create({ setupName: 'SETUP_1', partId: part._id, inputManufacturingStateId: sRaw._id, outputManufacturingStateId: sRough._id, datumIdsUsed: [d1._id], workholdingConfigurationId: wc1._id, accessibleFeatureIds: [f1._id,f3._id,f4._id,f5._id], machineRequirement: MachineCategory.LATHE, partOrientation: 'HORIZONTAL_CHUCK_LEFT_CENTER_RIGHT', clampingStrategy: 'THREE_JAW_CHUCK_PLUS_LIVE_CENTER', setupSequencePlaceholder: 1 });

    const op1  = await this.operationModel.create({ setupId: s1._id, partId: part._id, processFamily: ProcessFamily.TURNING,   processStage: ProcessStage.FINISHING,          operationName: 'Face Reference End',            inputManufacturingStateId: sRaw._id,   outputManufacturingStateId: sRaw._id,   targetFeatureIds: [],       datumIdsUsed: [],       datumIdsCreated: [d1._id], machineCapabilityRequirements: { category: MachineCategory.LATHE },               workholdingRequirements: { configurationId: wc1._id }, toolRequirements: { category: ToolCategory.TURNING_INSERT,  toolId: tFace._id   }, measurementRequirements: {},                                          processRiskLevel: 'LOW',    sequenceOrder: 1 });
    const op2  = await this.operationModel.create({ setupId: s1._id, partId: part._id, processFamily: ProcessFamily.DRILLING,  processStage: ProcessStage.SECONDARY_PROCESS,  operationName: 'Center Drill',                  inputManufacturingStateId: sRaw._id,   outputManufacturingStateId: sRaw._id,   targetFeatureIds: [],       datumIdsUsed: [d1._id],                    machineCapabilityRequirements: { category: MachineCategory.LATHE },               workholdingRequirements: { configurationId: wc1._id }, toolRequirements: { category: ToolCategory.DRILL,           toolId: tCenter._id }, measurementRequirements: {},                                          processRiskLevel: 'LOW',    sequenceOrder: 2 });
    const op3  = await this.operationModel.create({ setupId: s1._id, partId: part._id, processFamily: ProcessFamily.TURNING,   processStage: ProcessStage.ROUGHING,           operationName: 'Rough-Turn Main Diameters',     inputManufacturingStateId: sRaw._id,   outputManufacturingStateId: sRough._id, targetFeatureIds: [f1._id], datumIdsUsed: [d1._id], modifiedFeatureIds: [f1._id],              machineCapabilityRequirements: { category: MachineCategory.LATHE },               workholdingRequirements: { configurationId: wc1._id }, toolRequirements: { category: ToolCategory.TURNING_INSERT,  toolId: tRough._id  }, measurementRequirements: { postOperation: false },                    processRiskLevel: 'LOW',    sequenceOrder: 3 });
    const op4  = await this.operationModel.create({ setupId: s1._id, partId: part._id, processFamily: ProcessFamily.TURNING,   processStage: ProcessStage.SEMI_FINISHING,     operationName: 'Semi-Finish Journals',          inputManufacturingStateId: sRough._id, outputManufacturingStateId: sRough._id, targetFeatureIds: [f1._id], datumIdsUsed: [d1._id], modifiedFeatureIds: [f1._id],              machineCapabilityRequirements: { category: MachineCategory.LATHE },               workholdingRequirements: { configurationId: wc1._id }, toolRequirements: { category: ToolCategory.TURNING_INSERT,  toolId: tFinish._id }, measurementRequirements: { postOperation: true, methodId: mm1._id },  processRiskLevel: 'LOW',    sequenceOrder: 4 });
    const op5  = await this.operationModel.create({ setupId: s1._id, partId: part._id, processFamily: ProcessFamily.TURNING,   processStage: ProcessStage.SEMI_FINISHING,     operationName: 'Part-Off with Finishing Allowance', inputManufacturingStateId: sRough._id, outputManufacturingStateId: sSemi._id,  targetFeatureIds: [],       datumIdsUsed: [d1._id],                    machineCapabilityRequirements: { category: MachineCategory.LATHE },               workholdingRequirements: { configurationId: wc1._id }, toolRequirements: { category: ToolCategory.TURNING_INSERT,  toolId: tPart._id   }, measurementRequirements: {},                                          processRiskLevel: 'MEDIUM', sequenceOrder: 5 });

    await this.datumModel.findByIdAndUpdate(d1._id, { creationOperationId: op1._id });
    await this.featureModel.findByIdAndUpdate(f1._id, { referencedDatumIds: [d1._id] });

    // SETUP 2 - CNC Lathe / Flipped (soft jaws + live center)
    const s2 = await this.setupModel.create({ setupName: 'SETUP_2', partId: part._id, inputManufacturingStateId: sSemi._id, outputManufacturingStateId: sSemi._id, datumIdsUsed: [d1._id], workholdingConfigurationId: wc2._id, accessibleFeatureIds: [f1._id,f3._id,f4._id], machineRequirement: MachineCategory.LATHE, partOrientation: 'HORIZONTAL_FLIPPED_SOFT_JAWS_CENTER', clampingStrategy: 'SOFT_JAWS_PLUS_LIVE_CENTER', setupSequencePlaceholder: 2 });

    const op6  = await this.operationModel.create({ setupId: s2._id, partId: part._id, processFamily: ProcessFamily.TURNING,   processStage: ProcessStage.FINISHING,  operationName: 'Face to Final Overall Length', inputManufacturingStateId: sSemi._id, outputManufacturingStateId: sSemi._id, targetFeatureIds: [],       datumIdsUsed: [d1._id],                   machineCapabilityRequirements: { category: MachineCategory.LATHE }, workholdingRequirements: { configurationId: wc2._id }, toolRequirements: { category: ToolCategory.TURNING_INSERT, toolId: tFace._id   }, measurementRequirements: { postOperation: true },                     processRiskLevel: 'LOW', sequenceOrder: 6 });
    const op7  = await this.operationModel.create({ setupId: s2._id, partId: part._id, processFamily: ProcessFamily.TURNING,   processStage: ProcessStage.FINISHING,  operationName: 'Finish-Turn Shaft Steps',      inputManufacturingStateId: sSemi._id, outputManufacturingStateId: sSemi._id, targetFeatureIds: [f1._id], datumIdsUsed: [d1._id], modifiedFeatureIds: [f1._id], machineCapabilityRequirements: { category: MachineCategory.LATHE }, workholdingRequirements: { configurationId: wc2._id }, toolRequirements: { category: ToolCategory.TURNING_INSERT, toolId: tFinish._id }, measurementRequirements: { postOperation: true, methodId: mm1._id }, processRiskLevel: 'LOW', sequenceOrder: 7 });
    const op8  = await this.operationModel.create({ setupId: s2._id, partId: part._id, processFamily: ProcessFamily.TURNING,   processStage: ProcessStage.FINISHING,  operationName: 'Cut Circlip Grooves',          inputManufacturingStateId: sSemi._id, outputManufacturingStateId: sSemi._id, targetFeatureIds: [f4._id], datumIdsUsed: [d1._id], createdFeatureIds: [f4._id],  machineCapabilityRequirements: { category: MachineCategory.LATHE }, workholdingRequirements: { configurationId: wc2._id }, toolRequirements: { category: ToolCategory.TURNING_INSERT, toolId: tGroove._id }, measurementRequirements: {},                                         processRiskLevel: 'LOW', sequenceOrder: 8 });
    const op9  = await this.operationModel.create({ setupId: s2._id, partId: part._id, processFamily: ProcessFamily.THREADING, processStage: ProcessStage.FINISHING,  operationName: 'Single-Point External Thread', inputManufacturingStateId: sSemi._id, outputManufacturingStateId: sSemi._id, targetFeatureIds: [f3._id], datumIdsUsed: [d1._id], createdFeatureIds: [f3._id],  machineCapabilityRequirements: { category: MachineCategory.LATHE }, workholdingRequirements: { configurationId: wc2._id }, toolRequirements: { category: ToolCategory.THREADING_TOOL, toolId: tThread._id }, measurementRequirements: {},                                         processRiskLevel: 'LOW', sequenceOrder: 9 });

    // SETUP 3 - 4-Axis VMC / Indexing Rotary Chuck
    const s3 = await this.setupModel.create({ setupName: 'SETUP_3', partId: part._id, inputManufacturingStateId: sSemi._id, outputManufacturingStateId: sSemi._id, datumIdsUsed: [d1._id], workholdingConfigurationId: wc3._id, accessibleFeatureIds: [f2._id,f5._id], machineRequirement: MachineCategory.MACHINING_CENTER, partOrientation: 'HORIZONTAL_RADIAL_ACCESS', clampingStrategy: 'INDEXING_ROTARY_CHUCK', setupSequencePlaceholder: 3 });

    const op10 = await this.operationModel.create({ setupId: s3._id, partId: part._id, processFamily: ProcessFamily.MILLING,  processStage: ProcessStage.FINISHING,         operationName: 'Mill Keyway',                       inputManufacturingStateId: sSemi._id, outputManufacturingStateId: sSemi._id, targetFeatureIds: [f2._id], datumIdsUsed: [d1._id], createdFeatureIds: [f2._id], machineCapabilityRequirements: { category: MachineCategory.MACHINING_CENTER }, workholdingRequirements: { configurationId: wc3._id }, toolRequirements: { category: ToolCategory.MILLING_CUTTER, toolId: tKeyway._id }, measurementRequirements: {},                        processRiskLevel: 'LOW', sequenceOrder: 10 });
    const op11 = await this.operationModel.create({ setupId: s3._id, partId: part._id, processFamily: ProcessFamily.DRILLING, processStage: ProcessStage.SECONDARY_PROCESS, operationName: 'Drill Radial Oil-Feed Lubrication Holes', inputManufacturingStateId: sSemi._id, outputManufacturingStateId: sSemi._id, targetFeatureIds: [f5._id], datumIdsUsed: [d1._id], createdFeatureIds: [f5._id], machineCapabilityRequirements: { category: MachineCategory.MACHINING_CENTER }, workholdingRequirements: { configurationId: wc3._id }, toolRequirements: { category: ToolCategory.DRILL,           toolId: tDrill._id  }, measurementRequirements: {},                        processRiskLevel: 'LOW', sequenceOrder: 11 });

    // SETUP HT - Heat Treatment Furnace
    const sHTs = await this.setupModel.create({ setupName: 'SETUP_HT', partId: part._id, inputManufacturingStateId: sSemi._id, outputManufacturingStateId: sHT._id, datumIdsUsed: [], workholdingConfigurationId: null, accessibleFeatureIds: [], machineRequirement: MachineCategory.HEAT_TREATMENT_FURNACE, partOrientation: 'BATCH_FURNACE_LOAD', clampingStrategy: 'NOT_APPLICABLE', setupSequencePlaceholder: 4 });

    const op12 = await this.operationModel.create({ setupId: sHTs._id, partId: part._id, processFamily: ProcessFamily.HEAT_TREATMENT, processStage: ProcessStage.THERMAL_PROCESSING, operationName: 'Heat Treatment - Through Hardening', inputManufacturingStateId: sSemi._id, outputManufacturingStateId: sHT._id, targetFeatureIds: [f1._id], modifiedFeatureIds: [f1._id], datumIdsUsed: [], machineCapabilityRequirements: { category: MachineCategory.HEAT_TREATMENT_FURNACE, htEntityId: ht1._id }, workholdingRequirements: {}, toolRequirements: {}, measurementRequirements: { postOperation: true, note: 'Post-HT: straightness and allowance check before grinding.' }, processRiskLevel: 'HIGH', sequenceOrder: 12 });

    // SETUP 4 - Cylindrical Grinder / Between Centers
    const s4 = await this.setupModel.create({ setupName: 'SETUP_4', partId: part._id, inputManufacturingStateId: sHT._id, outputManufacturingStateId: sPrec._id, datumIdsUsed: [d1._id], workholdingConfigurationId: wc4._id, accessibleFeatureIds: [f1._id], machineRequirement: MachineCategory.GRINDING_MACHINE, partOrientation: 'HORIZONTAL_BETWEEN_CENTERS', clampingStrategy: 'BETWEEN_CENTERS_DRIVE_DOG', setupSequencePlaceholder: 5 });

    const op13 = await this.operationModel.create({ setupId: s4._id, partId: part._id, processFamily: ProcessFamily.GRINDING, processStage: ProcessStage.PRECISION_FINISHING, operationName: 'Cylindrical OD Grind Bearing Journal', inputManufacturingStateId: sHT._id, outputManufacturingStateId: sPrec._id, targetFeatureIds: [f1._id], modifiedFeatureIds: [f1._id], datumIdsUsed: [d1._id], machineCapabilityRequirements: { category: MachineCategory.GRINDING_MACHINE }, workholdingRequirements: { configurationId: wc4._id }, toolRequirements: { category: ToolCategory.GRINDING_WHEEL, toolId: tGrind._id }, measurementRequirements: { postOperation: true, methodId: mm1._id, requirementId: r1._id, note: 'Verify h6 using outside micrometer.' }, processRiskLevel: 'MEDIUM', sequenceOrder: 13 });

    // MACHINING ALLOWANCE
    await this.allowanceModel.create({ featureId: f1._id, manufacturingStateId: sSemi._id, allowanceType: AllowanceType.RADIAL, direction: 'OUTWARD_FROM_AXIS', nominalRemainingStock: { value: 0.3, unit: 'mm' }, intendedNextProcess: 'CYLINDRICAL_OD_GRINDING', reason: 'Stock retained after semi-finishing for heat treatment distortion compensation.' });

    // OPERATION DEPENDENCIES (11)
    const depData = [
      { s: op1._id,  t: op2._id,  r: 'Face before center drill.',                  type: DependencyType.MUST_OCCUR_BEFORE },
      { s: op2._id,  t: op3._id,  r: 'Center drill before rough turning.',          type: DependencyType.MUST_OCCUR_BEFORE },
      { s: op3._id,  t: op4._id,  r: 'Rough before semi-finish.',                   type: DependencyType.MUST_OCCUR_BEFORE },
      { s: op4._id,  t: op5._id,  r: 'Semi-finish before part-off.',               type: DependencyType.MUST_OCCUR_BEFORE },
      { s: op5._id,  t: op6._id,  r: 'Part-off before flipped second setup.',       type: DependencyType.MUST_OCCUR_BEFORE },
      { s: op6._id,  t: op7._id,  r: 'Face to length before finish-turning steps.', type: DependencyType.MUST_OCCUR_BEFORE },
      { s: op7._id,  t: op8._id,  r: 'Finish steps before grooving.',              type: DependencyType.MUST_OCCUR_BEFORE },
      { s: op7._id,  t: op9._id,  r: 'Finish steps before threading.',             type: DependencyType.MUST_OCCUR_BEFORE },
      { s: op10._id, t: op12._id, r: 'Keyway complete before heat treatment.',      type: DependencyType.MUST_OCCUR_BEFORE },
      { s: op11._id, t: op12._id, r: 'Radial holes before heat treatment.',         type: DependencyType.MUST_OCCUR_BEFORE },
      { s: op12._id, t: op13._id, r: 'Heat treatment before cylindrical grinding.', type: DependencyType.REQUIRES_STATE   },
    ];
    for (const d of depData) {
      await this.depModel.create({ sourceOperationId: d.s, targetOperationId: d.t, dependencyType: d.type, reason: d.r });
    }

    // PROCESS OPTIONS: Keyway - Milling vs Broaching
    await this.optionModel.create({ partId: part._id, targetFeatureIds: [f2._id], candidateOperationType: ProcessFamily.MILLING,   candidateMachineRequirement: MachineCategory.MACHINING_CENTER, candidateToolRequirement: 'END_MILL',       feasibilityStatus: FeasibilityStatus.FEASIBLE,              selectionStatus: SelectionStatus.CANDIDATE });
    await this.optionModel.create({ partId: part._id, targetFeatureIds: [f2._id], candidateOperationType: ProcessFamily.BROACHING, candidateMachineRequirement: MachineCategory.BROACHING_MACHINE, candidateToolRequirement: 'KEYWAY_BROACH', feasibilityStatus: FeasibilityStatus.POTENTIALLY_FEASIBLE, selectionStatus: SelectionStatus.CANDIDATE });

    // INSPECTION CHECKPOINT: Post-HT before grinding
    await this.icModel.create({ partId: part._id, triggerStage: InspectionStage.POST_HEAT_TREATMENT, triggerOperationId: op12._id, targetFeatureIds: [f1._id], requirementIds: [r1._id], measurementMethodIds: [mm1._id], acceptanceCriteria: { distortionCheck: 'Straightness before grinding.', allowanceCheck: 'Grinding allowance within spec.' }, failureAction: FailureAction.HOLD, outputQualityStatus: 'POST_HT_INSPECTED' });

    // QUALITY REQUIREMENT
    await this.qrModel.create({ partId: part._id, scope: QualityScope.FEATURE, requirementType: RequirementType.DIMENSIONAL_TOLERANCE, acceptanceCriteria: { feature: 'F1_BEARING_JOURNAL', toleranceClass: 'h6', note: 'Nominal not in source. Apply h6 to drawing dimension.' }, inspectionStage: InspectionStage.FINAL_INSPECTION, inspectionFrequency: 'EVERY_PART', failureSeverity: 'HIGH', verifiedByMethodIds: [mm1._id] });
  }
}
