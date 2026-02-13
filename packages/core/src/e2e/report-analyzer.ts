/**
 * Report Analyzer
 * AI-powered analysis of test screenshots and generation of test reports
 */

import type {
  ScreenshotSubmission,
  TestReport,
  E2ETestResult,
  TestStatus,
  TestIssue,
  ExpectedState,
  FixSuggestion,
  AnalysisConfig,
  TestReportSummary
} from './types.js';

/**
 * Default analysis configuration
 */
export const DEFAULT_ANALYSIS_CONFIG: AnalysisConfig = {
  confidenceThreshold: 0.7,
  autoApprovePassing: false,
  requireHumanReview: true,
  maxConcurrentAnalysis: 3
};

/**
 * Analyze a batch of screenshot submissions
 */
export async function analyzeScreenshots(
  submissions: ScreenshotSubmission[],
  expectedStates: ExpectedState[],
  config: AnalysisConfig = DEFAULT_ANALYSIS_CONFIG
): Promise<E2ETestResult[]> {
  const results: E2ETestResult[] = [];
  
  for (const submission of submissions) {
    const expected = expectedStates.find(
      e => e.scenarioId === submission.scenarioId && e.stepId === submission.stepId
    );
    
    const result = await analyzeSingleSubmission(submission, expected, config);
    results.push(result);
  }
  
  return results;
}

/**
 * Analyze a single screenshot submission
 * This is a mock implementation - in production, this would use a vision API
 */
export async function analyzeSingleSubmission(
  submission: ScreenshotSubmission,
  expected?: ExpectedState,
  config: AnalysisConfig = DEFAULT_ANALYSIS_CONFIG
): Promise<E2ETestResult> {
  const startTime = Date.now();
  
  // Mock analysis - in production, this would:
  // 1. Load the image from submission.imagePath
  // 2. Send to vision API with expected state description
  // 3. Parse the response
  
  const mockAnalysis = generateMockAnalysis(submission, expected);
  const issues = generateMockIssues(submission, mockAnalysis.status);
  
  return {
    scenarioId: submission.scenarioId,
    stepId: submission.stepId,
    status: mockAnalysis.status,
    analysis: mockAnalysis.description,
    confidence: mockAnalysis.confidence,
    issues,
    matchesExpected: mockAnalysis.status === 'pass',
    processingTimeMs: Date.now() - startTime
  };
}

/**
 * Generate mock analysis (for testing without vision API)
 */
function generateMockAnalysis(
  submission: ScreenshotSubmission,
  expected?: ExpectedState
): { status: TestStatus; description: string; confidence: number } {
  // Simple heuristic based on filename for deterministic mock results
  const filename = submission.imagePath.toLowerCase();
  
  if (filename.includes('fail') || filename.includes('error')) {
    return {
      status: 'fail',
      description: expected 
        ? `Screenshot shows state that does not match expected: ${expected.description}. Visual elements appear incorrect.`
        : 'Screenshot indicates failure state. UI elements show errors or unexpected behavior.',
      confidence: 0.85
    };
  }
  
  if (filename.includes('partial') || filename.includes('wip')) {
    return {
      status: 'partial',
      description: expected
        ? `Screenshot partially matches expected state: ${expected.description}. Some elements are correct but others are missing or incorrect.`
        : 'Screenshot shows partial completion. Some expected elements are present but implementation is incomplete.',
      confidence: 0.65
    };
  }
  
  if (filename.includes('skip')) {
    return {
      status: 'skipped',
      description: 'Step was skipped during testing.',
      confidence: 1.0
    };
  }
  
  // Default to pass
  return {
    status: 'pass',
    description: expected
      ? `Screenshot matches expected state: ${expected.description}. All visual indicators are present and correct.`
      : 'Screenshot appears to show correct implementation. No obvious issues detected.',
    confidence: 0.92
  };
}

/**
 * Generate mock issues based on status
 */
function generateMockIssues(
  submission: ScreenshotSubmission,
  status: TestStatus
): TestIssue[] {
  const issues: TestIssue[] = [];
  
  if (status === 'fail') {
    issues.push({
      severity: 'high',
      description: 'Visual state does not match expected outcome',
      category: 'ui',
      suggestion: 'Review the implementation against the spec requirements'
    });
  }
  
  if (status === 'partial') {
    issues.push({
      severity: 'medium',
      description: 'Implementation is incomplete',
      category: 'functional',
      suggestion: 'Complete the missing functionality before retesting'
    });
  }
  
  return issues;
}

/**
 * Compare a submission against expected state
 */
export function compareWithExpected(
  submission: ScreenshotSubmission,
  expected: ExpectedState
): { matches: boolean; differences: string[] } {
  // In production, this would perform detailed image analysis
  // For now, we return a mock comparison
  
  const differences: string[] = [];
  
  // Check filename for mock behavior
  const filename = submission.imagePath.toLowerCase();
  
  if (filename.includes('fail')) {
    differences.push(`Expected: ${expected.description}`);
    differences.push('Found: Different visual state');
    
    if (expected.visualIndicators) {
      differences.push(`Missing indicators: ${expected.visualIndicators.join(', ')}`);
    }
  }
  
  return {
    matches: differences.length === 0,
    differences
  };
}

/**
 * Generate a complete test report from submissions
 */
export async function generateReport(
  specId: string,
  submittedBy: string,
  submissions: ScreenshotSubmission[],
  expectedStates: ExpectedState[],
  config: AnalysisConfig = DEFAULT_ANALYSIS_CONFIG
): Promise<TestReport> {
  const reportId = `report-${Date.now()}`;
  const createdAt = new Date();
  
  // Analyze all submissions
  const results = await analyzeScreenshots(submissions, expectedStates, config);
  
  // Generate summary
  const summary = generateSummary(results);
  
  // Generate suggestions for failed tests
  const fixSuggestions = generateFixSuggestions(results);
  
  // Generate recommendations
  const recommendations = generateRecommendations(results, summary);
  
  return {
    specId,
    reportId,
    submittedBy,
    createdAt,
    completedAt: new Date(),
    results,
    summary,
    status: summary.failed > 0 ? 'completed' : 'completed',
    recommendations,
    fixSuggestions
  };
}

/**
 * Generate summary statistics from results
 */
function generateSummary(results: E2ETestResult[]): TestReportSummary {
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const partial = results.filter(r => r.status === 'partial').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const total = results.length;
  
  // Count issues by severity
  let criticalIssues = 0;
  let highIssues = 0;
  let mediumIssues = 0;
  let lowIssues = 0;
  
  for (const result of results) {
    for (const issue of result.issues) {
      switch (issue.severity) {
        case 'critical': criticalIssues++; break;
        case 'high': highIssues++; break;
        case 'medium': mediumIssues++; break;
        case 'low': lowIssues++; break;
      }
    }
  }
  
  return {
    totalScenarios: new Set(results.map(r => r.scenarioId)).size,
    totalSteps: total,
    passed,
    failed,
    partial,
    skipped,
    passRate: total > 0 ? passed / total : 0,
    criticalIssues,
    highIssues,
    mediumIssues,
    lowIssues
  };
}

/**
 * Generate fix suggestions for failed tests
 */
export function generateFixSuggestions(results: E2ETestResult[]): FixSuggestion[] {
  const suggestions: FixSuggestion[] = [];
  
  for (const result of results) {
    if (result.status === 'pass' || result.status === 'skipped') {
      continue;
    }
    
    for (const issue of result.issues) {
      const suggestion: FixSuggestion = {
        scenarioId: result.scenarioId,
        stepId: result.stepId,
        issue: issue.description,
        suggestion: issue.suggestion || 'Review and fix the identified issue',
        priority: issue.severity === 'critical' ? 'P0' : 
                  issue.severity === 'high' ? 'P0' : 
                  issue.severity === 'medium' ? 'P1' : 'P2'
      };
      
      // Add code example for common issues
      if (issue.category === 'ui') {
        suggestion.codeExample = `// Ensure element is visible and accessible
await page.waitForSelector('[data-testid="${result.stepId}"]');
expect(await page.isVisible('[data-testid="${result.stepId}"]')).toBe(true);`;
      }
      
      suggestions.push(suggestion);
    }
  }
  
  return suggestions;
}

/**
 * Generate recommendations based on results
 */
function generateRecommendations(
  results: E2ETestResult[],
  summary: TestReportSummary
): string[] {
  const recommendations: string[] = [];
  
  if (summary.passRate === 1) {
    recommendations.push('✅ All tests passed! The implementation meets the spec requirements.');
  } else if (summary.passRate >= 0.8) {
    recommendations.push('⚠️ Most tests passed, but there are some issues to address.');
  } else if (summary.passRate >= 0.5) {
    recommendations.push('❌ Significant issues found. Review and fix before proceeding.');
  } else {
    recommendations.push('🚫 Critical failure. Implementation needs substantial work.');
  }
  
  if (summary.criticalIssues > 0) {
    recommendations.push(`🔴 Address ${summary.criticalIssues} critical issue(s) immediately.`);
  }
  
  if (summary.highIssues > 0) {
    recommendations.push(`🟠 Address ${summary.highIssues} high priority issue(s) before release.`);
  }
  
  // Add specific recommendations based on issue categories
  const categories = new Set(results.flatMap(r => r.issues.map(i => i.category)));
  
  if (categories.has('accessibility')) {
    recommendations.push('♿ Review accessibility requirements - some a11y issues detected.');
  }
  
  if (categories.has('performance')) {
    recommendations.push('⚡ Performance issues detected - consider optimization.');
  }
  
  return recommendations;
}

/**
 * Format a report as Markdown
 */
export function formatReportAsMarkdown(report: TestReport): string {
  const lines: string[] = [];
  
  // Header
  lines.push(`# Test Report: ${report.specId}`);
  lines.push('');
  lines.push(`**Report ID:** ${report.reportId}`);
  lines.push(`**Submitted By:** ${report.submittedBy}`);
  lines.push(`**Generated:** ${report.createdAt.toISOString()}`);
  lines.push('');
  
  // Summary
  lines.push('## Summary');
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total Scenarios | ${report.summary.totalScenarios} |`);
  lines.push(`| Total Steps | ${report.summary.totalSteps} |`);
  lines.push(`| Passed | ${report.summary.passed} ✅ |`);
  lines.push(`| Failed | ${report.summary.failed} ❌ |`);
  lines.push(`| Partial | ${report.summary.partial} ⚠️ |`);
  lines.push(`| Skipped | ${report.summary.skipped} ⏭️ |`);
  lines.push(`| Pass Rate | ${(report.summary.passRate * 100).toFixed(1)}% |`);
  lines.push('');
  
  // Issues
  if (report.summary.criticalIssues > 0 || report.summary.highIssues > 0 || 
      report.summary.mediumIssues > 0 || report.summary.lowIssues > 0) {
    lines.push('## Issues Found');
    lines.push('');
    lines.push(`| Severity | Count |`);
    lines.push(`|----------|-------|`);
    if (report.summary.criticalIssues > 0) {
      lines.push(`| 🔴 Critical | ${report.summary.criticalIssues} |`);
    }
    if (report.summary.highIssues > 0) {
      lines.push(`| 🟠 High | ${report.summary.highIssues} |`);
    }
    if (report.summary.mediumIssues > 0) {
      lines.push(`| 🟡 Medium | ${report.summary.mediumIssues} |`);
    }
    if (report.summary.lowIssues > 0) {
      lines.push(`| 🟢 Low | ${report.summary.lowIssues} |`);
    }
    lines.push('');
  }
  
  // Recommendations
  if (report.recommendations && report.recommendations.length > 0) {
    lines.push('## Recommendations');
    lines.push('');
    for (const rec of report.recommendations) {
      lines.push(`- ${rec}`);
    }
    lines.push('');
  }
  
  // Results
  lines.push('## Detailed Results');
  lines.push('');
  
  for (const result of report.results) {
    const statusIcon = result.status === 'pass' ? '✅' :
                      result.status === 'fail' ? '❌' :
                      result.status === 'partial' ? '⚠️' : '⏭️';
    
    lines.push(`### ${statusIcon} ${result.scenarioId} - Step ${result.stepId}`);
    lines.push('');
    lines.push(`**Status:** ${result.status.toUpperCase()}`);
    lines.push(`**Confidence:** ${(result.confidence * 100).toFixed(0)}%`);
    lines.push(`**Matches Expected:** ${result.matchesExpected ? 'Yes' : 'No'}`);
    lines.push('');
    lines.push(`**Analysis:** ${result.analysis}`);
    lines.push('');
    
    if (result.issues.length > 0) {
      lines.push('**Issues:**');
      for (const issue of result.issues) {
        const severityIcon = issue.severity === 'critical' ? '🔴' :
                            issue.severity === 'high' ? '🟠' :
                            issue.severity === 'medium' ? '🟡' : '🟢';
        lines.push(`- ${severityIcon} **${issue.severity.toUpperCase()}** (${issue.category}): ${issue.description}`);
        if (issue.suggestion) {
          lines.push(`  - Suggestion: ${issue.suggestion}`);
        }
      }
      lines.push('');
    }
  }
  
  // Fix Suggestions
  if (report.fixSuggestions && report.fixSuggestions.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('## Suggested Fixes');
    lines.push('');
    
    for (const fix of report.fixSuggestions) {
      const priorityIcon = fix.priority === 'P0' ? '🔴' : 
                          fix.priority === 'P1' ? '🟡' : '🟢';
      lines.push(`### ${priorityIcon} ${fix.scenarioId} - ${fix.stepId}`);
      lines.push('');
      lines.push(`**Issue:** ${fix.issue}`);
      lines.push(`**Suggestion:** ${fix.suggestion}`);
      if (fix.codeExample) {
        lines.push('');
        lines.push('**Example:**');
        lines.push('```typescript');
        lines.push(fix.codeExample);
        lines.push('```');
      }
      lines.push('');
    }
  }
  
  return lines.join('\n');
}

/**
 * Suggest fixes for failed tests
 */
export function suggestFixes(failedResults: E2ETestResult[]): FixSuggestion[] {
  return generateFixSuggestions(failedResults);
}
