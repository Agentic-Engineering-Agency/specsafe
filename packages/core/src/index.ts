/**
 * SpecSafe Core - Workflow Engine and Types
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

// Delta types
export type {
  DeltaSpec,
  DeltaRequirement,
  MergeResult,
  MergeConflict,
  MergeStats
} from './delta/types.js';

// Workflow engine
export { Workflow } from './workflow.js';

// Project tracker
export { ProjectTracker } from './tracker.js';

// Validation utilities
export { validateSpecId } from './validation.js';

// Delta system
export { DeltaParser } from './delta/parser.js';
export { SemanticMerger } from './delta/merger.js';
export { generateDeltaTemplate, generateDeltaReadme } from './templates/delta-template.js';

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

// EARS system
export type {
  EARSType,
  EARSRequirement,
  EARSValidationResult,
  RequirementValidation,
} from './ears/index.js';

export {
  parseEARSRequirement,
  hasEARSKeywords,
  extractRequirements,
  validateRequirements,
  validateRequirement,
  getEARSScore,
  meetsEARSThreshold,
  generateEARSReport,
  generateEARSTemplate,
  generateEARSExamples,
} from './ears/index.js';

// Template System v2
export type {
  Template,
  TemplateVariable,
  RenderOptions,
  Constraint,
  ConstraintType,
  ValidationResult,
  ConstraintFailure,
  Checklist,
  ChecklistItem,
  ChecklistResult,
  ChecklistItemFailure,
} from './templates/types.js';

export { TemplateEngine } from './templates/engine.js';
export { parseChecklists, evaluateChecklists } from './templates/checklist.js';
