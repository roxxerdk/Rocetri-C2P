import { HttpException, HttpStatus } from '@nestjs/common';

export class WorkflowTransitionError extends HttpException {
  constructor(currentStage: string, operation: string) {
    super(
      {
        error: 'WorkflowTransitionError',
        message: `Operation '${operation}' is not allowed from stage '${currentStage}'`,
        details: { currentStage, operation },
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class WorkflowDependencyError extends HttpException {
  constructor(message: string) {
    super(
      {
        error: 'WorkflowDependencyError',
        message,
      },
      HttpStatus.PRECONDITION_FAILED,
    );
  }
}
