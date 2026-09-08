import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../../ai/ai.service';
import {
  GeometryType,
  FunctionalRole,
  RequirementType,
  MaterialFamily,
} from '../ontology/enums';
import {
  PartPlanningInput,
  FeatureInterpretationResult,
  IdentifiedFeature,
  IdentifiedRequirement,
} from './dto/demo-planning.dto';

@Injectable()
export class AiInterpretationService {
  private readonly logger = new Logger(AiInterpretationService.name);

  constructor(private readonly aiService: AiService) {}

  async interpretFeatures(input: PartPlanningInput): Promise<FeatureInterpretationResult> {
    this.logger.log(`Interpreting features for part: ${input.partName || 'Unnamed Part'}`);

    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(input);

    const response = await this.aiService.generate('claude', {
      systemPrompt,
      prompt: userPrompt,
      temperature: 0.1,
      maxTokens: 1400,
      responseFormat: 'json',
    });

    return this.parseAndValidateResponse(response.content);
  }

  private buildSystemPrompt(): string {
    const validGeometryTypes = Object.values(GeometryType).join(', ');
    const validFunctionalRoles = Object.values(FunctionalRole).join(', ');
    const validRequirementTypes = Object.values(RequirementType).join(', ');
    const validMaterialFamilies = Object.values(MaterialFamily).join(', ');

    return `You are a manufacturing feature recognition and engineering context expert for the C2P Process Planning Engine.
Your task is to analyze a CAD part description and identify manufacturing features and engineering requirements using only controlled ontology vocabularies.

CRITICAL RULES:
1. Do NOT invent numeric dimensions if not explicitly provided in the input.
2. Do NOT invent tolerance values (e.g. ±0.01mm) if not specified.
3. Do NOT assume machine specifications or tooling.
4. Do NOT silently assume missing engineering information.
5. If information is uncertain, record it in "assumptions" or "unknownInformation".
6. Every identified feature must use an exact geometryType and functionalRole from the controlled lists below.
7. Every identified requirement must use an exact requirementType from the controlled list.

CONTROLLED ONTOLOGY ENUMS:
- GeometryType: [${validGeometryTypes}]
- FunctionalRole: [${validFunctionalRoles}]
- RequirementType: [${validRequirementTypes}]
- MaterialFamily: [${validMaterialFamilies}]

REQUIRED JSON OUTPUT FORMAT:
You must respond with ONLY a valid JSON object (no introductory text, no markdown outside of standard JSON):
{
  "identifiedFeatures": [
    {
      "geometryType": "STRING (from GeometryType enum)",
      "functionalRole": "STRING (from FunctionalRole enum)",
      "description": "STRING",
      "confidence": NUMBER (0.0 to 1.0),
      "source": "STRING (e.g. user_description, uploaded_file, extracted_text)"
    }
  ],
  "identifiedRequirements": [
    {
      "requirementType": "STRING (from RequirementType enum)",
      "toleranceClass": "STRING or null (e.g. 'h6', '6g', or null)",
      "description": "STRING"
    }
  ],
  "assumptions": [
    "STRING explanation of any engineering assumption made"
  ],
  "unknownInformation": [
    "STRING missing information that would normally be needed for precise machining"
  ]
}`;
  }

  private buildUserPrompt(input: PartPlanningInput): string {
    return `Analyze the following part planning input and extract the manufacturing features and requirements:

${JSON.stringify(input, null, 2)}

Respond with the exact JSON structure specified.`;
  }

  private parseAndValidateResponse(rawText: string): FeatureInterpretationResult {
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
      this.logger.error(`Failed to parse AI JSON response: ${cleanJson}`);
      throw new Error(`AI returned invalid JSON response for feature interpretation: ${err.message}`);
    }

    const validGeometries = new Set(Object.values(GeometryType));
    const validRoles = new Set(Object.values(FunctionalRole));
    const validReqTypes = new Set(Object.values(RequirementType));

    const identifiedFeatures: IdentifiedFeature[] = (parsed.identifiedFeatures || []).map((f: any) => ({
      geometryType: validGeometries.has(f.geometryType) ? f.geometryType : GeometryType.UNKNOWN,
      functionalRole: validRoles.has(f.functionalRole) ? f.functionalRole : FunctionalRole.UNKNOWN,
      description: String(f.description || ''),
      confidence: typeof f.confidence === 'number' ? Math.max(0, Math.min(1, f.confidence)) : 0.8,
      source: String(f.source || 'user_description'),
    }));

    const identifiedRequirements: IdentifiedRequirement[] = (parsed.identifiedRequirements || []).map((r: any) => ({
      requirementType: validReqTypes.has(r.requirementType) ? r.requirementType : RequirementType.UNKNOWN,
      toleranceClass: r.toleranceClass ? String(r.toleranceClass) : null,
      description: String(r.description || ''),
    }));

    const assumptions: string[] = Array.isArray(parsed.assumptions)
      ? parsed.assumptions.map(String)
      : [];

    const unknownInformation: string[] = Array.isArray(parsed.unknownInformation)
      ? parsed.unknownInformation.map(String)
      : [];

    return {
      identifiedFeatures,
      identifiedRequirements,
      assumptions,
      unknownInformation,
    };
  }
}
