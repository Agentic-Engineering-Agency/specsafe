/**
 * Elicitation System
 * 
 * Interactive specification elicitation workflows for SpecSafe.
 * Guides users through structured question flows to create well-formed specs.
 * 
 * @example
 * ```typescript
 * import { ElicitationEngine, quickFlow, generateSpec } from '@specsafe/core';
 * 
 * const engine = new ElicitationEngine(quickFlow);
 * let step = engine.start();
 * 
 * while (step) {
 *   const answer = await promptUser(step);
 *   step = engine.answer(step.id, answer);
 * }
 * 
 * const result = engine.getResult();
 * const spec = generateSpec(result);
 * ```
 */

// Export types
export type {
  StepType,
  ValidateFn,
  ConditionFn,
  ElicitationStep,
  ElicitationFlow,
  ElicitationResult,
} from './types.js';

// Export engine
export { ElicitationEngine } from './engine.js';

// Export built-in flows
export { quickFlow, fullFlow, earsFlow } from './flows.js';

// Export generator
export { generateSpec } from './generator.js';
