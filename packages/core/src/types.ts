/**
 * SpecSafe Core Types
 * Defines the data structures for the SPEC → TEST → CODE → QA → COMPLETE workflow
 */

export type SpecStage = 'spec' | 'test' | 'code' | 'qa' | 'complete' | 'archived';

export interface Requirement {
  id: string;
  text: string;
  priority: 'P0' | 'P1' | 'P2';
  scenarios: Scenario[];
}

export interface Scenario {
  id: string;
  given: string;
  when: string;
  then: string;
}

export interface Spec {
  id: string;
  name: string;
  description: string;
  stage: SpecStage;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  requirements: Requirement[];
  testFiles: string[];
  implementationFiles: string[];
  qaReport?: QAReport;
  metadata: {
    author: string;
    project: string;
    tags: string[];
  };
}

export interface QAReport {
  id: string;
  specId: string;
  timestamp: Date;
  testResults: TestResult[];
  coverage: CoverageReport;
  recommendation: 'GO' | 'NO-GO';
  issues: Issue[];
  notes: string;
}

export interface TestResult {
  file: string;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
}

export interface CoverageReport {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
}

export interface Issue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  file?: string;
  line?: number;
}

export interface ProjectState {
  projectName: string;
  version: string;
  lastUpdated: Date;
  specs: SpecSummary[];
  metrics: ProjectMetrics;
}

export interface SpecSummary {
  id: string;
  name: string;
  stage: SpecStage;
  progress: number;
  lastUpdated: Date;
}

export interface ProjectMetrics {
  totalSpecs: number;
  byStage: Record<SpecStage, number>;
  completionRate: number;
  averageCycleTime: number;
}