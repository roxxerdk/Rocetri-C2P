import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AiInterpretationService } from './ai-interpretation.service';
import { AiPlanningService } from './ai-planning.service';
import {
  AnalyzePartDto,
  GenerateProcessPlanDto,
  PartPlanningInput,
  FeatureInterpretationResult,
  StructuredProcessPlan,
} from './dto/demo-planning.dto';
import { OntPart } from '../schemas/ont-part.schema';
import { OntSetup } from '../schemas/ont-setup.schema';
import { OntOperation } from '../schemas/ont-operation.schema';
import { OntMachine } from '../schemas/ont-machine.schema';
import { OntCuttingTool } from '../schemas/ont-cutting-tool.schema';
import { OntHeatTreatment } from '../schemas/ont-heat-treatment.schema';
import { OntRawMaterial } from '../schemas/ont-raw-material.schema';
import { OntMaterial } from '../schemas/ont-material.schema';
import { OntManufacturingFeature } from '../schemas/ont-manufacturing-feature.schema';
import { Context, ContextDocument } from '../../engineering/schemas/context.schema';
import { ProcessPlan, ProcessPlanDocument } from '../schemas/process-plan.schema';
import { ProjectsService } from '../../projects/projects.service';
import { DerivedStatus, WorkflowStage } from '../../shared/enums';

@Injectable()
export class DemoPlanningService {
  private readonly logger = new Logger(DemoPlanningService.name);

  constructor(
    private readonly interpretationService: AiInterpretationService,
    private readonly planningService: AiPlanningService,
    private readonly projectsService: ProjectsService,
    @InjectModel(OntPart.name) private partModel: Model<OntPart>,
    @InjectModel(OntSetup.name) private setupModel: Model<OntSetup>,
    @InjectModel(OntOperation.name) private operationModel: Model<OntOperation>,
    @InjectModel(OntMachine.name) private machineModel: Model<OntMachine>,
    @InjectModel(OntCuttingTool.name) private toolModel: Model<OntCuttingTool>,
    @InjectModel(OntHeatTreatment.name) private htModel: Model<OntHeatTreatment>,
    @InjectModel(OntRawMaterial.name) private rawMatModel: Model<OntRawMaterial>,
    @InjectModel(OntMaterial.name) private matModel: Model<OntMaterial>,
    @InjectModel(OntManufacturingFeature.name) private featModel: Model<OntManufacturingFeature>,
    @InjectModel(Context.name) private contextModel: Model<ContextDocument>,
    @InjectModel(ProcessPlan.name) private planModel: Model<ProcessPlanDocument>,
  ) {}

  /**
   * Main C2P Workflow: Generate Process Plan directly from project's extracted CAED context!
  * Uses canonical Stepped Gearbox Shaft pattern as template and calls the configured AI provider.
   */
  async generatePlanFromProjectContext(projectId: string): Promise<any> {
    this.logger.log(`Generating process plan from extracted CAD context for project: ${projectId}`);

    const project = await this.projectsService.findById(projectId);
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    let context: ContextDocument | null = null;
    if (project.currentContextRef) {
      context = await this.contextModel.findById(project.currentContextRef).exec();
    }
    if (!context) {
      context = await this.contextModel
        .findOne({ projectId: new Types.ObjectId(projectId), status: DerivedStatus.VALID })
        .sort({ version: -1 })
        .exec();
    }
    if (!context) {
      context = await this.contextModel
        .findOne({ projectId: new Types.ObjectId(projectId) })
        .sort({ version: -1 })
        .exec();
    }

    if (!context || !context.contextData) {
      throw new BadRequestException(
        'No extracted CAD drawing context found for this project. Please upload and extract a CAD diagram first in the Extraction section.'
      );
    }

    const cd = context.contextData as any;
    const partName = cd.drawing?.partName || project.projectName || 'Extracted Component';
    const materialName = cd.material?.name || cd.material?.grade || 'Alloy Steel';
    const materialFamily = this.inferMaterialFamily(materialName);
    const overallDims = cd.geometry?.overallDimensions || [];
    const features = cd.geometry?.features || [];
    const tolerances = cd.tolerances || {};
    const notes = cd.manufacturingNotes?.generalNotes || [];

    const dimString = overallDims.length > 0
      ? overallDims.map((d: any) => `${d.type || d.dimensionType || 'DIM'}: ${d.value || d.nominal || ''}${d.unit || 'mm'}`).join(', ')
      : 'Per engineering drawing';

    const partInput: PartPlanningInput = {
      partName,
      material: `${materialName}${cd.material?.standard ? ' (' + cd.material.standard + ')' : ''}`,
      materialFamily,
      rawMaterial: {
        stockForm: cd.material?.rawMaterialType || 'ROUND_BAR',
        dimensions: { overall: dimString },
      },
      dimensions: { overallDimensions: overallDims },
      description: [
        `Part Name: ${partName}`,
        `Part Number: ${cd.drawing?.partNumber || 'N/A'}`,
        `Material: ${materialName} | Condition: ${cd.material?.condition || 'As-received'}`,
        `Overall Dimensions: ${dimString}`,
        `Extracted Features Count: ${features.length}`,
        features.length > 0 ? `Features Summary: ${features.slice(0, 8).map((f: any) => `${f.type || f.name}: ${f.nominal || ''}`).join('; ')}` : '',
        tolerances.generalTolerance?.value ? `General Tolerance: ${tolerances.generalTolerance.value}` : '',
        notes.length > 0 ? `Manufacturing Notes: ${notes.slice(0, 4).join('; ')}` : '',
      ].filter(Boolean).join('\n'),
      inputSources: {
        extractedText: `CAED drawing extraction from project ${projectId}`,
        userDescription: 'Extracted CAD Engineering Drawing Data',
      },
    };

    // Step 1: Feature interpretation via the configured AI provider
    const interpretation = await this.interpretationService.interpretFeatures(partInput);

    // Step 2: Contextual plan generation with canonical reference pattern
    const ontologyContext = await this.buildOntologyContext();
    const canonicalReference = await this.buildCanonicalReferenceSummary();

    const planData = await this.planningService.generateProcessPlan(
      partInput,
      interpretation,
      canonicalReference,
      ontologyContext,
    );

    // Step 3: Persist into MongoDB ProcessPlan collection
    const latest = await this.planModel
      .findOne({ projectId: new Types.ObjectId(projectId) })
      .sort({ version: -1 })
      .exec();
    const version = latest ? latest.version + 1 : 1;

    const processPlan = new this.planModel({
      projectId: new Types.ObjectId(projectId),
      sourceVerifiedContextId: context._id,
      version,
      planData,
      status: DerivedStatus.VALID,
      metadata: {
        generatedAt: new Date().toISOString(),
        provider: 'claude',
        extractedSourceDrawing: partName,
        featureCount: features.length,
      },
    });
    await processPlan.save();

    // Update project state
    await this.projectsService.update(projectId, {
      currentProcessPlanRef: processPlan._id as Types.ObjectId,
      primaryWorkflowStage: WorkflowStage.PLANNED as any,
    });

    this.logger.log(`Process plan version ${version} successfully saved for project ${projectId}`);

    return {
      _id: processPlan._id,
      projectId,
      version,
      planData,
      extractedContext: {
        partName,
        material: materialName,
        dimString,
        featureCount: features.length,
        notesCount: notes.length,
      },
      interpretation,
      status: DerivedStatus.VALID,
    };
  }

  /**
   * Helper to map free-text material names to controlled ontology MaterialFamily.
   */
  private inferMaterialFamily(mat: string): string {
    const m = mat.toUpperCase();
    if (m.includes('4140') || m.includes('4340') || m.includes('ALLOY') || m.includes('EN19') || m.includes('EN24')) {
      return 'ALLOY_STEEL';
    }
    if (m.includes('CARBON') || m.includes('1045') || m.includes('1018') || m.includes('MILD') || m.includes('EN8') || m.includes('EN9')) {
      return 'CARBON_STEEL';
    }
    if (m.includes('STAINLESS') || m.includes('304') || m.includes('316') || m.includes('410') || m.includes('420')) {
      return 'STAINLESS_STEEL';
    }
    if (m.includes('ALUMINUM') || m.includes('6061') || m.includes('7075') || m.includes('2024') || m.includes('AL')) {
      return 'ALUMINUM_ALLOY';
    }
    if (m.includes('CAST') || m.includes('IRON') || m.includes('DUCTILE')) {
      return 'CAST_IRON';
    }
    if (m.includes('TITANIUM') || m.includes('TI')) {
      return 'TITANIUM_ALLOY';
    }
    return 'ALLOY_STEEL';
  }

  /**
  * Step 1: Normalize input and run feature interpretation.
   */
  async analyzePart(
    dto: AnalyzePartDto,
    file?: { originalname: string; mimetype: string; size: number; buffer?: Buffer },
  ): Promise<{ partInput: PartPlanningInput; interpretation: FeatureInterpretationResult }> {
    this.logger.log(`Analyzing part input for: ${dto.partName || 'Demo Part'}`);

    let extractedText: string | undefined = undefined;
    let uploadedFileInfo: any = undefined;

    if (file) {
      uploadedFileInfo = {
        filename: file.originalname,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      };

      if (
        (file.mimetype.includes('text') || file.originalname.endsWith('.txt')) &&
        file.buffer
      ) {
        try {
          extractedText = file.buffer.toString('utf8');
        } catch (e) {
          this.logger.warn(`Could not extract text from uploaded file: ${e.message}`);
        }
      }
    }

    const partInput: PartPlanningInput = {
      partName: dto.partName || (uploadedFileInfo ? uploadedFileInfo.originalName.replace(/\.[^/.]+$/, '') : 'Component-01'),
      material: dto.material || 'Unspecified Material',
      materialFamily: dto.materialFamily || undefined,
      rawMaterial: dto.rawMaterial || undefined,
      dimensions: dto.dimensions || undefined,
      description: dto.description || undefined,
      inputSources: {
        uploadedFile: uploadedFileInfo,
        extractedText,
        userDescription: dto.description,
      },
    };

    const interpretation = await this.interpretationService.interpretFeatures(partInput);

    return { partInput, interpretation };
  }

  /**
  * Step 2: Retrieve ontology context + canonical pattern and generate a structured plan.
   */
  async generateProcessPlan(dto: GenerateProcessPlanDto): Promise<StructuredProcessPlan> {
    this.logger.log(`Generating process plan for: ${dto.partInput.partName}`);

    const ontologyContext = await this.buildOntologyContext();
    const canonicalReference = await this.buildCanonicalReferenceSummary();

    return this.planningService.generateProcessPlan(
      dto.partInput,
      dto.interpretation,
      canonicalReference,
      ontologyContext,
    );
  }

  /**
   * Pre-loads the canonical Stepped Gearbox Shaft ground truth as PartPlanningInput.
   */
  async getCanonicalShaftInput(): Promise<PartPlanningInput> {
    return {
      partName: 'Stepped Gearbox Shaft',
      material: 'AISI 4140',
      materialFamily: 'ALLOY_STEEL',
      rawMaterial: {
        stockForm: 'ROUND_BAR',
        dimensions: { diameter: { value: 65, unit: 'mm' }, length: { value: 320, unit: 'mm' } },
      },
      dimensions: {
        rawStockDiameter: '65 mm',
        overallLength: '320 mm',
        bearingSeatTolerance: 'h6',
      },
      description:
        'Stepped transmission shaft carrying torsional load through keyway and supported on precision bearing journals. ' +
        'Features: 2 bearing journals (h6 precision fit required), torque transmission keyway, single-point retention external thread, ' +
        'circlip grooves for axial retention, and radial oil-feed lubrication holes. Material is AISI 4140 alloy steel, requires through-hardening ' +
        'with allowance retained for post-heat-treatment cylindrical OD grinding.',
      inputSources: {
        userDescription: 'Canonical Stepped Gearbox Shaft scenario (Ground Truth)',
      },
    };
  }

  private async buildOntologyContext(): Promise<Record<string, any>> {
    try {
      const machines = await this.machineModel.find().select('instanceLabel machineCategory supportedProcessFamilies').lean().exec();
      const tools = await this.toolModel.find().select('toolCategory toolMaterial compatibleProcessFamilies limitations').lean().exec();
      const ht = await this.htModel.find().select('heatTreatmentType compatibleMaterialFamilies expectedDistortionRisk').lean().exec();

      return {
        availableMachineCategories: machines.map((m) => ({
          label: m.instanceLabel || m.machineCategory,
          category: m.machineCategory,
          supportedProcesses: m.supportedProcessFamilies,
        })),
        availableCuttingToolCategories: tools.map((t) => ({
          category: t.toolCategory,
          material: t.toolMaterial,
          compatibleProcesses: t.compatibleProcessFamilies,
        })),
        heatTreatmentCapabilities: ht.map((h) => ({
          type: h.heatTreatmentType,
          compatibleMaterials: h.compatibleMaterialFamilies,
          distortionRisk: h.expectedDistortionRisk,
        })),
      };
    } catch (e) {
      this.logger.warn(`Could not load full ontology DB context: ${e.message}`);
      return {
        defaultMachineCapabilities: ['LATHE', 'MACHINING_CENTER', 'GRINDING_MACHINE', 'HEAT_TREATMENT_FURNACE'],
        defaultToolCapabilities: ['TURNING_INSERT', 'DRILL', 'MILLING_CUTTER', 'THREADING_TOOL', 'GRINDING_WHEEL'],
      };
    }
  }

  private async buildCanonicalReferenceSummary(): Promise<string> {
    try {
      const part = await this.partModel.findOne({ partName: 'Stepped Gearbox Shaft' }).exec();
      if (!part) {
        return this.getHardcodedCanonicalSummary();
      }

      const setups = await this.setupModel.find({ partId: part._id }).sort({ setupSequencePlaceholder: 1 }).lean().exec();
      const operations = await this.operationModel.find({ partId: part._id }).sort({ sequenceOrder: 1 }).lean().exec();

      let summary = `PART: Stepped Gearbox Shaft (AISI 4140, Ø65x320mm Bar)\n`;
      summary += `CANONICAL SETUPS & OPERATIONS PATTERN:\n`;

      for (const s of setups) {
        summary += `\n- ${s.setupName} (${s.machineRequirement || 'MACHINE'}, Workholding: ${s.clampingStrategy || 'STANDARD'}):\n`;
        const setupOps = operations.filter((op) => String(op.setupId) === String(s._id));
        for (const op of setupOps) {
          summary += `  * Op ${op.sequenceOrder}: ${op.operationName} [${op.processFamily} / ${op.processStage}] (${op.inputManufacturingStateId || 'IN'} -> ${op.outputManufacturingStateId || 'OUT'})\n`;
        }
      }

      summary += `\nKEY RELATIONSHIPS:\n- Rough & Semi-finish leave allowance for heat treatment distortion\n- Secondary features (keyway, oil holes) machined before thermal processing\n- Post-heat treatment distortion resolved by cylindrical OD grinding to h6 specification`;
      return summary;
    } catch (e) {
      return this.getHardcodedCanonicalSummary();
    }
  }

  private getHardcodedCanonicalSummary(): string {
    return `CANONICAL PATTERN (Stepped Gearbox Shaft):
SETUP 1: CNC Lathe (3-jaw chuck + live center) -> Face, Center Drill, Rough Turn OD, Semi-Finish Journals, Part-off
SETUP 2: CNC Lathe Flipped (soft jaws + live center) -> Face to length, Finish Turn steps, Cut Circlip Grooves, Single-Point Thread
SETUP 3: 4-Axis VMC (Indexing rotary chuck) -> Mill keyway, Drill radial oil-feed lubrication holes
SETUP HT: Heat Treatment Furnace -> Through-hardening thermal processing (causes distortion risk)
SETUP 4: Cylindrical Grinder (between centers) -> Cylindrical OD grind bearing journal to h6 tolerance specification`;
  }
}
