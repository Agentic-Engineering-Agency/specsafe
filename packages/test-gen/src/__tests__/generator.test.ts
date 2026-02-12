/**
 * TypeScriptTestGenerator Tests
 * Tests for the TypeScript/Vitest Test Generator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TypeScriptTestGenerator, type TestGenerationOptions } from '../typescript.js';
import type { Spec, Requirement, Scenario } from '@specsafe/core';

describe('TypeScriptTestGenerator', () => {
  let generator: TypeScriptTestGenerator;

  beforeEach(() => {
    generator = new TypeScriptTestGenerator();
  });

  describe('generate', () => {
    it('should produce valid vitest imports', () => {
      const spec: Spec = {
        id: 'SPEC-001',
        name: 'Test Spec',
        description: 'A test spec',
        stage: 'spec',
        createdAt: new Date(),
        updatedAt: new Date(),
        requirements: [],
        testFiles: [],
        implementationFiles: [],
        metadata: { author: 'Test', project: 'Test', tags: [] }
      };

      const output = generator.generate(spec);

      expect(output).toContain("import { describe, it, expect } from 'vitest';");
    });

    it('should create describe block with spec name', () => {
      const spec: Spec = {
        id: 'SPEC-001',
        name: 'User Authentication',
        description: 'A test spec',
        stage: 'spec',
        createdAt: new Date(),
        updatedAt: new Date(),
        requirements: [],
        testFiles: [],
        implementationFiles: [],
        metadata: { author: 'Test', project: 'Test', tags: [] }
      };

      const output = generator.generate(spec);

      expect(output).toContain("describe('User Authentication', () => {");
    });

    it('should create it() blocks for each scenario', () => {
      const scenario1: Scenario = {
        id: 'SC-1',
        given: 'user is on login page',
        when: 'user enters valid credentials',
        thenOutcome: 'user is redirected to dashboard'
      };

      const scenario2: Scenario = {
        id: 'SC-2',
        given: 'user is on login page',
        when: 'user enters invalid credentials',
        thenOutcome: 'error message is displayed'
      };

      const requirement: Requirement = {
        id: 'REQ-1',
        text: 'Login functionality',
        priority: 'P0',
        scenarios: [scenario1, scenario2]
      };

      const spec: Spec = {
        id: 'SPEC-001',
        name: 'User Authentication',
        description: 'A test spec',
        stage: 'spec',
        createdAt: new Date(),
        updatedAt: new Date(),
        requirements: [requirement],
        testFiles: [],
        implementationFiles: [],
        metadata: { author: 'Test', project: 'Test', tags: [] }
      };

      const output = generator.generate(spec);

      expect(output).toContain("it('user is redirected to dashboard'");
      expect(output).toContain("it('error message is displayed'");
    });

    it('should include GIVEN/WHEN/THEN comments when enabled', () => {
      const scenario: Scenario = {
        id: 'SC-1',
        given: 'user is logged in',
        when: 'user clicks logout',
        thenOutcome: 'session is terminated'
      };

      const requirement: Requirement = {
        id: 'REQ-1',
        text: 'Logout functionality',
        priority: 'P0',
        scenarios: [scenario]
      };

      const spec: Spec = {
        id: 'SPEC-001',
        name: 'Logout Test',
        description: 'A test spec',
        stage: 'spec',
        createdAt: new Date(),
        updatedAt: new Date(),
        requirements: [requirement],
        testFiles: [],
        implementationFiles: [],
        metadata: { author: 'Test', project: 'Test', tags: [] }
      };

      const output = generator.generate(spec);

      expect(output).toContain('// GIVEN: user is logged in');
      expect(output).toContain('// WHEN: user clicks logout');
      expect(output).toContain('// THEN: session is terminated');
    });

    it('should exclude comments when includeComments is false', () => {
      const scenario: Scenario = {
        id: 'SC-1',
        given: 'user is logged in',
        when: 'user clicks logout',
        thenOutcome: 'session is terminated'
      };

      const requirement: Requirement = {
        id: 'REQ-1',
        text: 'Logout functionality',
        priority: 'P0',
        scenarios: [scenario]
      };

      const spec: Spec = {
        id: 'SPEC-001',
        name: 'Logout Test',
        description: 'A test spec',
        stage: 'spec',
        createdAt: new Date(),
        updatedAt: new Date(),
        requirements: [requirement],
        testFiles: [],
        implementationFiles: [],
        metadata: { author: 'Test', project: 'Test', tags: [] }
      };

      const genWithoutComments = new TypeScriptTestGenerator({ includeComments: false });
      const output = genWithoutComments.generate(spec);

      expect(output).not.toContain('// GIVEN:');
      expect(output).not.toContain('// WHEN:');
      expect(output).not.toContain('// THEN:');
    });

    it('should include placeholder expect when generatePlaceholders is true', () => {
      const scenario: Scenario = {
        id: 'SC-1',
        given: 'test condition',
        when: 'action happens',
        thenOutcome: 'result occurs'
      };

      const requirement: Requirement = {
        id: 'REQ-1',
        text: 'Test',
        priority: 'P0',
        scenarios: [scenario]
      };

      const spec: Spec = {
        id: 'SPEC-001',
        name: 'Placeholder Test',
        description: 'A test spec',
        stage: 'spec',
        createdAt: new Date(),
        updatedAt: new Date(),
        requirements: [requirement],
        testFiles: [],
        implementationFiles: [],
        metadata: { author: 'Test', project: 'Test', tags: [] }
      };

      const output = generator.generate(spec);

      expect(output).toContain('expect(true).toBe(true); // TODO: Implement test');
    });

    it('should not include placeholder when generatePlaceholders is false', () => {
      const scenario: Scenario = {
        id: 'SC-1',
        given: 'test condition',
        when: 'action happens',
        thenOutcome: 'result occurs'
      };

      const requirement: Requirement = {
        id: 'REQ-1',
        text: 'Test',
        priority: 'P0',
        scenarios: [scenario]
      };

      const spec: Spec = {
        id: 'SPEC-001',
        name: 'Placeholder Test',
        description: 'A test spec',
        stage: 'spec',
        createdAt: new Date(),
        updatedAt: new Date(),
        requirements: [requirement],
        testFiles: [],
        implementationFiles: [],
        metadata: { author: 'Test', project: 'Test', tags: [] }
      };

      const genWithoutPlaceholders = new TypeScriptTestGenerator({ generatePlaceholders: false });
      const output = genWithoutPlaceholders.generate(spec);

      expect(output).not.toContain('expect(true).toBe(true)');
    });
  });

  describe('parseScenarios', () => {
    it('should extract GIVEN/WHEN/THEN from content', () => {
      const content = `
GIVEN: user is authenticated
WHEN: user requests profile
THEN: profile data is returned

GIVEN: user is not authenticated
WHEN: user requests profile
THEN: 401 error is returned
`;

      const scenarios = generator.parseScenarios(content);

      expect(scenarios).toHaveLength(2);
      expect(scenarios[0].given).toBe('user is authenticated');
      expect(scenarios[0].when).toBe('user requests profile');
      expect(scenarios[0].thenOutcome).toBe('profile data is returned');
      expect(scenarios[1].given).toBe('user is not authenticated');
      expect(scenarios[1].thenOutcome).toBe('401 error is returned');
    });

    it('should handle mixed case GIVEN/WHEN/THEN', () => {
      const content = `
Given: a condition
When: an action
Then: a result
`;

      const scenarios = generator.parseScenarios(content);

      expect(scenarios).toHaveLength(1);
      expect(scenarios[0].given).toBe('a condition');
      expect(scenarios[0].when).toBe('an action');
      expect(scenarios[0].thenOutcome).toBe('a result');
    });

    it('should return empty array for content without scenarios', () => {
      const content = 'Just some random text without any GIVEN/WHEN/THEN patterns';

      const scenarios = generator.parseScenarios(content);

      expect(scenarios).toEqual([]);
    });
  });

  describe('escapeString', () => {
    it('should handle special characters in spec name', () => {
      const spec: Spec = {
        id: 'SPEC-001',
        name: "User's Profile (Test)",
        description: 'A test spec',
        stage: 'spec',
        createdAt: new Date(),
        updatedAt: new Date(),
        requirements: [],
        testFiles: [],
        implementationFiles: [],
        metadata: { author: 'Test', project: 'Test', tags: [] }
      };

      const output = generator.generate(spec);

      expect(output).toContain("describe('User\\'s Profile (Test)', () => {");
    });

    it('should handle backslashes in content', () => {
      const spec: Spec = {
        id: 'SPEC-001',
        name: 'Path\\Test',
        description: 'A test spec',
        stage: 'spec',
        createdAt: new Date(),
        updatedAt: new Date(),
        requirements: [],
        testFiles: [],
        implementationFiles: [],
        metadata: { author: 'Test', project: 'Test', tags: [] }
      };

      const output = generator.generate(spec);

      expect(output).toContain("describe('Path\\\\Test'");
    });

    it('should handle newlines in content', () => {
      const spec: Spec = {
        id: 'SPEC-001',
        name: 'Line1\nLine2',
        description: 'A test spec',
        stage: 'spec',
        createdAt: new Date(),
        updatedAt: new Date(),
        requirements: [],
        testFiles: [],
        implementationFiles: [],
        metadata: { author: 'Test', project: 'Test', tags: [] }
      };

      const output = generator.generate(spec);

      expect(output).toContain("describe('Line1\\nLine2'");
    });
  });

  describe('scenarioToTestName', () => {
    it('should remove "then " prefix from test name', () => {
      const scenario: Scenario = {
        id: 'SC-1',
        given: 'condition',
        when: 'action',
        thenOutcome: 'then result happens'
      };

      const requirement: Requirement = {
        id: 'REQ-1',
        text: 'Test',
        priority: 'P0',
        scenarios: [scenario]
      };

      const spec: Spec = {
        id: 'SPEC-001',
        name: 'Test',
        description: 'A test spec',
        stage: 'spec',
        createdAt: new Date(),
        updatedAt: new Date(),
        requirements: [requirement],
        testFiles: [],
        implementationFiles: [],
        metadata: { author: 'Test', project: 'Test', tags: [] }
      };

      const output = generator.generate(spec);

      expect(output).toContain("it('result happens'");
      expect(output).not.toContain("it('then result happens'");
    });

    it('should remove trailing period from test name', () => {
      const scenario: Scenario = {
        id: 'SC-1',
        given: 'condition',
        when: 'action',
        thenOutcome: 'result happens.'
      };

      const requirement: Requirement = {
        id: 'REQ-1',
        text: 'Test',
        priority: 'P0',
        scenarios: [scenario]
      };

      const spec: Spec = {
        id: 'SPEC-001',
        name: 'Test',
        description: 'A test spec',
        stage: 'spec',
        createdAt: new Date(),
        updatedAt: new Date(),
        requirements: [requirement],
        testFiles: [],
        implementationFiles: [],
        metadata: { author: 'Test', project: 'Test', tags: [] }
      };

      const output = generator.generate(spec);

      expect(output).toContain("it('result happens'");
    });
  });

  describe('framework option', () => {
    it('should use Jest imports when framework is jest', () => {
      const jestGenerator = new TypeScriptTestGenerator({ framework: 'jest' });
      
      const spec: Spec = {
        id: 'SPEC-001',
        name: 'Jest Test',
        description: 'A test spec',
        stage: 'spec',
        createdAt: new Date(),
        updatedAt: new Date(),
        requirements: [],
        testFiles: [],
        implementationFiles: [],
        metadata: { author: 'Test', project: 'Test', tags: [] }
      };

      const output = jestGenerator.generate(spec);

      expect(output).toContain("import { describe, it, expect } from '@jest/globals';");
    });
  });
});
