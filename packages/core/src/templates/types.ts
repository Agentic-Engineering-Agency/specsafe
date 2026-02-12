/**
 * Template System v2 Types
 * LLM-aware templates with constraints and self-validation
 */

/**
 * Template variable for interpolation
 */
export interface TemplateVariable {
  name: string;
  value: string | number | boolean;
}

/**
 * Template rendering options
 */
export interface RenderOptions {
  /** Variables for interpolation */
  variables?: Record<string, string | number | boolean>;
  /** Partial templates for includes */
  partials?: Record<string, string>;
  /** Whether to preserve constraint directives in output */
  preserveConstraints?: boolean;
  /** Whether to preserve checklist directives in output */
  preserveChecklists?: boolean;
}

/**
 * Constraint types
 */
export type ConstraintType = 
  | 'max-requirements'
  | 'min-requirements'
  | 'require-section'
  | 'max-section-length'
  | 'require-priority'
  | 'require-scenarios'
  | 'custom';

/**
 * A constraint directive embedded in a template
 */
export interface Constraint {
  /** Type of constraint */
  type: ConstraintType;
  /** Constraint parameter (e.g., section name, max count) */
  param: string | number;
  /** Human-readable description */
  description?: string;
  /** Line number where constraint was found */
  line?: number;
}

/**
 * Result of validating a spec against constraints
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Constraints that passed */
  passed: Constraint[];
  /** Constraints that failed */
  failed: ConstraintFailure[];
  /** Summary message */
  summary: string;
}

/**
 * A failed constraint with details
 */
export interface ConstraintFailure {
  /** The constraint that failed */
  constraint: Constraint;
  /** Reason for failure */
  reason: string;
  /** Actual value found (if applicable) */
  actualValue?: string | number;
}

/**
 * A checklist item to validate
 */
export interface ChecklistItem {
  /** Unique identifier */
  id: string;
  /** Human-readable description */
  description: string;
  /** Whether this item is required */
  required: boolean;
  /** Category (e.g., 'security', 'performance', 'testability') */
  category?: string;
}

/**
 * A checklist embedded in a template
 */
export interface Checklist {
  /** Checklist identifier */
  id: string;
  /** Checklist name */
  name: string;
  /** Items in this checklist */
  items: ChecklistItem[];
  /** Line number where checklist was found */
  line?: number;
}

/**
 * Result of evaluating a checklist against a spec
 */
export interface ChecklistResult {
  /** The checklist that was evaluated */
  checklist: Checklist;
  /** Items that passed */
  passed: ChecklistItem[];
  /** Items that failed */
  failed: ChecklistItemFailure[];
  /** Items that were not applicable */
  skipped: ChecklistItem[];
  /** Overall pass/fail */
  valid: boolean;
  /** Score (0-100) */
  score: number;
}

/**
 * A failed checklist item with details
 */
export interface ChecklistItemFailure {
  /** The item that failed */
  item: ChecklistItem;
  /** Reason for failure */
  reason: string;
}

/**
 * A complete template with metadata
 */
export interface Template {
  /** Template identifier */
  id: string;
  /** Template name */
  name: string;
  /** Description of what this template is for */
  description: string;
  /** Template content (markdown) */
  content: string;
  /** Constraints embedded in this template */
  constraints: Constraint[];
  /** Checklists embedded in this template */
  checklists: Checklist[];
  /** Template version */
  version?: string;
  /** Author */
  author?: string;
  /** Tags for categorization */
  tags?: string[];
}
