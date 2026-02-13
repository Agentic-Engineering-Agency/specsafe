/**
 * Test Guide Generator
 * Creates human-readable test guides from specs
 */

import type {
  TestGuide,
  TestScenario,
  TestStep,
  GuideGenerationOptions
} from './types.js';

import type {
  Spec,
  Requirement,
  Scenario as SpecScenario
} from '../types.js';

import { convertToPlaywrightScenarios, generatePlaywrightScript } from './playwright.js';

/**
 * Generate a test guide from a spec
 */
export function generateGuide(
  spec: Spec,
  options: GuideGenerationOptions = {}
): TestGuide {
  const {
    includePrerequisites = true,
    scenarioFilter,
    priorityFilter = ['P0', 'P1', 'P2']
  } = options;

  const scenarios: TestScenario[] = [];

  for (const req of spec.requirements) {
    if (!priorityFilter.includes(req.priority)) continue;

    for (const specScenario of req.scenarios) {
      const scenarioId = `${req.id}-${specScenario.id}`;
      if (scenarioFilter && !scenarioFilter.includes(scenarioId)) continue;

      scenarios.push(convertSpecScenarioToTestScenario(scenarioId, req, specScenario));
    }
  }

  scenarios.sort((a, b) => {
    const priorityOrder: Record<string, number> = { P0: 0, P1: 1, P2: 2 };
    return (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
  });

  return {
    specId: spec.id,
    specName: spec.name,
    version: '1.0.0',
    createdAt: new Date(),
    updatedAt: new Date(),
    scenarios,
    globalPrerequisites: includePrerequisites ? generatePrerequisites(spec) : [],
    setupInstructions: generateSetupInstructions(spec),
    cleanupInstructions: generateCleanupInstructions(spec)
  };
}

function convertSpecScenarioToTestScenario(
  scenarioId: string,
  requirement: Requirement,
  specScenario: SpecScenario
): TestScenario {
  const steps: TestStep[] = [
    {
      id: `${scenarioId}-step-1`,
      order: 1,
      description: 'Setup test preconditions',
      action: `Ensure: ${specScenario.given}`,
      expectedResult: `Precondition "${specScenario.given}" is met`,
      screenshotRequired: false,
      notes: 'Verify the system is in the correct initial state'
    },
    {
      id: `${scenarioId}-step-2`,
      order: 2,
      description: 'Execute test action',
      action: specScenario.when,
      expectedResult: 'Action completes without errors',
      screenshotRequired: true,
      notes: 'Take screenshot during or immediately after action'
    },
    {
      id: `${scenarioId}-step-3`,
      order: 3,
      description: 'Verify expected outcome',
      action: `Check that: ${specScenario.thenOutcome}`,
      expectedResult: specScenario.thenOutcome,
      screenshotRequired: true,
      notes: 'Final state verification screenshot'
    }
  ];

  return {
    id: scenarioId,
    name: `${requirement.id}: ${specScenario.given}`,
    description: `Testing: ${requirement.text}`,
    prerequisites: [requirement.text],
    steps,
    priority: requirement.priority
  };
}

function generatePrerequisites(spec: Spec): string[] {
  return [
    'Application is running in test environment',
    'Test data is prepared and available',
    'User has appropriate permissions',
    `Spec ${spec.id} implementation is deployed`,
    ...spec.requirements.map(r => `[${r.priority}] ${r.text}`)
  ];
}

function generateSetupInstructions(spec: Spec): string[] {
  return [
    `## Setup for ${spec.name}`,
    '',
    '1. Ensure the application is running',
    `2. Navigate to the feature area for: ${spec.description}`,
    '3. Clear browser cache if testing UI changes',
    '4. Prepare any required test data',
    ''
  ];
}

function generateCleanupInstructions(_spec: Spec): string[] {
  return [
    '## Cleanup Instructions',
    '',
    '1. Remove any test data created during testing',
    '2. Log out of test accounts',
    '3. Reset application state if needed',
    '4. Archive screenshots with test results',
    ''
  ];
}

export function formatGuideAsMarkdown(guide: TestGuide): string {
  const lines: string[] = [];

  lines.push(`# E2E Test Guide: ${guide.specName}`);
  lines.push('');
  lines.push(`**Spec ID:** ${guide.specId}`);
  lines.push(`**Version:** ${guide.version}`);
  lines.push(`**Generated:** ${guide.createdAt.toISOString().split('T')[0]}`);
  lines.push('');

  if (guide.globalPrerequisites.length > 0) {
    lines.push('## Global Prerequisites');
    lines.push('');
    for (const prereq of guide.globalPrerequisites) lines.push(`- [ ] ${prereq}`);
    lines.push('');
  }

  if (guide.setupInstructions.length > 0) lines.push(...guide.setupInstructions);

  lines.push('## Test Scenarios');
  lines.push('');
  for (const scenario of guide.scenarios) {
    lines.push(formatScenarioAsMarkdown(scenario));
    lines.push('');
  }

  if (guide.cleanupInstructions) lines.push(...guide.cleanupInstructions);

  lines.push('---');
  lines.push('');
  lines.push('## Test Summary');
  lines.push('');
  lines.push(`- Total Scenarios: ${guide.scenarios.length}`);
  lines.push(`- Total Steps: ${guide.scenarios.reduce((sum, s) => sum + s.steps.length, 0)}`);
  lines.push(`- P0 (Critical): ${guide.scenarios.filter((s) => s.priority === 'P0').length}`);
  lines.push(`- P1 (High): ${guide.scenarios.filter((s) => s.priority === 'P1').length}`);
  lines.push(`- P2 (Normal): ${guide.scenarios.filter((s) => s.priority === 'P2').length}`);
  lines.push('');

  return lines.join('\n');
}

function formatScenarioAsMarkdown(scenario: TestScenario): string {
  const lines: string[] = [];
  const priorityBadge = scenario.priority === 'P0' ? '🔴' : scenario.priority === 'P1' ? '🟡' : '🟢';
  lines.push(`### ${priorityBadge} ${scenario.name}`);
  lines.push('');
  lines.push(`**ID:** ${scenario.id}`);
  lines.push(`**Priority:** ${scenario.priority}`);
  lines.push(`**Description:** ${scenario.description}`);
  lines.push('');

  if (scenario.prerequisites.length > 0) {
    lines.push('**Prerequisites:**');
    for (const prereq of scenario.prerequisites) lines.push(`- ${prereq}`);
    lines.push('');
  }

  lines.push('**Steps:**');
  lines.push('');
  for (const step of scenario.steps.sort((a, b) => a.order - b.order)) {
    const screenshotIcon = step.screenshotRequired ? '📸' : '';
    lines.push(`#### Step ${step.order}: ${step.description} ${screenshotIcon}`);
    lines.push('');
    lines.push(`- **Action:** ${step.action}`);
    lines.push(`- **Expected Result:** ${step.expectedResult}`);
    if (step.notes) lines.push(`- **Notes:** ${step.notes}`);
    if (step.screenshotRequired) {
      lines.push(`- **Screenshot Required:** ✅ Yes (save as \`${step.id}.png\`)`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function formatGuideAsJSON(guide: TestGuide): string {
  return JSON.stringify(guide, null, 2);
}

export function generateGuideContent(
  spec: Spec,
  options: GuideGenerationOptions = {}
): { content: string; format: 'markdown' | 'json' | 'js'; guide: TestGuide } {
  const guide = generateGuide(spec, options);
  const mode = options.mode ?? 'manual';

  if (mode === 'playwright') {
    const scenarios = convertToPlaywrightScenarios(guide);
    const content = generatePlaywrightScript(spec.id, scenarios);
    return { content, format: 'js', guide };
  }

  const format = options.format === 'json' ? 'json' : 'markdown';
  return {
    content: format === 'json' ? formatGuideAsJSON(guide) : formatGuideAsMarkdown(guide),
    format,
    guide
  };
}

export async function saveGuide(
  guide: TestGuide,
  format: 'markdown' | 'json' = 'markdown'
): Promise<string> {
  return format === 'markdown' ? formatGuideAsMarkdown(guide) : formatGuideAsJSON(guide);
}

export function filterScenariosByPriority(
  guide: TestGuide,
  priorities: ('P0' | 'P1' | 'P2')[]
): TestScenario[] {
  return guide.scenarios.filter(s => priorities.includes(s.priority));
}

export function getScreenshotSteps(guide: TestGuide): TestStep[] {
  const steps: TestStep[] = [];
  for (const scenario of guide.scenarios) {
    for (const step of scenario.steps) {
      if (step.screenshotRequired) steps.push(step);
    }
  }
  return steps;
}
