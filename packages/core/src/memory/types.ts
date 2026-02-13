/**
 * Project Memory Types
 * Defines data structures for maintaining project context across spec sessions
 */

export interface Decision {
  id: string;
  specId: string;
  decision: string;
  rationale: string;
  timestamp: Date;
  alternatives: string[];
}

export interface Pattern {
  id: string;
  name: string;
  description: string;
  examples: PatternExample[];
  usageCount: number;
}

export interface PatternExample {
  specId: string;
  context: string;
  snippet?: string;
}

export interface MemoryConstraint {
  id: string;
  type: 'technical' | 'business' | 'architectural';
  description: string;
  source?: string;
  specId?: string;
}

export interface HistoryEntry {
  timestamp: Date;
  specId: string;
  action: 'created' | 'updated' | 'completed' | 'decision' | 'pattern';
  details: string;
}

export interface ProjectMemory {
  projectId: string;
  specs: string[];
  decisions: Decision[];
  patterns: Pattern[];
  constraints: MemoryConstraint[];
  history: HistoryEntry[];
}

export interface SteeringInput {
  currentSpec: string;
  relatedSpecs?: string[];
  questions?: string[];
  suggestions?: string[];
}

export interface SteeringOutput {
  context: string;
  warnings: Warning[];
  recommendations: Recommendation[];
  relatedDecisions: Decision[];
}

export interface Warning {
  type: 'consistency' | 'conflict' | 'deprecation' | 'missing';
  message: string;
  severity: 'low' | 'medium' | 'high';
  relatedSpecId?: string;
}

export interface Recommendation {
  type: 'pattern' | 'decision' | 'constraint' | 'best-practice';
  message: string;
  confidence: 'low' | 'medium' | 'high';
  patternId?: string;
  decisionId?: string;
}
