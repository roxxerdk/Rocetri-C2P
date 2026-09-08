import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../../ai/ai.service';
import {
  ProcessFamily,
  ProcessStage,
  ManufacturingStateLabel,
  MachineCategory,
  WorkholdingType,
  ToolCategory,
} from '../ontology/enums';
import {
  PartPlanningInput,
  FeatureInterpretationResult,
  StructuredProcessPlan,
  SetupPlan,
  OperationPlan,
} from './dto/demo-planning.dto';

@Injectable()
export class AiPlanningService {
  private readonly logger = new Logger(AiPlanningService.name);

  constructor(private readonly aiService: AiService) {}

  async generateProcessPlan(
    partInput: PartPlanningInput,
    interpretation: FeatureInterpretationResult,
    canonicalReference: string,
    ontologyContext: Record<string, any>,
  ): Promise<StructuredProcessPlan> {
    this.logger.log(`Generating process plan for part: ${partInput.partName || 'Unnamed'}`);

    // Call 1: create only the manufacturing architecture. This keeps the
    // canonical reference and ontology vocabulary out of the larger operation calls.
    const architecture = await this.generateArchitecture(
      partInput,
      interpretation,
      canonicalReference,
      ontologyContext,
    );

    // Calls 2..N: each setup is independent, so operation planning runs in parallel.
    const setupPlans = await Promise.all(
      architecture.setups.map((setup) => this.generateSetupOperations(partInput, interpretation, setup)),
    );

    return this.parseAndValidateResponse(JSON.stringify({
      ...architecture,
      setups: architecture.setups.map((setup, index) => ({
        ...setup,
        operations: setupPlans[index],
      })),
    }));
  }

  private async generateArchitecture(
    partInput: PartPlanningInput,
    interpretation: FeatureInterpretationResult,
    canonicalReference: string,
    ontologyContext: Record<string, any>,
  ): Promise<any> {
    const validMachineCategories = Object.values(MachineCategory).join(', ');
    const validWorkholding = Object.values(WorkholdingType).join(', ');

    const response = await this.aiService.generate('claude', {
      systemPrompt: `You are a manufacturing process architect. Design only the high-level setup sequence for the supplied part.
Use the canonical reference as a pattern, not as copied truth. Do not invent dimensions, tolerances, feeds, speeds, costs, or cycle times.
Use only these machine categories: [${validMachineCategories}].
Use only these workholding types: [${validWorkholding}].
    Return at most 5 setups. Keep planningSummary under 30 words, setupPurpose and every notes field under 18 words. Do not include labels, requiredProcesses, dimensions, or long explanations inside setup objects.
Return ONLY JSON in this compact shape:
{
  "planningSummary": "...",
  "manufacturingStates": ["RAW", "ROUGH_MACHINED", "SEMI_FINISHED", "PRECISION_FINISHED"],
  "setups": [{ "sequence": 1, "setupPurpose": "...", "machineRequirement": {}, "workholdingRequirement": {} }],
  "heatTreatment": [], "qualityCheckpoints": [], "assumptions": [], "warnings": [], "unknownInformation": []
}

ONTOLOGY RESOURCE:\n${JSON.stringify(ontologyContext)}
CANONICAL REFERENCE:\n${canonicalReference}`,
      prompt: JSON.stringify({ partInput, interpretation }),
      temperature: 0.1,
      maxTokens: 2200,
      responseFormat: 'json',
    });

    return this.parseJson(response.content, 'process architecture');
  }

  private async generateSetupOperations(
    partInput: PartPlanningInput,
    interpretation: FeatureInterpretationResult,
    setup: Record<string, any>,
  ): Promise<OperationPlan[]> {
    const validProcessFamilies = Object.values(ProcessFamily).join(', ');
    const validProcessStages = Object.values(ProcessStage).join(', ');
    const validToolCategories = Object.values(ToolCategory).join(', ');

    const response = await this.aiService.generate('claude', {
      systemPrompt: `You are a manufacturing operation planner. Fill operations for ONE setup only.
Use only processFamily values [${validProcessFamilies}] and processStage values [${validProcessStages}].
Use only tool categories [${validToolCategories}]. Do not invent numeric values or calculate feeds, speeds, cost, or cycle time.
Return no more than 6 operations. Keep operationName under 6 words, targetFeatures to short labels, toolRequirement to category/material only, measurementRequirement to instrument/tolerance only, and reason under 15 words. Do not include notes, descriptions, checkpoints, methods, or long explanations.
Return ONLY a JSON array:
[{ "sequence": 1, "operationName": "...", "processFamily": "...", "processStage": "...", "targetFeatures": [], "inputState": "RAW", "outputState": "...", "toolRequirement": {}, "measurementRequirement": {}, "reason": "..." }]`,
      prompt: JSON.stringify({
        part: {
          partName: partInput.partName,
          material: partInput.material,
          dimensions: partInput.dimensions,
          description: partInput.description,
        },
        interpretation,
        setup,
      }),
      temperature: 0.1,
      maxTokens: 1800,
      responseFormat: 'json',
    });

    const parsed = this.parseJson(response.content, `setup ${setup.sequence} operations`);
    return Array.isArray(parsed) ? parsed : parsed.operations || [];
  }

  private parseJson(rawText: string, stage: string): any {
    const cleanJson = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();
    try {
      return JSON.parse(cleanJson);
    } catch (error) {
      this.logger.error(`Failed to parse ${stage} JSON: ${cleanJson}`);
      throw new Error(`AI returned invalid JSON for ${stage}: ${error.message}`);
    }
  }

  private buildSystemPrompt(canonicalReference: string, ontologyContext: Record<string, any>): string {
    const validProcessFamilies = Object.values(ProcessFamily).join(', ');
    const validProcessStages = Object.values(ProcessStage).join(', ');
    const validStateLabels = Object.values(ManufacturingStateLabel).join(', ');
    const validMachineCategories = Object.values(MachineCategory).join(', ');
    const validWorkholding = Object.values(WorkholdingType).join(', ');
    const validToolCategories = Object.values(ToolCategory).join(', ');

    return `You are a manufacturing process planning AI engineer for the C2P (CAD-to-Process) platform.
Your objective is to generate a comprehensive, structured manufacturing process plan based on interpreted features and engineering requirements.

CRITICAL CONSTRAINTS:
1. USE ONLY valid ontology enum values:
   - processFamily: [${validProcessFamilies}]
   - processStage: [${validProcessStages}]
   - manufacturingState labels: [${validStateLabels}]
   - machineRequirement category: [${validMachineCategories}]
   - workholdingRequirement type: [${validWorkholding}]
   - toolRequirement category: [${validToolCategories}]
2. Machine capability must be represented as REQUIREMENTS (e.g. { "category": "LATHE", "axisCount": 2 }), NOT specific vendor models or machine selection.
3. Tools must be represented as REQUIREMENTS (e.g. { "category": "TURNING_INSERT", "material": "CARBIDE" }), NOT catalog numbers.
4. Workholding must be represented as REQUIREMENTS (e.g. { "type": "THREE_JAW_CHUCK", "strategy": "CHUCK_AND_CENTER" }).
5. Do NOT calculate feeds, speeds, tool life, cost, or cycle time.
6. The canonical reference provided below is a REFERENCE PATTERN showing structural relationships and setups. Do NOT blindly copy operations unless the part has matching geometry/requirements.
7. Any uncertain information must be stated in "assumptions", "warnings", or "unknownInformation".

ONTOLOGY RESOURCE VOCABULARY & ENVIRONMENT CONTEXT:
${JSON.stringify(ontologyContext, null, 2)}

REFERENCE MANUFACTURING PATTERN (CANONICAL SHAFT EXAMPLE):
${canonicalReference}

REQUIRED JSON OUTPUT FORMAT:
Respond with ONLY valid JSON with this exact schema:
{
  "planningSummary": "STRING summarizing the overall manufacturing strategy",
  "manufacturingStates": [
    "RAW",
    "ROUGH_MACHINED",
    "SEMI_FINISHED",
    "HEAT_TREATED (if applicable)",
    "PRECISION_FINISHED"
  ],
  "setups": [
    {
      "sequence": 1,
      "setupPurpose": "STRING (e.g. CNC Lathe First Orientation - Face, Center, Rough & Semi-Finish)",
      "machineRequirement": {
        "category": "STRING (from MachineCategory enum)",
        "minAxes": 2,
        "notes": "STRING"
      },
      "workholdingRequirement": {
        "type": "STRING (from WorkholdingType enum)",
        "strategy": "STRING (e.g. 3-jaw chuck with live center)"
      },
      "operations": [
        {
          "sequence": 1,
          "operationName": "STRING",
          "processFamily": "STRING (from ProcessFamily enum)",
          "processStage": "STRING (from ProcessStage enum)",
          "targetFeatures": ["STRING names of features targeted"],
          "inputState": "STRING (from manufacturingStates)",
          "outputState": "STRING (from manufacturingStates)",
          "toolRequirement": {
            "category": "STRING (from ToolCategory enum)",
            "material": "STRING (e.g. CARBIDE, HSS)",
            "coating": "STRING or null"
          },
          "measurementRequirement": {
            "postOperation": true,
            "instrument": "STRING (e.g. MICROMETER, CALIPER, CMM)",
            "tolerance": "STRING or null"
          },
          "reason": "STRING engineering justification for this operation in this sequence"
        }
      ]
    }
  ],
  "heatTreatment": [
    {
      "type": "STRING (e.g. THROUGH_HARDENING, CASE_HARDENING, STRESS_RELIEF)",
      "targetFeatures": ["STRING"],
      "expectedHardness": "STRING or null",
      "distortionRisk": "STRING (LOW, MEDIUM, HIGH)",
      "timing": "STRING (between which states/setups)"
    }
  ],
  "qualityCheckpoints": [
    {
      "triggerStage": "STRING (e.g. POST_HEAT_TREATMENT, FINAL_INSPECTION)",
      "targetFeatures": ["STRING"],
      "inspectionMethod": "STRING",
      "acceptanceCriteria": "STRING",
      "failureAction": "HOLD or REWORK"
    }
  ],
  "assumptions": ["STRING"],
  "warnings": ["STRING warnings about tolerances, distortion, or critical tolerances"],
  "unknownInformation": ["STRING missing drawing information needed for production"]
}`;
  }

  private buildUserPrompt(
    partInput: PartPlanningInput,
    interpretation: FeatureInterpretationResult,
  ): string {
    return `Generate a comprehensive manufacturing process plan for the following part:

PART INPUT DATA:
${JSON.stringify(partInput, null, 2)}

IDENTIFIED FEATURES & REQUIREMENTS:
${JSON.stringify(interpretation, null, 2)}

Create an optimal setup sequence and operations schedule adhering strictly to the JSON schema.`;
  }

  private parseAndValidateResponse(rawText: string): StructuredProcessPlan {
    let cleanJson = rawText.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (err) {
      this.logger.error(`Failed to parse process plan JSON: ${cleanJson}`);
      throw new Error(`AI returned invalid JSON response for process planning: ${err.message}`);
    }

    const validProcessFamilies = new Set(Object.values(ProcessFamily));
    const validProcessStages = new Set(Object.values(ProcessStage));

    const setups: SetupPlan[] = (parsed.setups || []).map((s: any, sIdx: number) => {
      const operations: OperationPlan[] = (s.operations || []).map((op: any, oIdx: number) => {
        let pFamily = String(op.processFamily || '').toUpperCase();
        if (!validProcessFamilies.has(pFamily as ProcessFamily)) {
          pFamily = ProcessFamily.CUSTOM;
        }

        let pStage = String(op.processStage || '').toUpperCase();
        if (!validProcessStages.has(pStage as ProcessStage)) {
          pStage = ProcessStage.CUSTOM;
        }

        return {
          sequence: typeof op.sequence === 'number' ? op.sequence : oIdx + 1,
          operationName: String(op.operationName || `Operation ${oIdx + 1}`),
          processFamily: pFamily,
          processStage: pStage,
          targetFeatures: Array.isArray(op.targetFeatures) ? op.targetFeatures.map(String) : [],
          inputState: String(op.inputState || 'RAW'),
          outputState: String(op.outputState || 'FINISHED'),
          toolRequirement: typeof op.toolRequirement === 'object' && op.toolRequirement !== null ? op.toolRequirement : {},
          measurementRequirement: typeof op.measurementRequirement === 'object' && op.measurementRequirement !== null ? op.measurementRequirement : {},
          reason: String(op.reason || ''),
        };
      });

      return {
        sequence: typeof s.sequence === 'number' ? s.sequence : sIdx + 1,
        setupPurpose: String(s.setupPurpose || `Setup ${sIdx + 1}`),
        machineRequirement: typeof s.machineRequirement === 'object' && s.machineRequirement !== null ? s.machineRequirement : {},
        workholdingRequirement: typeof s.workholdingRequirement === 'object' && s.workholdingRequirement !== null ? s.workholdingRequirement : {},
        operations,
      };
    });

    return {
      planningSummary: String(parsed.planningSummary || 'Process plan generated successfully.'),
      manufacturingStates: Array.isArray(parsed.manufacturingStates) ? parsed.manufacturingStates.map(String) : [],
      setups,
      heatTreatment: Array.isArray(parsed.heatTreatment) ? parsed.heatTreatment : [],
      qualityCheckpoints: Array.isArray(parsed.qualityCheckpoints) ? parsed.qualityCheckpoints : [],
      assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions.map(String) : [],
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings.map(String) : [],
      unknownInformation: Array.isArray(parsed.unknownInformation) ? parsed.unknownInformation.map(String) : [],
    };
  }
}
