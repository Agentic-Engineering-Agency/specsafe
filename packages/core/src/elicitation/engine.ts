/**
 * Elicitation Engine
 * Manages interactive specification elicitation workflows
 */

import type {
  ElicitationFlow,
  ElicitationStep,
  ElicitationResult,
} from './types.js';

/**
 * Engine for running elicitation flows
 * 
 * @example
 * ```typescript
 * const engine = new ElicitationEngine(quickFlow);
 * const firstStep = engine.start();
 * 
 * while (!engine.isComplete()) {
 *   const current = engine.getCurrentStep();
 *   const userAnswer = await getUserInput(current);
 *   const nextStep = engine.answer(current.id, userAnswer);
 * }
 * 
 * const result = engine.getResult();
 * ```
 */
export class ElicitationEngine {
  private flow: ElicitationFlow;
  private answers: Record<string, any> = {};
  private skipped: string[] = [];
  private currentIndex: number = -1;
  private startedAt: Date | null = null;
  private completedAt: Date | null = null;

  /**
   * Create a new elicitation engine
   * @param flow The elicitation flow to execute
   */
  constructor(flow: ElicitationFlow) {
    this.flow = flow;
  }

  /**
   * Start the elicitation flow
   * @returns The first step to present to the user, or null if no valid steps
   */
  start(): ElicitationStep | null {
    this.startedAt = new Date();
    this.currentIndex = 0;
    return this.getNextValidStep(0);
  }

  /**
   * Record an answer and move to the next step
   * @param stepId The step ID being answered
   * @param value The user's answer
   * @returns The next step, or null if flow is complete
   */
  answer(stepId: string, value: any): ElicitationStep | null {
    const step = this.flow.steps.find(s => s.id === stepId);
    if (!step) {
      throw new Error(`Step not found: ${stepId}`);
    }

    // Validate required fields
    if (step.required && (value === null || value === undefined || value === '')) {
      throw new Error(`Step '${stepId}' is required`);
    }

    // Run custom validation if present
    if (step.validate) {
      const validationResult = step.validate(value);
      if (validationResult !== true) {
        const errorMessage = typeof validationResult === 'string' 
          ? validationResult 
          : `Validation failed for step '${stepId}'`;
        throw new Error(errorMessage);
      }
    }

    // Store the answer
    this.answers[stepId] = value;

    // Move to next step
    const currentStepIndex = this.flow.steps.findIndex(s => s.id === stepId);
    if (currentStepIndex === -1) {
      throw new Error(`Step not found in flow: ${stepId}`);
    }

    this.currentIndex = currentStepIndex + 1;

    // Check if we've completed all steps
    if (this.currentIndex >= this.flow.steps.length) {
      this.completedAt = new Date();
      return null;
    }

    return this.getNextValidStep(this.currentIndex);
  }

  /**
   * Skip a step (only allowed if not required)
   * @param stepId The step ID to skip
   * @returns The next step, or null if flow is complete
   */
  skip(stepId: string): ElicitationStep | null {
    const step = this.flow.steps.find(s => s.id === stepId);
    if (!step) {
      throw new Error(`Step not found: ${stepId}`);
    }

    if (step.required) {
      throw new Error(`Cannot skip required step: ${stepId}`);
    }

    // Mark as skipped
    this.skipped.push(stepId);

    // Move to next step
    const currentStepIndex = this.flow.steps.findIndex(s => s.id === stepId);
    if (currentStepIndex === -1) {
      throw new Error(`Step not found in flow: ${stepId}`);
    }

    this.currentIndex = currentStepIndex + 1;

    // Check if we've completed all steps
    if (this.currentIndex >= this.flow.steps.length) {
      this.completedAt = new Date();
      return null;
    }

    return this.getNextValidStep(this.currentIndex);
  }

  /**
   * Get the current step
   * @returns The current step, or null if not started or completed
   */
  getCurrentStep(): ElicitationStep | null {
    if (this.currentIndex < 0 || this.currentIndex >= this.flow.steps.length) {
      return null;
    }
    return this.flow.steps[this.currentIndex];
  }

  /**
   * Check if the flow is complete
   * @returns True if all steps have been processed
   */
  isComplete(): boolean {
    return this.completedAt !== null;
  }

  /**
   * Get the elicitation result
   * @returns The complete result with answers and metadata
   */
  getResult(): ElicitationResult {
    if (!this.startedAt) {
      throw new Error('Elicitation has not been started');
    }

    return {
      flowId: this.flow.id,
      answers: { ...this.answers },
      metadata: {
        startedAt: this.startedAt,
        completedAt: this.completedAt || new Date(),
        skipped: [...this.skipped],
      },
    };
  }

  /**
   * Find the next valid step, skipping conditional steps that don't match
   * @param startIndex Index to start searching from
   * @returns The next valid step, or null if flow is complete
   */
  private getNextValidStep(startIndex: number): ElicitationStep | null {
    for (let i = startIndex; i < this.flow.steps.length; i++) {
      const step = this.flow.steps[i];
      
      // Check if step has a condition
      if (step.condition) {
        const shouldShow = step.condition(this.answers);
        if (!shouldShow) {
          // Skip this step
          this.skipped.push(step.id);
          continue;
        }
      }
      
      // Found a valid step
      this.currentIndex = i;
      return step;
    }

    // No more valid steps - mark as complete and return null
    this.completedAt = new Date();
    return null;
  }
}
