/**
 * Elicitation System Types
 * Defines interactive specification elicitation workflows
 */

/**
 * Step types for elicitation flows
 */
export type StepType = 
  | 'text'          // Free text input
  | 'choice'        // Single choice from options
  | 'multi-choice'  // Multiple choices from options
  | 'confirm'       // Yes/no confirmation
  | 'conditional';  // Conditional step based on previous answers

/**
 * Validation function for step answers
 */
export type ValidateFn = (value: any) => boolean | string;

/**
 * Condition function to determine if step should be shown
 */
export type ConditionFn = (answers: Record<string, any>) => boolean;

/**
 * Individual step in an elicitation flow
 */
export interface ElicitationStep {
  /** Unique step identifier */
  id: string;
  
  /** Prompt text to display to user */
  prompt: string;
  
  /** Step type */
  type: StepType;
  
  /** Available choices (for choice/multi-choice types) */
  choices?: string[];
  
  /** Default value */
  default?: any;
  
  /** Whether this step is required */
  required?: boolean;
  
  /** Validation function */
  validate?: ValidateFn;
  
  /** Condition function to determine if step should be shown */
  condition?: ConditionFn;
}

/**
 * Complete elicitation flow definition
 */
export interface ElicitationFlow {
  /** Unique flow identifier */
  id: string;
  
  /** Human-readable flow name */
  name: string;
  
  /** Flow description */
  description: string;
  
  /** Steps in the flow */
  steps: ElicitationStep[];
}

/**
 * Result of completed elicitation flow
 */
export interface ElicitationResult {
  /** ID of the flow that was completed */
  flowId: string;
  
  /** User answers keyed by step ID */
  answers: Record<string, any>;
  
  /** Metadata about the elicitation session */
  metadata: {
    /** When the elicitation started */
    startedAt: Date;
    
    /** When the elicitation completed */
    completedAt: Date;
    
    /** Step IDs that were skipped */
    skipped: string[];
  };
}
