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

// Extension System
export type {
  Extension,
  ExtensionContext,
  ExtensionResult,
  ExtensionHook,
  HookRegistration,
} from './extensions/types.js';

export { ExtensionRegistry } from './extensions/registry.js';
export {
  validateExtension,
  loadExtension,
  loadExtensions,
  loadBuiltinExtensions,
} from './extensions/loader.js';
export {
  listExtensions,
  listEnabledExtensions,
  enableExtension,
  disableExtension,
  getExtension,
} from './extensions/index.js';

// Governance System
export type {
  Constitution,
  Principle,
  PrincipleSeverity,
  Gate,
  GatePhase,
  GateResult,
  Violation,
  ConstitutionLoadOptions,
  ValidationOptions,
} from './governance/types.js';

export { ConstitutionManager } from './governance/constitution.js';
export { BUILTIN_PRINCIPLES, BUILTIN_GATES, getBuiltinPrinciple, getBuiltinGate, getGatesForPhase } from './governance/builtins.js';
export { generateConstitution, generateMinimalConstitution, generateStrictConstitution, generateConstitutionReadme } from './governance/template.js';

// Elicitation System
export type {
  ElicitationStep,
  ElicitationFlow,
  ElicitationResult,
  StepType,
} from './elicitation/types.js';

export { ElicitationEngine } from './elicitation/engine.js';
export { quickFlow, fullFlow, earsFlow } from './elicitation/flows.js';
export { generateSpec } from './elicitation/generator.js';

// Sharding System
export type {
  ShardStrategy,
  ShardType,
  SpecShard,
  ShardPlan,
  ShardOptions,
  ShardResult,
  MergeResult as ShardMergeResult,
  ShardAnalysis,
  CrossReference,
} from './sharding/index.js';

export {
  ShardEngine,
  shardBySection,
  shardByRequirement,
  shardByScenario,
  shardAuto,
  DEFAULT_SHARD_OPTIONS,
} from './sharding/index.js';
