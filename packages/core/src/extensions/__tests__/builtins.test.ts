import { describe, it, expect } from 'vitest';
import { owaspExtension } from '../builtins/owasp.js';
import { complexityExtension } from '../builtins/complexity.js';
import type { ExtensionContext } from '../types.js';
import type { Spec } from '../../types.js';

// Helper to create a test spec
function createTestSpec(overrides?: Partial<Spec>): Spec {
  return {
    id: 'test-001',
    name: 'Test Spec',
    description: 'A simple spec',
    stage: 'spec',
    requirements: [],
    testFiles: [],
    implementationFiles: [],
    metadata: {
      author: 'test',
      project: 'test',
      tags: [],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('OWASP Extension', () => {
  it('should flag spec with no security mentions', () => {
    const spec = createTestSpec({
      description: 'A simple spec with no security considerations',
      requirements: [
        {
          id: 'req-1',
          text: 'User can view dashboard',
          priority: 'P0',
          scenarios: [],
        },
      ],
    });

    const context: ExtensionContext = {
      spec,
      phase: 'post-validate',
    };

    const hook = owaspExtension.hooks['post-validate'];
    expect(hook).toBeDefined();

    const result = hook!(context);

    expect(result.success).toBe(false);
    expect(result.errors).toContain('No security considerations found in spec');
    expect(result.data?.coverage).toBe(0);
  });

  it('should detect authentication mentions', () => {
    const spec = createTestSpec({
      description: 'User authentication with login and password validation',
    });

    const context: ExtensionContext = {
      spec,
      phase: 'post-validate',
    };

    const hook = owaspExtension.hooks['post-validate'];
    const result = hook!(context);

    expect(result.success).toBe(true);
    expect(result.data?.foundCount).toBeGreaterThan(0);
  });

  it('should detect multiple security aspects', () => {
    const spec = createTestSpec({
      description: `
        API with authentication via OAuth2, authorization based on user roles,
        input validation for all endpoints, encryption using TLS/HTTPS,
        and GDPR-compliant data protection.
      `,
    });

    const context: ExtensionContext = {
      spec,
      phase: 'post-validate',
    };

    const hook = owaspExtension.hooks['post-validate'];
    const result = hook!(context);

    expect(result.success).toBe(true);
    expect(result.data?.coverage).toBe(100);
    expect(result.data?.foundCount).toBe(5);
  });
});

describe('Complexity Extension', () => {
  it('should score low complexity for simple spec', () => {
    const spec = createTestSpec({
      description: 'A very simple spec',
      requirements: [
        {
          id: 'req-1',
          text: 'Basic requirement',
          priority: 'P0',
          scenarios: [
            {
              id: 'sc-1',
              given: 'user is logged in',
              when: 'user clicks button',
              thenOutcome: 'action happens',
            },
          ],
        },
      ],
    });

    const context: ExtensionContext = {
      spec,
      phase: 'post-validate',
    };

    const hook = complexityExtension.hooks['post-validate'];
    expect(hook).toBeDefined();

    const result = hook!(context);

    expect(result.success).toBe(true);
    expect(result.data?.complexityLevel).toBe('low');
    expect(result.data?.complexityScore).toBeLessThan(25);
  });

  it('should score high complexity for complex spec', () => {
    const spec = createTestSpec({
      description: `
        Complex system with multiple API integrations, external services,
        third-party webhooks, and many dependencies on other modules and components.
      `,
      requirements: Array.from({ length: 15 }, (_, i) => ({
        id: `req-${i + 1}`,
        text: `Requirement ${i + 1}`,
        priority: 'P1' as const,
        scenarios: [
          {
            id: `sc-${i + 1}-1`,
            given: 'condition',
            when: 'action',
            thenOutcome: 'result',
          },
          {
            id: `sc-${i + 1}-2`,
            given: 'another condition',
            when: 'another action',
            thenOutcome: 'another result',
          },
        ],
      })),
    });

    const context: ExtensionContext = {
      spec,
      phase: 'post-validate',
    };

    const hook = complexityExtension.hooks['post-validate'];
    const result = hook!(context);

    expect(result.data?.complexityLevel).toMatch(/high|very-high/);
    expect(result.data?.complexityScore).toBeGreaterThan(50);
    expect(result.warnings?.length).toBeGreaterThan(0);
  });

  it('should warn about high requirement count', () => {
    const spec = createTestSpec({
      description: 'Spec with many requirements',
      requirements: Array.from({ length: 12 }, (_, i) => ({
        id: `req-${i + 1}`,
        text: `Requirement ${i + 1}`,
        priority: 'P2' as const,
        scenarios: [],
      })),
    });

    const context: ExtensionContext = {
      spec,
      phase: 'post-validate',
    };

    const hook = complexityExtension.hooks['post-validate'];
    const result = hook!(context);

    expect(result.warnings).toContain('High requirement count: 12');
    expect(result.suggestions).toContainEqual(
      expect.stringContaining('breaking this spec into smaller')
    );
  });

  it('should detect integration points', () => {
    const spec = createTestSpec({
      description: 'API integration with external service and third-party webhooks',
    });

    const context: ExtensionContext = {
      spec,
      phase: 'post-validate',
    };

    const hook = complexityExtension.hooks['post-validate'];
    const result = hook!(context);

    expect(result.data?.metrics?.integrationPoints).toBeGreaterThan(0);
  });

  it('should return success false for very high complexity', () => {
    const spec = createTestSpec({
      description: `
        Massive system with API, service, integration, external dependencies,
        third-party systems, requires multiple modules, depends on many components.
      `,
      requirements: Array.from({ length: 20 }, (_, i) => ({
        id: `req-${i + 1}`,
        text: `Requirement ${i + 1}`,
        priority: 'P0' as const,
        scenarios: Array.from({ length: 3 }, (_, j) => ({
          id: `sc-${i + 1}-${j + 1}`,
          given: `condition ${j}`,
          when: `action ${j}`,
          thenOutcome: `result ${j}`,
        })),
      })),
    });

    const context: ExtensionContext = {
      spec,
      phase: 'post-validate',
    };

    const hook = complexityExtension.hooks['post-validate'];
    const result = hook!(context);

    expect(result.data?.complexityLevel).toBe('very-high');
    expect(result.success).toBe(false);
  });
});
