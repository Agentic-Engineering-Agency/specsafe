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

// E2E Testing System
export type {
  TestGuide,
  TestScenario,
  TestStep,
  ScreenshotSubmission,
  TestReport,
  E2ETestResult,
  TestStatus,
  TestIssue,
  ExpectedState,
  FixSuggestion,
  TestReportSummary,
  AnalysisConfig,
  GuideGenerationOptions,
  TestSubmissionOptions,
  AutomationMode,
  PlaywrightRunResult
} from './e2e/types.js';

export {
  generateGuide,
  generateGuideContent,
  formatGuideAsMarkdown,
  formatGuideAsJSON,
  saveGuide,
  filterScenariosByPriority,
  getScreenshotSteps
} from './e2e/guide-generator.js';

export {
  analyzeScreenshots,
  analyzeSingleSubmission,
  compareWithExpected,
  generateReport,
  generatePlaywrightReport,
  generateFixSuggestions,
  suggestFixes,
  formatReportAsMarkdown,
  DEFAULT_ANALYSIS_CONFIG
} from './e2e/report-analyzer.js';

export {
  E2EEngine,
  convertToPlaywrightScenarios,
  generatePlaywrightScript
} from './e2e/playwright.js';

export type {
  PlaywrightConfig,
  PlaywrightAction,
  PlaywrightScenario
} from './e2e/playwright.js';

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
