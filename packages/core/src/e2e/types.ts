/**
 * E2E Testing System Types
 * Hybrid testing combining human testing with AI analysis
 */

/**
 * A single step in a test scenario
 */
export interface TestStep {
  id: string;
  order: number;
  description: string;
  action: string;
  expectedResult: string;
  screenshotRequired: boolean;
  notes?: string;
}

/**
 * A test scenario with multiple steps
 */
export interface TestScenario {
  id: string;
  name: string;
  description: string;
  prerequisites: string[];
  steps: TestStep[];
  priority: 'P0' | 'P1' | 'P2';
}

/**
 * Complete test guide for a spec
 */
export interface TestGuide {
  specId: string;
  specName: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  scenarios: TestScenario[];
  globalPrerequisites: string[];
  setupInstructions: string[];
  cleanupInstructions?: string[];
}

/**
 * A screenshot submission for analysis
 */
export interface ScreenshotSubmission {
  scenarioId: string;
  stepId: string;
  imagePath: string;
  timestamp: Date;
  notes?: string;
  metadata?: {
    browser?: string;
    viewport?: string;
    os?: string;
  };
}

/**
 * Status of an individual test result
 */
export type TestStatus = 'pass' | 'fail' | 'partial' | 'pending' | 'skipped';

/**
 * An issue found during testing
 */
export interface TestIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  category: 'ui' | 'functional' | 'performance' | 'accessibility' | 'other';
  suggestion?: string;
  reference?: string;
}

/**
 * Result of analyzing a single screenshot/submission
 */
export interface E2ETestResult {
  scenarioId: string;
  stepId: string;
  status: TestStatus;
  analysis: string;
  confidence: number;
  issues: TestIssue[];
  matchesExpected: boolean;
  processingTimeMs?: number;
}

/**
 * Summary statistics for a test report
 */
export interface TestReportSummary {
  totalScenarios: number;
  totalSteps: number;
  passed: number;
  failed: number;
  partial: number;
  skipped: number;
  passRate: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
}

/**
 * Complete test report
 */
export interface TestReport {
  specId: string;
  reportId: string;
  submittedBy: string;
  createdAt: Date;
  completedAt?: Date;
  results: E2ETestResult[];
  summary: TestReportSummary;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  recommendations?: string[];
  fixSuggestions?: FixSuggestion[];
}

/**
 * Suggested fix for a failed test
 */
export interface FixSuggestion {
  scenarioId: string;
  stepId: string;
  issue: string;
  suggestion: string;
  codeExample?: string;
  priority: 'P0' | 'P1' | 'P2';
}

/**
 * Expected state for comparison
 */
export interface ExpectedState {
  scenarioId: string;
  stepId: string;
  description: string;
  visualIndicators?: string[];
  textContent?: string[];
  elements?: Array<{
    selector: string;
    state: 'visible' | 'hidden' | 'enabled' | 'disabled';
    text?: string;
  }>;
}

/**
 * Configuration for AI analysis
 */
export interface AnalysisConfig {
  visionModel?: string;
  confidenceThreshold: number;
  autoApprovePassing: boolean;
  requireHumanReview: boolean;
  maxConcurrentAnalysis: number;
}

/**
 * Options for generating a test guide
 */
export interface GuideGenerationOptions {
  includePrerequisites?: boolean;
  includeScreenshots?: boolean;
  format?: 'markdown' | 'html' | 'json';
  scenarioFilter?: string[];
  priorityFilter?: ('P0' | 'P1' | 'P2')[];
  mode?: 'manual' | 'playwright';
}

/**
 * Options for submitting test results
 */
export interface TestSubmissionOptions {
  autoAnalyze?: boolean;
  generateReport?: boolean;
  config?: AnalysisConfig;
}

/**
 * Playwright automation mode
 */
export type AutomationMode = 'manual' | 'playwright';

/**
 * Result from running Playwright scenarios
 */
export interface PlaywrightRunResult {
  scenarioId: string;
  status: 'pass' | 'fail' | 'error' | 'skipped';
  duration: number;
  screenshots: string[];
  error?: string;
  steps: Array<{
    action: string;
    status: 'pass' | 'fail' | 'error';
    duration: number;
    error?: string;
  }>;
}
