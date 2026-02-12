/**
 * EARS (Easy Approach to Requirements Syntax) Types
 * Defines structured requirement patterns for testability
 */

export type EARSType = 
  | 'ubiquitous'  // "The system shall [action]"
  | 'event'       // "When [event], the system shall [action]"
  | 'state'       // "While [state], the system shall [action]"
  | 'optional'    // "Where [condition], the system shall [action]"
  | 'unwanted'    // "If [unwanted], then the system shall [action]"
  | 'complex'     // Combination of the above
  | 'unknown';    // Doesn't match EARS patterns

export interface EARSRequirement {
  /** Original requirement text */
  text: string;
  
  /** EARS pattern type */
  type: EARSType;
  
  /** Event trigger (for event-driven requirements) */
  event?: string;
  
  /** State condition (for state-driven requirements) */
  state?: string;
  
  /** Optional condition (for optional requirements) */
  condition?: string;
  
  /** Unwanted condition (for unwanted behavior requirements) */
  unwantedCondition?: string;
  
  /** The system action/response */
  action: string;
  
  /** For complex requirements with multiple conditions */
  conditions?: {
    type: 'event' | 'state' | 'optional';
    value: string;
  }[];
  
  /** Confidence score (0-1) that this matches EARS pattern */
  confidence: number;
}

export interface EARSValidationResult {
  /** Overall EARS compliance score (0-100) */
  score: number;
  
  /** Total requirements analyzed */
  totalRequirements: number;
  
  /** Number of EARS-compliant requirements */
  compliantCount: number;
  
  /** Detailed validation for each requirement */
  requirements: RequirementValidation[];
  
  /** Summary by EARS type */
  summary: {
    type: EARSType;
    count: number;
  }[];
  
  /** Overall recommendation */
  recommendation: string;
}

export interface RequirementValidation {
  /** Original requirement text */
  text: string;
  
  /** Whether it follows EARS pattern */
  isCompliant: boolean;
  
  /** Detected EARS pattern (if any) */
  earsRequirement?: EARSRequirement;
  
  /** Issues found */
  issues: string[];
  
  /** Suggested EARS rewrite */
  suggestion?: string;
}
