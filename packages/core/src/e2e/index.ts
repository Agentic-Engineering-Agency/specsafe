/**
 * E2E Testing System
 * Hybrid testing combining human testing with AI analysis
 */

// Types
export type {
  TestGuide,
  TestScenario,
  TestStep,
  ScreenshotSubmission,
  TestReport,
  E2ETestResult,
  TestStatus,
  TestIssue,
  ExpectedState,
  FixSuggestion,
  TestReportSummary,
  AnalysisConfig,
  GuideGenerationOptions,
  TestSubmissionOptions,
  AutomationMode,
  PlaywrightRunResult
} from './types.js';

// Guide Generator
export {
  generateGuide,
  generateGuideContent,
  formatGuideAsMarkdown,
  formatGuideAsJSON,
  saveGuide,
  filterScenariosByPriority,
  getScreenshotSteps
} from './guide-generator.js';

// Report Analyzer
export {
  analyzeScreenshots,
  analyzeSingleSubmission,
  compareWithExpected,
  generateReport,
  generatePlaywrightReport,
  generateFixSuggestions,
  suggestFixes,
  formatReportAsMarkdown,
  DEFAULT_ANALYSIS_CONFIG
} from './report-analyzer.js';

// Playwright Integration
export {
  E2EEngine,
  convertToPlaywrightScenarios,
  generatePlaywrightScript
} from './playwright.js';

export type {
  PlaywrightConfig,
  PlaywrightAction,
  PlaywrightScenario
} from './playwright.js';
