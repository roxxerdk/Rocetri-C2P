import { Injectable } from '@nestjs/common';
import { FeasibilityStatus, SelectionStatus } from '../ontology/enums';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

@Injectable()
export class OntologyValidationService {

  // Rule 1: Feature must have a partId
  validateFeatureBelongsToPart(featurePartId: any, partId: any): ValidationResult {
    const errors: string[] = [];
    if (!featurePartId || featurePartId.toString() !== partId.toString()) {
      errors.push('Feature must belong to the specified Part.');
    }
    return { valid: errors.length === 0, errors };
  }

  // Rule 2: FeatureRequirement must reference a valid Feature
  validateRequirementHasFeature(featureId: any): ValidationResult {
    const errors: string[] = [];
    if (!featureId) errors.push('FeatureRequirement must reference a valid Feature ID.');
    return { valid: errors.length === 0, errors };
  }

  // Rule 3: Datum sourceFeature must belong to same Part
  validateDatumFeatureSamePart(datumPartId: any, featurePartId: any): ValidationResult {
    const errors: string[] = [];
    if (featurePartId && datumPartId.toString() !== featurePartId.toString()) {
      errors.push('Datum source Feature must belong to the same Part as the Datum.');
    }
    return { valid: errors.length === 0, errors };
  }

  // Rule 4: Operation target Features must belong to same Part
  validateOperationFeaturesSamePart(operationPartId: any, featurePartIds: any[]): ValidationResult {
    const errors: string[] = [];
    for (const fPartId of featurePartIds) {
      if (fPartId && fPartId.toString() !== operationPartId.toString()) {
        errors.push(`Operation target Feature (partId: ${fPartId}) does not belong to the Operation's Part.`);
      }
    }
    return { valid: errors.length === 0, errors };
  }

  // Rule 5: Operation must belong to one valid Setup
  validateOperationHasSetup(setupId: any): ValidationResult {
    const errors: string[] = [];
    if (!setupId) errors.push('Operation must be assigned to a valid Setup.');
    return { valid: errors.length === 0, errors };
  }

  // Rule 6: Setup input/output states must belong to same Part
  validateSetupStatesSamePart(setupPartId: any, inputStatePartId: any, outputStatePartId: any): ValidationResult {
    const errors: string[] = [];
    if (inputStatePartId && inputStatePartId.toString() !== setupPartId.toString()) {
      errors.push('Setup inputManufacturingState must belong to the same Part.');
    }
    if (outputStatePartId && outputStatePartId.toString() !== setupPartId.toString()) {
      errors.push('Setup outputManufacturingState must belong to the same Part.');
    }
    return { valid: errors.length === 0, errors };
  }

  // Rule 7: Operation input/output states must belong to same Part
  validateOperationStatesSamePart(operationPartId: any, inputStatePartId: any, outputStatePartId: any): ValidationResult {
    const errors: string[] = [];
    if (inputStatePartId && inputStatePartId.toString() !== operationPartId.toString()) {
      errors.push('Operation inputManufacturingState must belong to the same Part.');
    }
    if (outputStatePartId && outputStatePartId.toString() !== operationPartId.toString()) {
      errors.push('Operation outputManufacturingState must belong to the same Part.');
    }
    return { valid: errors.length === 0, errors };
  }

  // Rule 8: WorkholdingConfiguration must reference a valid primary locator
  validateWorkholdingConfiguration(primaryLocatorId: any): ValidationResult {
    const errors: string[] = [];
    if (!primaryLocatorId) errors.push('WorkholdingConfiguration must reference a valid primary locator resource.');
    return { valid: errors.length === 0, errors };
  }

  // Rule 9: MeasurementMethod must support the requirement type it verifies
  validateMeasurementMethodSupportsRequirement(
    methodMeasurableTypes: string[],
    requirementType: string,
  ): ValidationResult {
    const errors: string[] = [];
    if (methodMeasurableTypes.length > 0 && !methodMeasurableTypes.includes(requirementType)) {
      errors.push(`MeasurementMethod does not support requirement type: ${requirementType}.`);
    }
    return { valid: errors.length === 0, errors };
  }

  // Rule 10: HeatTreatment compatibility against material family
  validateHeatTreatmentCompatibility(
    compatibleFamilies: string[],
    materialFamily: string,
  ): ValidationResult {
    const errors: string[] = [];
    if (compatibleFamilies.length > 0 && !compatibleFamilies.includes(materialFamily)) {
      errors.push(`HeatTreatment is not compatible with material family: ${materialFamily}.`);
    }
    return { valid: errors.length === 0, errors };
  }

  // Rule 11: Numeric values require units
  validateNumericWithUnit(obj: any, fieldName: string): ValidationResult {
    const errors: string[] = [];
    if (obj !== null && obj !== undefined) {
      if (typeof obj.value !== 'number') errors.push(`${fieldName}.value must be a number.`);
      if (!obj.unit || typeof obj.unit !== 'string') errors.push(`${fieldName}.unit is required when a numeric value is present.`);
    }
    return { valid: errors.length === 0, errors };
  }

  // Rule 12: lower_limit <= upper_limit
  validateLimits(lower: any, upper: any): ValidationResult {
    const errors: string[] = [];
    if (lower !== null && upper !== null && lower.value !== undefined && upper.value !== undefined) {
      if (lower.value > upper.value) {
        errors.push(`lower_limit (${lower.value}) must be <= upper_limit (${upper.value}).`);
      }
    }
    return { valid: errors.length === 0, errors };
  }

  // Rule 13: MachiningAllowance must reference valid Feature and State
  validateMachiningAllowance(featureId: any, stateId: any): ValidationResult {
    const errors: string[] = [];
    if (!featureId) errors.push('MachiningAllowance must reference a valid Feature.');
    if (!stateId) errors.push('MachiningAllowance must reference a valid ManufacturingState.');
    return { valid: errors.length === 0, errors };
  }

  // Rule 14: OperationDependency must reference valid Operations
  validateOperationDependency(sourceId: any, targetId: any): ValidationResult {
    const errors: string[] = [];
    if (!sourceId) errors.push('OperationDependency must reference a valid source Operation.');
    if (!targetId) errors.push('OperationDependency must reference a valid target Operation.');
    if (sourceId && targetId && sourceId.toString() === targetId.toString()) {
      errors.push('OperationDependency source and target cannot be the same Operation.');
    }
    return { valid: errors.length === 0, errors };
  }

  // Rule 15: InspectionCheckpoint must reference valid Features or Requirements
  validateInspectionCheckpoint(featureIds: any[], requirementIds: any[]): ValidationResult {
    const errors: string[] = [];
    if (featureIds.length === 0 && requirementIds.length === 0) {
      errors.push('InspectionCheckpoint must reference at least one Feature or Requirement.');
    }
    return { valid: errors.length === 0, errors };
  }

  // Rule 16: SELECTED ProcessOption cannot be NOT_FEASIBLE
  validateProcessOptionSelection(
    selectionStatus: SelectionStatus,
    feasibilityStatus: FeasibilityStatus,
  ): ValidationResult {
    const errors: string[] = [];
    if (selectionStatus === SelectionStatus.SELECTED && feasibilityStatus === FeasibilityStatus.NOT_FEASIBLE) {
      errors.push('A SELECTED ProcessOption cannot have feasibilityStatus NOT_FEASIBLE.');
    }
    return { valid: errors.length === 0, errors };
  }

  // Rule 17: UNKNOWN must not trigger automatic engineering assumptions
  validateNoUnknownAssumption(fields: Record<string, any>): ValidationResult {
    const errors: string[] = [];
    for (const [key, val] of Object.entries(fields)) {
      if (val === 'UNKNOWN' || val === 'NOT_YET_DEFINED') {
        // Flag for external awareness â€” do not auto-infer
        errors.push(`Field '${key}' is ${val}. Do not make automatic engineering assumptions about this value.`);
      }
    }
    // This is an informational check â€” always returns valid: true (warnings only)
    return { valid: true, errors };
  }

  /** Convenience: run all structural validations for a FeatureRequirement */
  validateFeatureRequirement(data: {
    featureId: any;
    partId: any;
    lowerLimit: any;
    upperLimit: any;
    nominalValue: any;
  }): ValidationResult {
    const errors: string[] = [];
    const r2 = this.validateRequirementHasFeature(data.featureId);
    errors.push(...r2.errors);
    const r11 = this.validateNumericWithUnit(data.nominalValue, 'nominalValue');
    errors.push(...r11.errors);
    const r12 = this.validateLimits(data.lowerLimit, data.upperLimit);
    errors.push(...r12.errors);
    return { valid: errors.length === 0, errors };
  }

  // Rule 18: Machine must declare at least one supported process family
  validateMachineCapabilityDeclared(supportedProcessFamilies: string[]): ValidationResult {
    const errors: string[] = [];
    if (!supportedProcessFamilies || supportedProcessFamilies.length === 0) {
      errors.push('OntMachine must declare at least one supported process family.');
    }
    return { valid: errors.length === 0, errors };
  }

  // Rule 19: CuttingTool must declare at least one compatible process family and material family
  validateCuttingToolCompatibilityDeclared(
    compatibleProcessFamilies: string[],
    compatibleMaterialFamilies: string[],
  ): ValidationResult {
    const errors: string[] = [];
    if (!compatibleProcessFamilies || compatibleProcessFamilies.length === 0) {
      errors.push('OntCuttingTool must declare at least one compatible process family.');
    }
    if (!compatibleMaterialFamilies || compatibleMaterialFamilies.length === 0) {
      errors.push('OntCuttingTool must declare at least one compatible material family.');
    }
    return { valid: errors.length === 0, errors };
  }
}
