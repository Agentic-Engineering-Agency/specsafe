import type { Principle, Gate, GateResult, Violation, GatePhase } from './types.js';
import type { Spec } from '../types.js';
import { validateRequirements } from '../ears/validator.js';

export const BUILTIN_PRINCIPLES: Principle[] = [
  { id: 'tdd-mandatory', name: 'TDD Mandatory', description: 'All specs must have test scenarios defined for each requirement', severity: 'error', immutable: true, metadata: { rationale: 'Test-driven development ensures testability and clear acceptance criteria', tags: ['testing', 'tdd', 'quality'] } },
  { id: 'security-review-required', name: 'Security Review Required', description: 'Specs must include a security considerations section', severity: 'warning', immutable: true, metadata: { rationale: 'Security should be considered from the specification phase', tags: ['security', 'compliance'] } },
  { id: 'max-spec-complexity', name: 'Maximum Spec Complexity', description: 'Spec must not exceed complexity threshold (max 10 requirements)', severity: 'warning', immutable: false, metadata: { rationale: 'Complex specs are harder to implement and test; break them down', tags: ['complexity', 'maintainability'] } },
  { id: 'require-acceptance-criteria', name: 'Require Acceptance Criteria', description: 'All requirements must have clearly defined acceptance criteria', severity: 'error', immutable: true, metadata: { rationale: 'Acceptance criteria define "done" and enable effective testing', tags: ['testing', 'requirements'] } },
  { id: 'no-spec-without-review', name: 'No Spec Without Review', description: 'Spec must have a reviewer assigned before moving to test phase', severity: 'warning', immutable: false, metadata: { rationale: 'Peer review catches issues early and improves spec quality', tags: ['review', 'quality'] } },
  { id: 'require-ears-format', name: 'Require EARS Format', description: 'Requirements must follow EARS (Easy Approach to Requirements Syntax) patterns', severity: 'warning', immutable: false, metadata: { rationale: 'EARS patterns improve requirement clarity and testability', tags: ['requirements', 'ears', 'standards'] } },
];

function checkViolation(spec: Spec, principle: Principle, condition: boolean, message: string, suggestion: string): Violation | null {
  return condition ? { principle, message, severity: principle.severity, spec, context: { suggestion } } : null;
}

export const BUILTIN_GATES: Gate[] = [
  {
    id: 'spec-phase-gate',
    name: 'Spec Phase Gate',
    phase: 'spec',
    description: 'Validates specs before moving to test phase',
    principles: ['tdd-mandatory', 'require-acceptance-criteria', 'max-spec-complexity', 'require-ears-format'],
    check: (spec: Spec, principles: Principle[]): GateResult => {
      const violations: Violation[] = [];
      for (const p of principles) {
        if (p.id === 'tdd-mandatory') {
          const bad = spec.requirements.filter((r: { scenarios?: unknown[] }) => !r.scenarios || r.scenarios.length === 0);
          if (bad.length > 0) {
            const v = checkViolation(spec, p, true, `Requirements without test scenarios: ${bad.map((r: { id: string }) => r.id).join(', ')}`, 'Add at least one test scenario (Given/When/Then) for each requirement');
            if (v) violations.push(v);
          }
        }
        if (p.id === 'require-acceptance-criteria') {
          const bad = spec.requirements.filter((r: { scenarios?: unknown[] }) => !r.scenarios || r.scenarios.length === 0);
          if (bad.length > 0) {
            const v = checkViolation(spec, p, true, `Requirements without acceptance criteria: ${bad.map((r: { id: string }) => r.id).join(', ')}`, 'Define acceptance criteria as test scenarios (Given/When/Then)');
            if (v) violations.push(v);
          }
        }
        if (p.id === 'max-spec-complexity') {
          const v = checkViolation(spec, p, spec.requirements.length > 10, `Spec has ${spec.requirements.length} requirements (max: 10)`, 'Consider breaking this spec into multiple smaller specs');
          if (v) violations.push(v);
        }
        if (p.id === 'require-ears-format') {
          const result = validateRequirements(spec);
          const v = checkViolation(spec, p, result.score < 70, `EARS compliance score: ${result.score}% (min: 70%)`, result.recommendation);
          if (v) violations.push(v);
        }
      }
      const errors = violations.filter((v: Violation) => v.severity === 'error');
      return {
        passed: errors.length === 0,
        violations,
        gate: BUILTIN_GATES[0],
        timestamp: new Date(),
        summary: errors.length === 0 ? `✓ Spec phase gate passed` : `✗ Spec phase gate failed: ${errors.length} error(s), ${violations.length - errors.length} warning(s)`,
      };
    },
  },
  {
    id: 'test-phase-gate',
    name: 'Test Phase Gate',
    phase: 'test',
    description: 'Validates before moving to code phase',
    principles: ['no-spec-without-review', 'security-review-required'],
    check: (spec: Spec, principles: Principle[]): GateResult => {
      const violations: Violation[] = [];
      for (const p of principles) {
        if (p.id === 'no-spec-without-review') {
          const hasReviewer = spec.metadata && 'reviewer' in spec.metadata && spec.metadata.reviewer;
          const v = checkViolation(spec, p, !hasReviewer, 'No reviewer assigned to this spec', 'Add a reviewer field to spec metadata before moving to test phase');
          if (v) violations.push(v);
        }
        if (p.id === 'security-review-required') {
          const descLower = spec.description.toLowerCase();
          const hasPositive = ['## security', '# security', 'security considerations:', 'authentication:', 'authorization:', 'access control', 'encryption', 'security requirements'].some((term: string) => descLower.includes(term));
          const v = checkViolation(spec, p, !hasPositive, 'Spec lacks security considerations section', 'Add a section describing security considerations, auth requirements, and data protection');
          if (v) violations.push(v);
        }
      }
      const errors = violations.filter((v: Violation) => v.severity === 'error');
      return {
        passed: errors.length === 0,
        violations,
        gate: BUILTIN_GATES[1],
        timestamp: new Date(),
        summary: errors.length === 0 ? `✓ Test phase gate passed` : `✗ Test phase gate failed: ${errors.length} error(s), ${violations.length - errors.length} warning(s)`,
      };
    },
  },
];

export function getBuiltinPrinciple(id: string): Principle | undefined {
  return BUILTIN_PRINCIPLES.find((p: Principle) => p.id === id);
}

export function getBuiltinGate(id: string): Gate | undefined {
  return BUILTIN_GATES.find((g: Gate) => g.id === id);
}

export function getGatesForPhase(phase: GatePhase): Gate[] {
  return BUILTIN_GATES.filter((g: Gate) => g.phase === phase);
}
