/**
 * Template System v2 Types
 */

export interface TemplateVariable {
  name: string;
  value: string | number | boolean;
}

export interface RenderOptions {
  variables?: Record<string, string | number | boolean>;
  partials?: Record<string, string>;
  preserveConstraints?: boolean;
  preserveChecklists?: boolean;
}

export type ConstraintType = 
  | 'max-requirements'
  | 'min-requirements'
  | 'require-section'
  | 'max-section-length'
  | 'require-priority'
  | 'require-scenarios'
  | 'custom';

export interface Constraint {
  type: ConstraintType;
  param: string | number;
  description?: string;
  line?: number;
}

export interface ValidationResult {
  valid: boolean;
  passed: Constraint[];
  failed: ConstraintFailure[];
  summary: string;
}

export interface ConstraintFailure {
  constraint: Constraint;
  reason: string;
  actualValue?: string | number;
}

export interface ChecklistItem {
  id: string;
  description: string;
  required: boolean;
  category?: string;
}

export interface Checklist {
  id: string;
  name: string;
  items: ChecklistItem[];
  line?: number;
}

export interface ChecklistResult {
  checklist: Checklist;
  passed: ChecklistItem[];
  failed: ChecklistItemFailure[];
  skipped: ChecklistItem[];
  valid: boolean;
  score: number;
}

export interface ChecklistItemFailure {
  item: ChecklistItem;
  reason: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
  constraints: Constraint[];
  checklists: Checklist[];
  version?: string;
  author?: string;
  tags?: string[];
}
