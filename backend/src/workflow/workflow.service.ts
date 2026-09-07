import { Injectable, Logger } from '@nestjs/common';
import { WorkflowStage } from '../shared/enums';
import {
  WorkflowOperation,
  WORKFLOW_TRANSITIONS,
  OPERATION_RESULT_STAGE,
  INVALIDATION_DOWNSTREAM,
} from './workflow.types';
import { WorkflowTransitionError } from './workflow.errors';

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  /**
   * Validates whether an operation is allowed from the current workflow stage.
   * Throws WorkflowTransitionError if not allowed.
   */
  validateTransition(currentStage: WorkflowStage | string, operation: WorkflowOperation): void {
    const stage = currentStage as WorkflowStage;
    const allowed = WORKFLOW_TRANSITIONS[stage] || [];

    if (!allowed.includes(operation)) {
      throw new WorkflowTransitionError(stage, operation);
    }

    this.logger.log(`Transition validated: ${stage} → ${operation}`);
  }

  /**
   * Returns the workflow stage that results from completing an operation.
   */
  getResultStage(operation: WorkflowOperation): WorkflowStage {
    return OPERATION_RESULT_STAGE[operation];
  }

  /**
   * Determines which downstream stages should be invalidated when
   * a new output is created at the given stage.
   *
   * This is a structural method — actual DB invalidation is performed
   * by the calling service using these results.
   */
  getDownstreamInvalidations(stage: string): WorkflowStage[] {
    return INVALIDATION_DOWNSTREAM[stage] || [];
  }

  /**
   * Placeholder for downstream invalidation.
   * Feature services should call this after state changes.
   * Actual DB updates will be performed by the calling service.
   */
  invalidateDownstream(projectId: string, newStage: string): void {
    const toInvalidate = this.getDownstreamInvalidations(newStage);
    if (toInvalidate.length > 0) {
      this.logger.log(
        `Project ${projectId}: Stage ${newStage} reached — marking downstream as OUTDATED: ${toInvalidate.join(', ')}`,
      );
    }
    // TODO: Actual invalidation will be implemented when feature services
    // have full database update logic
  }
}
