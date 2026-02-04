/**
 * TypeScript/Vitest Test Generator
 * Converts spec scenarios to Vitest test files
 */

import type { Spec, Scenario } from '@specsafe/core';

export interface TestGenerationOptions {
  framework: 'vitest' | 'jest';
  includeComments: boolean;
  generatePlaceholders: boolean;
}

export class TypeScriptTestGenerator {
  private options: TestGenerationOptions;

  constructor(options: Partial<TestGenerationOptions> = {}) {
    this.options = {
      framework: 'vitest',
      includeComments: true,
      generatePlaceholders: true,
      ...options
    };
  }

  /**
   * Generate test file content from spec
   */
  generate(spec: Spec): string {
    const imports = this.generateImports();
    const describe = this.generateDescribe(spec);
    
    return `${imports}\n\n${describe}`;
  }

  private generateImports(): string {
    if (this.options.framework === 'vitest') {
      return "import { describe, it, expect } from 'vitest';";
    }
    return "import { describe, it, expect } from '@jest/globals';";
  }

  private generateDescribe(spec: Spec): string {
    const tests = spec.requirements
      .flatMap(r => r.scenarios)
      .map(s => this.generateTest(s))
      .join('\n\n');

    return `describe('${spec.name}', () => {\n${tests}\n});`;
  }

  private generateTest(scenario: Scenario): string {
    const testName = this.scenarioToTestName(scenario);
    const comments = this.options.includeComments
      ? `  // GIVEN: ${scenario.given}\n  // WHEN: ${scenario.when}\n  // THEN: ${scenario.then}\n`
      : '';
    
    const body = this.options.generatePlaceholders
      ? `    expect(true).toBe(true); // TODO: Implement test`
      : '';

    return `${comments}  it('${testName}', () => {\n${body}\n  });`;
  }

  private scenarioToTestName(scenario: Scenario): string {
    // Convert scenario to readable test name
    return scenario.then
      .replace(/^then\s+/i, '')
      .replace(/\.$/, '')
      .toLowerCase();
  }
}