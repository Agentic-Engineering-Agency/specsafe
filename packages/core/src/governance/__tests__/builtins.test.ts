import { describe, it, expect } from 'vitest';
import { BUILTIN_PRINCIPLES, BUILTIN_GATES, getBuiltinPrinciple, getBuiltinGate } from '../builtins.js';

describe('Built-in Principles', () => {
  it('should have expected principles', () => {
    expect(BUILTIN_PRINCIPLES.length).toBe(6);
    
    const principleIds = BUILTIN_PRINCIPLES.map(p => p.id);
    expect(principleIds).toContain('tdd-mandatory');
    expect(principleIds).toContain('security-review-required');
    expect(principleIds).toContain('require-ears-format');
  });

  it('should have valid structures', () => {
    for (const principle of BUILTIN_PRINCIPLES) {
      expect(principle.id).toBeTruthy();
      expect(principle.name).toBeTruthy();
      expect(['error', 'warning']).toContain(principle.severity);
    }
  });
});

describe('Built-in Gates', () => {
  it('should have expected gates', () => {
    expect(BUILTIN_GATES.length).toBeGreaterThan(0);
    
    const gateIds = BUILTIN_GATES.map(g => g.id);
    expect(gateIds).toContain('spec-phase-gate');
    expect(gateIds).toContain('test-phase-gate');
  });
});

describe('Helper functions', () => {
  it('should get principle by ID', () => {
    const principle = getBuiltinPrinciple('tdd-mandatory');
    expect(principle).toBeDefined();
    expect(principle?.id).toBe('tdd-mandatory');
  });

  it('should get gate by ID', () => {
    const gate = getBuiltinGate('spec-phase-gate');
    expect(gate).toBeDefined();
    expect(gate?.id).toBe('spec-phase-gate');
  });
});
