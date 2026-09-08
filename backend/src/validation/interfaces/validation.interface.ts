/**
 * Result of a validation operation.
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

/**
 * Interface for schema-level validation of AI outputs.
 */
export interface ISchemaValidator {
  validateSchema(data: any, schemaType: string): ValidationResult;
}

/**
 * Interface for business/engineering rule validation.
 */
export interface IBusinessValidator {
  validateBusinessRules(data: any, ruleSet: string): ValidationResult;
}

/**
 * Interface for result-level validation (final output checks).
 */
export interface IResultValidator {
  validateResult(data: any, expectedType: string): ValidationResult;
}
