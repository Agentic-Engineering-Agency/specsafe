/**
 * Guide Generator Tests
 */

import { describe, it, expect } from 'vitest';
import type { Spec, Requirement, Scenario } from '../../types.js';
import {
  generateGuide,
  formatGuideAsMarkdown,
  formatGuideAsJSON,
  filterScenariosByPriority,
  getScreenshotSteps
} from '../guide-generator.js';

describe('generateGuide', () => {
  const mockSpec: Spec = {
    id: 'SPEC-20260212-001',
    name: 'Test Feature',
    description: 'A test feature for E2E testing',
    stage: 'spec',
    createdAt: new Date('2026-02-12'),
    updatedAt: new Date('2026-02-12'),
    requirements: [
      {
        id: 'FR-1',
        text: 'User can log in with valid credentials',
        priority: 'P0',
        scenarios: [
          {
            id: 'SC-1',
            given: 'user is on login page',
            when: 'user enters valid credentials and clicks login',
            thenOutcome: 'user is redirected to dashboard'
          }
        ]
      },
      {
        id: 'FR-2',
        text: 'User sees error with invalid credentials',
        priority: 'P1',
        scenarios: [
          {
            id: 'SC-1',
            given: 'user is on login page',
            when: 'user enters invalid credentials',
            thenOutcome: 'error message is displayed'
          }
        ]
      }
    ],
    testFiles: [],
    implementationFiles: [],
    metadata: {
      author: 'Test Author',
      project: 'Test Project',
      tags: ['test', 'e2e']
    }
  };

  it('should generate a test guide from a spec', () => {
    const guide = generateGuide(mockSpec);

    expect(guide.specId).toBe('SPEC-20260212-001');
    expect(guide.specName).toBe('Test Feature');
    expect(guide.scenarios).toHaveLength(2);
    expect(guide.version).toBe('1.0.0');
  });

  it('should include all scenarios from spec requirements', () => {
    const guide = generateGuide(mockSpec);

    expect(guide.scenarios).toHaveLength(2);
    const ids = guide.scenarios.map(s => s.id).sort();
    expect(ids).toEqual(['FR-1-SC-1', 'FR-2-SC-1']);
  });

  it('should convert spec scenarios to test scenarios with steps', () => {
    const guide = generateGuide(mockSpec);
    const scenario = guide.scenarios[0];

    expect(scenario.steps).toHaveLength(3);
    expect(scenario.steps[0].order).toBe(1);
    expect(scenario.steps[0].description).toBe('Setup test preconditions');
    expect(scenario.steps[1].screenshotRequired).toBe(true);
    expect(scenario.steps[2].screenshotRequired).toBe(true);
  });

  it('should filter by priority when specified', () => {
    const guide = generateGuide(mockSpec, { priorityFilter: ['P0'] });

    expect(guide.scenarios).toHaveLength(1);
    expect(guide.scenarios[0].priority).toBe('P0');
  });

  it('should sort scenarios by priority (P0 first)', () => {
    // Add a P2 scenario
    const specWithP2: Spec = {
      ...mockSpec,
      requirements: [
        ...mockSpec.requirements,
        {
          id: 'FR-3',
          text: 'Optional feature',
          priority: 'P2',
          scenarios: [{
            id: 'SC-1',
            given: 'optional condition',
            when: 'optional action',
            thenOutcome: 'optional result'
          }]
        }
      ]
    };

    const guide = generateGuide(specWithP2);

    expect(guide.scenarios[0].priority).toBe('P0');
    expect(guide.scenarios[1].priority).toBe('P1');
    expect(guide.scenarios[2].priority).toBe('P2');
  });

  it('should include global prerequisites by default', () => {
    const guide = generateGuide(mockSpec);

    expect(guide.globalPrerequisites.length).toBeGreaterThan(0);
    expect(guide.globalPrerequisites).toContain('Application is running in test environment');
    expect(guide.globalPrerequisites.some(p => p.includes('User can log in'))).toBe(true);
  });

  it('should exclude prerequisites when option is false', () => {
    const guide = generateGuide(mockSpec, { includePrerequisites: false });

    expect(guide.globalPrerequisites).toHaveLength(0);
  });

  it('should generate setup instructions', () => {
    const guide = generateGuide(mockSpec);

    expect(guide.setupInstructions.length).toBeGreaterThan(0);
    expect(guide.setupInstructions.some(i => i.includes('Test Feature'))).toBe(true);
  });

  it('should generate cleanup instructions', () => {
    const guide = generateGuide(mockSpec);

    expect(guide.cleanupInstructions).toBeDefined();
    expect(guide.cleanupInstructions!.some(i => i.includes('Cleanup'))).toBe(true);
  });
});

describe('formatGuideAsMarkdown', () => {
  const mockGuide = {
    specId: 'SPEC-001',
    specName: 'Test Guide',
    version: '1.0.0',
    createdAt: new Date('2026-02-12'),
    updatedAt: new Date('2026-02-12'),
    scenarios: [
      {
        id: 'SC-1',
        name: 'Test Scenario',
        description: 'A test scenario',
        prerequisites: ['Precondition 1'],
        priority: 'P0' as const,
        steps: [
          {
            id: 'step-1',
            order: 1,
            description: 'First step',
            action: 'Do something',
            expectedResult: 'Something happens',
            screenshotRequired: true,
            notes: 'Take a screenshot'
          }
        ]
      }
    ],
    globalPrerequisites: ['Global precondition'],
    setupInstructions: ['Setup 1'],
    cleanupInstructions: ['Cleanup 1']
  };

  it('should format guide as markdown', () => {
    const markdown = formatGuideAsMarkdown(mockGuide);

    expect(markdown).toContain('# E2E Test Guide: Test Guide');
    expect(markdown).toContain('**Spec ID:** SPEC-001');
    expect(markdown).toContain('## Test Scenarios');
    expect(markdown).toContain('### 🔴 Test Scenario');
  });

  it('should include scenario steps in markdown', () => {
    const markdown = formatGuideAsMarkdown(mockGuide);

    expect(markdown).toContain('#### Step 1: First step 📸');
    expect(markdown).toContain('- **Action:** Do something');
    expect(markdown).toContain('- **Expected Result:** Something happens');
    expect(markdown).toContain('**Screenshot Required:** ✅ Yes');
  });

  it('should include checkboxes for prerequisites', () => {
    const markdown = formatGuideAsMarkdown(mockGuide);

    expect(markdown).toContain('- [ ] Global precondition');
  });

  it('should include summary statistics', () => {
    const markdown = formatGuideAsMarkdown(mockGuide);

    expect(markdown).toContain('## Test Summary');
    expect(markdown).toContain('- Total Scenarios: 1');
    expect(markdown).toContain('- P0 (Critical): 1');
  });
});

describe('formatGuideAsJSON', () => {
  const mockGuide = {
    specId: 'SPEC-001',
    specName: 'Test Guide',
    version: '1.0.0',
    createdAt: new Date('2026-02-12'),
    updatedAt: new Date('2026-02-12'),
    scenarios: [],
    globalPrerequisites: [],
    setupInstructions: []
  };

  it('should format guide as JSON', () => {
    const json = formatGuideAsJSON(mockGuide as any);
    const parsed = JSON.parse(json);

    expect(parsed.specId).toBe('SPEC-001');
    expect(parsed.specName).toBe('Test Guide');
    expect(parsed.scenarios).toEqual([]);
  });
});

describe('filterScenariosByPriority', () => {
  const mockGuide = {
    specId: 'SPEC-001',
    specName: 'Test Guide',
    version: '1.0.0',
    createdAt: new Date(),
    updatedAt: new Date(),
    scenarios: [
      { id: 'SC-1', name: 'P0 Scenario', priority: 'P0', prerequisites: [], steps: [], description: '' },
      { id: 'SC-2', name: 'P1 Scenario', priority: 'P1', prerequisites: [], steps: [], description: '' },
      { id: 'SC-3', name: 'P2 Scenario', priority: 'P2', prerequisites: [], steps: [], description: '' }
    ],
    globalPrerequisites: [],
    setupInstructions: []
  };

  it('should filter scenarios by single priority', () => {
    const filtered = filterScenariosByPriority(mockGuide as any, ['P0']);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('SC-1');
  });

  it('should filter scenarios by multiple priorities', () => {
    const filtered = filterScenariosByPriority(mockGuide as any, ['P0', 'P1']);

    expect(filtered).toHaveLength(2);
    expect(filtered.some(s => s.priority === 'P2')).toBe(false);
  });

  it('should return empty array for no matches', () => {
    const filtered = filterScenariosByPriority(mockGuide as any, []);

    expect(filtered).toHaveLength(0);
  });
});

describe('getScreenshotSteps', () => {
  const mockGuide = {
    specId: 'SPEC-001',
    specName: 'Test Guide',
    version: '1.0.0',
    createdAt: new Date(),
    updatedAt: new Date(),
    scenarios: [
      {
        id: 'SC-1',
        name: 'Scenario 1',
        description: '',
        prerequisites: [],
        priority: 'P0' as const,
        steps: [
          { id: 'step-1', order: 1, description: 'No screenshot', action: '', expectedResult: '', screenshotRequired: false },
          { id: 'step-2', order: 2, description: 'With screenshot', action: '', expectedResult: '', screenshotRequired: true }
        ]
      },
      {
        id: 'SC-2',
        name: 'Scenario 2',
        description: '',
        prerequisites: [],
        priority: 'P1' as const,
        steps: [
          { id: 'step-3', order: 1, description: 'Another screenshot', action: '', expectedResult: '', screenshotRequired: true }
        ]
      }
    ],
    globalPrerequisites: [],
    setupInstructions: []
  };

  it('should return only steps requiring screenshots', () => {
    const steps = getScreenshotSteps(mockGuide as any);

    expect(steps).toHaveLength(2);
    expect(steps.every(s => s.screenshotRequired)).toBe(true);
  });

  it('should include steps from all scenarios', () => {
    const steps = getScreenshotSteps(mockGuide as any);

    expect(steps.some(s => s.id === 'step-2')).toBe(true);
    expect(steps.some(s => s.id === 'step-3')).toBe(true);
  });
});
