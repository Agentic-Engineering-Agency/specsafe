/**
 * TypeScriptTestGenerator Tests
 * Tests for the TypeScript/Vitest Test Generator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TypeScriptTestGenerator, type TestGenerationOptions } from '../typescript.js';
import type { Spec, Requirement, Scenario } from '@specsafe/core';

function makeSpec(overrides: Partial<Spec> = {}): Spec {
  return {
    id: 'SPEC-001',
    name: 'Test Spec',
    description: 'A test spec',
    stage: 'spec',
    createdAt: new Date(),
    updatedAt: new Date(),
    requirements: [],
    testFiles: [],
    implementationFiles: [],
    metadata: { author: 'Test', project: 'Test', tags: [] },
    ...overrides
  };
}

describe('TypeScriptTestGenerator', () => {
  let generator: TypeScriptTestGenerator;

  beforeEach(() => {
    generator = new TypeScriptTestGenerator();
  });

  describe('generate', () => {
    it('should produce valid vitest imports', () => {
      const output = generator.generate(makeSpec());
      expect(output).toContain("import { describe, it, expect } from 'vitest';");
    });

    it('should create describe block with spec name', () => {
      const output = generator.generate(makeSpec({ name: 'User Authentication' }));
      expect(output).toContain("describe('User Authentication', () => {");
    });

    it('should create nested describe blocks per requirement', () => {
      const requirement: Requirement = {
        id: 'FR-001',
        text: 'Login functionality',
        priority: 'P0',
        scenarios: [{
          id: 'SC-1',
          given: 'user is on login page',
          when: 'user enters valid credentials',
          thenOutcome: 'user is redirected to dashboard'
        }]
      };

      const output = generator.generate(makeSpec({
        name: 'User Authentication',
        requirements: [requirement]
      }));

      expect(output).toContain("describe('[FR-001] Login functionality', () => {");
      expect(output).toContain("it('user is redirected to dashboard'");
    });

    it('should create it() blocks for each scenario within requirement', () => {
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

      const output = generator.generate(makeSpec({
        name: 'User Authentication',
        requirements: [requirement]
      }));

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

      const output = generator.generate(makeSpec({
        name: 'Logout Test',
        requirements: [requirement]
      }));

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

      const genWithoutComments = new TypeScriptTestGenerator({ includeComments: false });
      const output = genWithoutComments.generate(makeSpec({
        name: 'Logout Test',
        requirements: [requirement]
      }));

      expect(output).not.toContain('// GIVEN:');
      expect(output).not.toContain('// WHEN:');
      expect(output).not.toContain('// THEN:');
    });

    it('should include Arrange/Act/Assert comments in placeholders', () => {
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

      const output = generator.generate(makeSpec({ requirements: [requirement] }));

      expect(output).toContain('// Arrange');
      expect(output).toContain('// Act');
      expect(output).toContain('// Assert');
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

      const genWithoutPlaceholders = new TypeScriptTestGenerator({ generatePlaceholders: false });
      const output = genWithoutPlaceholders.generate(makeSpec({ requirements: [requirement] }));

      expect(output).not.toContain('expect(true).toBe(true)');
    });
  });

  describe('requirement without scenarios', () => {
    it('should generate stub test for requirement without scenarios', () => {
      const requirement: Requirement = {
        id: 'FR-002',
        text: 'Password reset via email',
        priority: 'P1',
        scenarios: []
      };

      const output = generator.generate(makeSpec({ requirements: [requirement] }));

      expect(output).toContain("describe('[FR-002] Password reset via email', () => {");
      expect(output).toContain("it('should password reset via email'");
      expect(output).toContain('// TODO: Implement test for requirement FR-002');
      expect(output).toContain('// Verify: Password reset via email');
    });

    it('should handle mix of requirements with and without scenarios', () => {
      const reqWithScenarios: Requirement = {
        id: 'FR-001',
        text: 'User login',
        priority: 'P0',
        scenarios: [{
          id: 'SC-1',
          given: 'valid credentials',
          when: 'user logs in',
          thenOutcome: 'user is authenticated'
        }]
      };

      const reqWithoutScenarios: Requirement = {
        id: 'FR-002',
        text: 'Password reset',
        priority: 'P1',
        scenarios: []
      };

      const output = generator.generate(makeSpec({
        requirements: [reqWithScenarios, reqWithoutScenarios]
      }));

      expect(output).toContain("describe('[FR-001] User login', () => {");
      expect(output).toContain("it('user is authenticated'");
      expect(output).toContain("describe('[FR-002] Password reset', () => {");
      expect(output).toContain("it('should password reset'");
    });
  });

  describe('generateRequirementTest', () => {
    it('should generate test with requirement details', () => {
      const req: Requirement = {
        id: 'FR-005',
        text: 'Data export to CSV',
        priority: 'P2',
        scenarios: []
      };

      const output = generator.generateRequirementTest(req);

      expect(output).toContain("it('should data export to csv'");
      expect(output).toContain('// TODO: Implement test for requirement FR-005');
      expect(output).toContain('// Verify: Data export to CSV');
    });

    it('should not include placeholder body when generatePlaceholders is false', () => {
      const gen = new TypeScriptTestGenerator({ generatePlaceholders: false });
      const req: Requirement = {
        id: 'FR-005',
        text: 'Data export',
        priority: 'P2',
        scenarios: []
      };

      const output = gen.generateRequirementTest(req);

      expect(output).toContain("it('should data export'");
      expect(output).not.toContain('// TODO');
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
      const output = generator.generate(makeSpec({ name: "User's Profile (Test)" }));
      expect(output).toContain("describe('User\\'s Profile (Test)', () => {");
    });

    it('should handle backslashes in content', () => {
      const output = generator.generate(makeSpec({ name: 'Path\\Test' }));
      expect(output).toContain("describe('Path\\\\Test'");
    });

    it('should handle newlines in content', () => {
      const output = generator.generate(makeSpec({ name: 'Line1\nLine2' }));
      expect(output).toContain("describe('Line1\\nLine2'");
    });
  });

  describe('scenarioToTestName', () => {
    it('should remove "then " prefix from test name', () => {
      const requirement: Requirement = {
        id: 'REQ-1',
        text: 'Test',
        priority: 'P0',
        scenarios: [{
          id: 'SC-1',
          given: 'condition',
          when: 'action',
          thenOutcome: 'then result happens'
        }]
      };

      const output = generator.generate(makeSpec({ requirements: [requirement] }));

      expect(output).toContain("it('result happens'");
      expect(output).not.toContain("it('then result happens'");
    });

    it('should remove trailing period from test name', () => {
      const requirement: Requirement = {
        id: 'REQ-1',
        text: 'Test',
        priority: 'P0',
        scenarios: [{
          id: 'SC-1',
          given: 'condition',
          when: 'action',
          thenOutcome: 'result happens.'
        }]
      };

      const output = generator.generate(makeSpec({ requirements: [requirement] }));

      expect(output).toContain("it('result happens'");
    });
  });

  describe('framework option', () => {
    it('should use Jest imports when framework is jest', () => {
      const jestGenerator = new TypeScriptTestGenerator({ framework: 'jest' });
      const output = jestGenerator.generate(makeSpec({ name: 'Jest Test' }));
      expect(output).toContain("import { describe, it, expect } from '@jest/globals';");
    });
  });
});
