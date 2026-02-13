/**
 * Report Analyzer Tests
 */

import { describe, it, expect } from 'vitest';
import type { ScreenshotSubmission, ExpectedState, E2ETestResult } from '../types.js';
import {
  analyzeSingleSubmission,
  analyzeScreenshots,
  compareWithExpected,
  generateReport,
  generateFixSuggestions,
  suggestFixes,
  formatReportAsMarkdown,
  DEFAULT_ANALYSIS_CONFIG
} from '../report-analyzer.js';

describe('DEFAULT_ANALYSIS_CONFIG', () => {
  it('should have sensible defaults', () => {
    expect(DEFAULT_ANALYSIS_CONFIG.confidenceThreshold).toBe(0.7);
    expect(DEFAULT_ANALYSIS_CONFIG.autoApprovePassing).toBe(false);
    expect(DEFAULT_ANALYSIS_CONFIG.requireHumanReview).toBe(true);
    expect(DEFAULT_ANALYSIS_CONFIG.maxConcurrentAnalysis).toBe(3);
  });
});

describe('analyzeSingleSubmission', () => {
  const mockSubmission: ScreenshotSubmission = {
    scenarioId: 'SC-1',
    stepId: 'step-1',
    imagePath: '/path/to/screenshot.png',
    timestamp: new Date()
  };

  const mockExpected: ExpectedState = {
    scenarioId: 'SC-1',
    stepId: 'step-1',
    description: 'User sees dashboard',
    visualIndicators: ['welcome message', 'navigation menu'],
    elements: [
      { selector: '[data-testid="welcome"]', state: 'visible' }
    ]
  };

  it('should analyze a submission and return a result', async () => {
    const result = await analyzeSingleSubmission(mockSubmission, mockExpected);

    expect(result.scenarioId).toBe('SC-1');
    expect(result.stepId).toBe('step-1');
    expect(result.status).toBeDefined();
    expect(result.analysis).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(result.issues).toBeDefined();
    expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('should return pass status for normal filename', async () => {
    const result = await analyzeSingleSubmission(mockSubmission, mockExpected);

    expect(result.status).toBe('pass');
    expect(result.matchesExpected).toBe(true);
  });

  it('should return fail status for fail filename', async () => {
    const failSubmission: ScreenshotSubmission = {
      ...mockSubmission,
      imagePath: '/path/to/fail-screenshot.png'
    };

    const result = await analyzeSingleSubmission(failSubmission, mockExpected);

    expect(result.status).toBe('fail');
    expect(result.matchesExpected).toBe(false);
  });

  it('should return partial status for partial filename', async () => {
    const partialSubmission: ScreenshotSubmission = {
      ...mockSubmission,
      imagePath: '/path/to/partial-screenshot.png'
    };

    const result = await analyzeSingleSubmission(partialSubmission, mockExpected);

    expect(result.status).toBe('partial');
  });

  it('should return skipped status for skip filename', async () => {
    const skipSubmission: ScreenshotSubmission = {
      ...mockSubmission,
      imagePath: '/path/to/skip-screenshot.png'
    };

    const result = await analyzeSingleSubmission(skipSubmission, mockExpected);

    expect(result.status).toBe('skipped');
  });

  it('should include processing time', async () => {
    const result = await analyzeSingleSubmission(mockSubmission, mockExpected);

    expect(result.processingTimeMs).toBeDefined();
    expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('should reject invalid submissions', async () => {
    const badSubmission = { ...mockSubmission, imagePath: '' };
    await expect(analyzeSingleSubmission(badSubmission, mockExpected)).rejects.toThrow('imagePath');
  });
});

describe('analyzeScreenshots', () => {
  const mockSubmissions: ScreenshotSubmission[] = [
    { scenarioId: 'SC-1', stepId: 'step-1', imagePath: 'pass.png', timestamp: new Date() },
    { scenarioId: 'SC-1', stepId: 'step-2', imagePath: 'fail.png', timestamp: new Date() },
    { scenarioId: 'SC-2', stepId: 'step-1', imagePath: 'pass.png', timestamp: new Date() }
  ];

  const mockExpectedStates: ExpectedState[] = [
    { scenarioId: 'SC-1', stepId: 'step-1', description: 'Step 1' },
    { scenarioId: 'SC-1', stepId: 'step-2', description: 'Step 2' },
    { scenarioId: 'SC-2', stepId: 'step-1', description: 'Step 1' }
  ];

  it('should analyze all submissions', async () => {
    const results = await analyzeScreenshots(mockSubmissions, mockExpectedStates);

    expect(results).toHaveLength(3);
  });

  it('should match submissions to expected states', async () => {
    const results = await analyzeScreenshots(mockSubmissions, mockExpectedStates);

    expect(results[0].scenarioId).toBe('SC-1');
    expect(results[0].stepId).toBe('step-1');
    expect(results[1].scenarioId).toBe('SC-1');
    expect(results[1].stepId).toBe('step-2');
  });

  it('should handle submissions without matching expected states', async () => {
    const incompleteSubmissions: ScreenshotSubmission[] = [
      { scenarioId: 'SC-3', stepId: 'step-1', imagePath: 'pass.png', timestamp: new Date() }
    ];

    const results = await analyzeScreenshots(incompleteSubmissions, mockExpectedStates);

    expect(results).toHaveLength(1);
    expect(results[0].status).toBeDefined();
  });
});

describe('compareWithExpected', () => {
  const mockSubmission: ScreenshotSubmission = {
    scenarioId: 'SC-1',
    stepId: 'step-1',
    imagePath: '/path/to/screenshot.png',
    timestamp: new Date()
  };

  const mockExpected: ExpectedState = {
    scenarioId: 'SC-1',
    stepId: 'step-1',
    description: 'Expected state',
    visualIndicators: ['indicator-1', 'indicator-2']
  };

  it('should return match for normal filename', () => {
    const comparison = compareWithExpected(mockSubmission, mockExpected);

    expect(comparison.matches).toBe(true);
    expect(comparison.differences).toHaveLength(0);
  });

  it('should return no match for fail filename', () => {
    const failSubmission: ScreenshotSubmission = {
      ...mockSubmission,
      imagePath: '/path/to/fail.png'
    };

    const comparison = compareWithExpected(failSubmission, mockExpected);

    expect(comparison.matches).toBe(false);
    expect(comparison.differences.length).toBeGreaterThan(0);
  });

  it('should include expected description in differences when failing', () => {
    const failSubmission: ScreenshotSubmission = {
      ...mockSubmission,
      imagePath: '/path/to/fail.png'
    };

    const comparison = compareWithExpected(failSubmission, mockExpected);

    expect(comparison.differences.some(d => d.includes('Expected state'))).toBe(true);
  });

  it('should list missing visual indicators when failing', () => {
    const failSubmission: ScreenshotSubmission = {
      ...mockSubmission,
      imagePath: '/path/to/fail.png'
    };

    const comparison = compareWithExpected(failSubmission, mockExpected);

    expect(comparison.differences.some(d => d.includes('indicator-1'))).toBe(true);
  });
});

describe('generateReport', () => {
  const mockSubmissions: ScreenshotSubmission[] = [
    { scenarioId: 'SC-1', stepId: 'step-1', imagePath: 'pass.png', timestamp: new Date() },
    { scenarioId: 'SC-1', stepId: 'step-2', imagePath: 'fail.png', timestamp: new Date() },
    { scenarioId: 'SC-2', stepId: 'step-1', imagePath: 'pass.png', timestamp: new Date() }
  ];

  const mockExpectedStates: ExpectedState[] = [
    { scenarioId: 'SC-1', stepId: 'step-1', description: 'Step 1' },
    { scenarioId: 'SC-1', stepId: 'step-2', description: 'Step 2' },
    { scenarioId: 'SC-2', stepId: 'step-1', description: 'Step 1' }
  ];

  it('should generate a complete test report', async () => {
    const report = await generateReport(
      'SPEC-001',
      'Test User',
      mockSubmissions,
      mockExpectedStates
    );

    expect(report.specId).toBe('SPEC-001');
    expect(report.submittedBy).toBe('Test User');
    expect(report.reportId).toBeDefined();
    expect(report.createdAt).toBeInstanceOf(Date);
    expect(report.results).toHaveLength(3);
  });

  it('should calculate summary statistics', async () => {
    const report = await generateReport(
      'SPEC-001',
      'Test User',
      mockSubmissions,
      mockExpectedStates
    );

    expect(report.summary.totalSteps).toBe(3);
    expect(report.summary.passed).toBe(2);
    expect(report.summary.failed).toBe(1);
    expect(report.summary.passRate).toBeCloseTo(0.67, 1);
  });

  it('should count unique scenarios', async () => {
    const report = await generateReport(
      'SPEC-001',
      'Test User',
      mockSubmissions,
      mockExpectedStates
    );

    expect(report.summary.totalScenarios).toBe(2);
  });

  it('should generate recommendations', async () => {
    const report = await generateReport(
      'SPEC-001',
      'Test User',
      mockSubmissions,
      mockExpectedStates
    );

    expect(report.recommendations).toBeDefined();
    expect(report.recommendations!.length).toBeGreaterThan(0);
  });

  it('should generate fix suggestions for failures', async () => {
    const report = await generateReport(
      'SPEC-001',
      'Test User',
      mockSubmissions,
      mockExpectedStates
    );

    expect(report.fixSuggestions).toBeDefined();
    expect(report.fixSuggestions!.length).toBeGreaterThan(0);
  });
});

describe('generateFixSuggestions', () => {
  const mockResults: E2ETestResult[] = [
    {
      scenarioId: 'SC-1',
      stepId: 'step-1',
      status: 'pass',
      analysis: 'All good',
      confidence: 0.95,
      matchesExpected: true,
      issues: []
    },
    {
      scenarioId: 'SC-1',
      stepId: 'step-2',
      status: 'fail',
      analysis: 'Visual mismatch',
      confidence: 0.85,
      matchesExpected: false,
      issues: [
        {
          severity: 'high',
          description: 'Button not visible',
          category: 'ui',
          suggestion: 'Check CSS visibility'
        }
      ]
    },
    {
      scenarioId: 'SC-2',
      stepId: 'step-1',
      status: 'partial',
      analysis: 'Incomplete',
      confidence: 0.65,
      matchesExpected: false,
      issues: [
        {
          severity: 'medium',
          description: 'Missing element',
          category: 'functional'
        }
      ]
    }
  ];

  it('should generate suggestions only for non-passing results', () => {
    const suggestions = generateFixSuggestions(mockResults);

    expect(suggestions.length).toBe(2);
    expect(suggestions.every(s => s.scenarioId !== 'SC-1' || s.stepId !== 'step-1')).toBe(true);
  });

  it('should include issue description and suggestion', () => {
    const suggestions = generateFixSuggestions(mockResults);

    const highPrioritySuggestion = suggestions.find(s => s.priority === 'P0');
    expect(highPrioritySuggestion).toBeDefined();
    expect(highPrioritySuggestion!.issue).toBe('Button not visible');
    expect(highPrioritySuggestion!.suggestion).toBe('Check CSS visibility');
  });

  it('should set priority based on issue severity', () => {
    const suggestions = generateFixSuggestions(mockResults);

    expect(suggestions.some(s => s.priority === 'P0')).toBe(true); // high severity
    expect(suggestions.some(s => s.priority === 'P1')).toBe(true); // medium severity
  });

  it('should include code examples for UI issues', () => {
    const suggestions = generateFixSuggestions(mockResults);

    const uiSuggestion = suggestions.find(s => s.issue === 'Button not visible');
    expect(uiSuggestion).toBeDefined();
    expect(uiSuggestion!.codeExample).toBeDefined();
    expect(uiSuggestion!.codeExample).toContain('waitForSelector');
  });
});

describe('suggestFixes', () => {
  it('should be an alias for generateFixSuggestions', () => {
    const mockResults: E2ETestResult[] = [
      {
        scenarioId: 'SC-1',
        stepId: 'step-1',
        status: 'fail',
        analysis: 'Failed',
        confidence: 0.5,
        matchesExpected: false,
        issues: [
          { severity: 'high', description: 'Error', category: 'functional' }
        ]
      }
    ];

    const fromGenerate = generateFixSuggestions(mockResults);
    const fromSuggest = suggestFixes(mockResults);

    expect(fromSuggest).toEqual(fromGenerate);
  });
});

describe('formatReportAsMarkdown', () => {
  const mockReport = {
    specId: 'SPEC-001',
    reportId: 'report-123',
    submittedBy: 'Test User',
    createdAt: new Date('2026-02-12T10:00:00Z'),
    completedAt: new Date('2026-02-12T10:05:00Z'),
    results: [
      {
        scenarioId: 'SC-1',
        stepId: 'step-1',
        status: 'pass' as const,
        analysis: 'All checks passed',
        confidence: 0.95,
        matchesExpected: true,
        issues: []
      },
      {
        scenarioId: 'SC-1',
        stepId: 'step-2',
        status: 'fail' as const,
        analysis: 'Visual mismatch detected',
        confidence: 0.85,
        matchesExpected: false,
        issues: [
          {
            severity: 'high' as const,
            description: 'Button not visible',
            category: 'ui' as const,
            suggestion: 'Check CSS visibility'
          }
        ]
      }
    ],
    summary: {
      totalScenarios: 1,
      totalSteps: 2,
      passed: 1,
      failed: 1,
      partial: 0,
      skipped: 0,
      passRate: 0.5,
      criticalIssues: 0,
      highIssues: 1,
      mediumIssues: 0,
      lowIssues: 0
    },
    status: 'completed' as const,
    recommendations: ['Fix the failing test'],
    fixSuggestions: [
      {
        scenarioId: 'SC-1',
        stepId: 'step-2',
        issue: 'Button not visible',
        suggestion: 'Check CSS visibility',
        priority: 'P0' as const,
        codeExample: '// Fix code here'
      }
    ]
  };

  it('should format report as markdown', () => {
    const markdown = formatReportAsMarkdown(mockReport);

    expect(markdown).toContain('# Test Report: SPEC-001');
    expect(markdown).toContain('**Report ID:** report-123');
    expect(markdown).toContain('**Submitted By:** Test User');
  });

  it('should include summary table', () => {
    const markdown = formatReportAsMarkdown(mockReport);

    expect(markdown).toContain('## Summary');
    expect(markdown).toContain('| Total Scenarios | 1 |');
    expect(markdown).toContain('| Pass Rate | 50.0% |');
  });

  it('should include issues section when issues exist', () => {
    const markdown = formatReportAsMarkdown(mockReport);

    expect(markdown).toContain('## Issues Found');
    expect(markdown).toContain('| 🟠 High | 1 |');
  });

  it('should include detailed results', () => {
    const markdown = formatReportAsMarkdown(mockReport);

    expect(markdown).toContain('## Detailed Results');
    expect(markdown).toContain('### ✅ SC-1 - Step step-1');
    expect(markdown).toContain('### ❌ SC-1 - Step step-2');
  });

  it('should include fix suggestions', () => {
    const markdown = formatReportAsMarkdown(mockReport);

    expect(markdown).toContain('## Suggested Fixes');
    expect(markdown).toContain('### 🔴 SC-1 - step-2');
    expect(markdown).toContain('```typescript');
    expect(markdown).toContain('// Fix code here');
  });

  it('should include recommendations', () => {
    const markdown = formatReportAsMarkdown(mockReport);

    expect(markdown).toContain('## Recommendations');
    expect(markdown).toContain('- Fix the failing test');
  });
});
