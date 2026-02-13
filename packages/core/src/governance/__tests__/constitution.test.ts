import { describe, it, expect, beforeEach } from 'vitest';
import { ConstitutionManager } from '../constitution.js';
import type { Spec } from '../../types.js';
import type { Principle } from '../types.js';

describe('ConstitutionManager', () => {
  let manager: ConstitutionManager;

  beforeEach(() => {
    manager = new ConstitutionManager('/tmp/test-project');
  });

  it('should create default constitution', async () => {
    const constitution = await manager.load({ includeBuiltins: false });
    expect(constitution).toBeDefined();
    expect(constitution.principles).toEqual([]);
  });

  it('should include built-in principles', async () => {
    const constitution = await manager.load({ includeBuiltins: true });
    expect(constitution.principles.length).toBeGreaterThan(0);
  });

  it('should add and list principles', async () => {
    await manager.load({ includeBuiltins: false });
    const principle: Principle = {
      id: 'test-principle',
      name: 'Test',
      description: 'Test principle',
      severity: 'warning',
      immutable: false,
    };

    manager.addPrinciple(principle);
    const principles = manager.listPrinciples();
    expect(principles).toContainEqual(principle);
  });

  it('should validate a spec', async () => {
    await manager.load({ includeBuiltins: true });
    
    const spec: Spec = {
      id: 'spec-001',
      name: 'Test Spec',
      description: '## security is covered',
      stage: 'spec',
      createdAt: new Date(),
      updatedAt: new Date(),
      requirements: [{
        id: 'req-001',
        text: 'The system shall do something',
        priority: 'P0',
        scenarios: [{
          id: 'scen-001',
          given: 'condition',
          when: 'action',
          thenOutcome: 'result',
        }],
      }],
      testFiles: [],
      implementationFiles: [],
      metadata: { author: 'test', project: 'test', tags: [] },
    };

    const results = await manager.validate(spec);
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
  });
});
