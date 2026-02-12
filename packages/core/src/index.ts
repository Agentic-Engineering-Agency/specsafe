/**
 * SpecSafe Core - Workflow Engine and Types
 * 
 * This package provides the core types and workflow engine for the SpecSafe
 * Test-Driven Development framework.
 * 
 * @example
 * ```typescript
 * import { Workflow, ProjectTracker } from '@specsafe/core';
 * 
 * const workflow = new Workflow();
 * const spec = workflow.createSpec('auth-001', 'User Authentication', '...', 'dev', 'myapp');
 * 
 * workflow.moveToTest(spec.id);
 * workflow.moveToCode(spec.id);
 * workflow.moveToQA(spec.id);
 * 
 * // After QA passes
 * workflow.moveToComplete(spec.id, qaReport);
 * ```
 */

// Types
export type {
  Spec,
  SpecStage,
  Requirement,
  Scenario,
  QAReport,
  TestResult,
  CoverageReport,
  Issue,
  ProjectState,
  SpecSummary,
  ProjectMetrics
} from './types.js';

// Workflow engine
export { Workflow } from './workflow.js';

// Project tracker
export { ProjectTracker } from './tracker.js';

// Validation utilities
export { validateSpecId } from './validation.js';

// Agent system
export type {
  AgentDefinition,
  AgentAdapter,
  AgentRegistryEntry,
  GenerateOptions,
  GeneratedFile,
} from './agents/index.js';

export {
  getAgent,
  listAgents,
  getSupportedAgents,
  isValidAgent,
  getAgentDefinition,
  AGENT_DEFINITIONS,
} from './agents/index.js';