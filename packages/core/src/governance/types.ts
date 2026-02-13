import type { Spec } from '../types.js';

export type PrincipleSeverity = 'error' | 'warning';
export type GatePhase = 'spec' | 'test' | 'code' | 'qa' | 'complete';

export interface Principle {
  id: string;
  name: string;
  description: string;
  severity: PrincipleSeverity;
  immutable: boolean;
  metadata?: { author?: string; createdAt?: Date; rationale?: string; tags?: string[]; };
}

export interface Gate {
  id: string;
  name: string;
  phase: GatePhase;
  principles: string[];
  check: (spec: Spec, principles: Principle[]) => Promise<GateResult> | GateResult;
  description?: string;
}

export interface Violation {
  principle: Principle;
  message: string;
  severity: PrincipleSeverity;
  spec: Spec;
  context?: { file?: string; line?: number; suggestion?: string; };
}

export interface GateResult {
  passed: boolean;
  violations: Violation[];
  gate: Gate;
  timestamp: Date;
  summary?: string;
}

export interface Constitution {
  principles: Principle[];
  gates: Gate[];
  metadata: { projectName: string; version: string; createdAt: Date; updatedAt: Date; author?: string; description?: string; };
}

export interface ConstitutionLoadOptions {
  includeBuiltins?: boolean;
  validate?: boolean;
}

export interface ValidationOptions {
  phase?: GatePhase;
  failFast?: boolean;
  includeWarnings?: boolean;
}
