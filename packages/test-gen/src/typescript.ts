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

    return `describe('${this.escapeString(spec.name)}', () => {\n${tests}\n});`;
  }

  private generateTest(scenario: Scenario): string {
    const testName = this.escapeString(this.scenarioToTestName(scenario));
    const comments = this.options.includeComments
      ? `  // GIVEN: ${scenario.given}\n  // WHEN: ${scenario.when}\n  // THEN: ${scenario.then}\n`
      : '';
    
    const body = this.options.generatePlaceholders
      ? `    expect(true).toBe(true); // TODO: Implement test`
      : '';

    return `${comments}  it('${testName}', () => {\n${body}\n  });`;
  }

  private scenarioToTestName(scenario: Scenario): string {
    // Convert scenario to readable test name, preserving original case
    return scenario.then
      .replace(/^then\s+/i, '')
      .replace(/\.$/, '');
  }

  /**
   * Escape special characters in a string for use in single-quoted JS strings
   */
  private escapeString(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\n/g, '\\n');
  }
  
  /**
   * Parse scenarios from spec markdown content
   */
  parseScenarios(content: string): Scenario[] {
    const scenarios: Scenario[] = [];
    
    // Match GIVEN/WHEN/THEN patterns in the content
    const scenarioRegex = /(?:GIVEN|Given)\s*:\s*(.+?)(?:\n|\r)(?:WHEN|When)\s*:\s*(.+?)(?:\n|\r)(?:THEN|Then)\s*:\s*(.+?)(?:\n|\r|$)/gi;
    
    let match;
    while ((match = scenarioRegex.exec(content)) !== null) {
      scenarios.push({
        id: `SC-${scenarios.length + 1}`,
        given: match[1].trim(),
        when: match[2].trim(),
        then: match[3].trim()
      });
    }
    
    return scenarios;
  }
}
