/**
 * Core types for SpecSafe framework
 */

export type Phase = 'SPEC' | 'TEST' | 'CODE' | 'QA' | 'COMPLETE';

export interface Spec {
  name: string;
  phase: Phase;
  tests: number;
  passing: number;
  coverage?: number;
  location: 'active' | 'completed' | 'archive';
  qaStatus?: 'GO' | 'NO-GO' | 'PENDING';
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectState {
  lastUpdated: string;
  currentPhase: Phase;
  activeSpec: string | null;
  specs: Spec[];
}

export interface ChangeLogEntry {
  date: string;
  time: string;
  action: string;
  spec: string;
  files: string;
  agent: string;
  notes: string;
}

export interface QAResult {
  spec: string;
  generated: string;
  testResults: {
    passed: number;
    failed: number;
    skipped: number;
    total: number;
    passRate: number;
  };
  coverage: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  failedTests: string[];
  cornerCases: string[];
  recommendation: 'GO' | 'NO-GO';
  rationale: string;
  actionItems: string[];
}

export interface Config {
  specsafe: {
    version: string;
    projectName: string;
  };
  workflow: {
    enforceTdd: boolean;
    requireTrackingUpdate: boolean;
    requireHumanApproval: boolean;
    autoArchive: boolean;
  };
  specs: {
    format: string;
    normativeLanguage: string[];
    scenarioFormat: string[];
    userStoryFormat: string;
    directories: {
      active: string;
      completed: string;
      archive: string;
      templates: string;
    };
  };
  tests: {
    framework: string;
    e2eFramework: string;
    coverageThreshold: number;
    autoGenerate: boolean;
  };
  qa: {
    passThreshold: number;
    cornerCaseTolerance: number;
    requireCoverage: boolean;
    generateReport: boolean;
    reportLocation: string;
  };
  complete: {
    requireQaReport: boolean;
    checklist: string[];
    onApprove: string[];
    onReject: string[];
  };
  archive: {
    includeDeprecationReason: boolean;
    preserveQaHistory: boolean;
    namingPattern: string;
  };
  tracking: {
    masterFile: string;
    autoUpdate: boolean;
    trackTime: boolean;
    trackDecisions: boolean;
    logFile: string;
  };
  aiTools: {
    primary: string;
    secondary: string;
    modelPreference: {
      specReview: string;
      testGeneration: string;
      codeImplementation: string;
      qaReview: string;
    };
  };
}

export const DEFAULT_CONFIG: Config = {
  specsafe: {
    version: '1.0.0',
    projectName: 'My Project',
  },
  workflow: {
    enforceTdd: true,
    requireTrackingUpdate: true,
    requireHumanApproval: true,
    autoArchive: false,
  },
  specs: {
    format: 'markdown',
    normativeLanguage: ['SHALL', 'MUST', 'SHALL NOT', 'MUST NOT'],
    scenarioFormat: ['WHEN', 'THEN', 'AND', 'GIVEN'],
    userStoryFormat: 'As a [role], I want [feature], so that [benefit]',
    directories: {
      active: 'specs/active',
      completed: 'specs/completed',
      archive: 'specs/archive',
      templates: 'specs/templates',
    },
  },
  tests: {
    framework: 'vitest',
    e2eFramework: 'playwright',
    coverageThreshold: 80,
    autoGenerate: true,
  },
  qa: {
    passThreshold: 80,
    cornerCaseTolerance: 10,
    requireCoverage: true,
    generateReport: true,
    reportLocation: 'specs/active/{spec}/qa-report.md',
  },
  complete: {
    requireQaReport: true,
    checklist: [
      'QA report reviewed',
      'Test pass rate acceptable',
      'Coverage meets requirements',
      'Corner cases documented',
      'No critical failures',
      'Implementation matches spec',
    ],
    onApprove: ['move_to_completed', 'include_qa_report', 'update_tracking'],
    onReject: ['document_feedback', 'return_to_code', 'create_action_items'],
  },
  archive: {
    includeDeprecationReason: true,
    preserveQaHistory: true,
    namingPattern: 'YYYY-MM-DD-{spec}',
  },
  tracking: {
    masterFile: 'PROJECT_STATE.md',
    autoUpdate: true,
    trackTime: true,
    trackDecisions: true,
    logFile: 'tracking/changes.log',
  },
  aiTools: {
    primary: 'claude-code',
    secondary: 'opencode',
    modelPreference: {
      specReview: 'claude-opus-4-5',
      testGeneration: 'claude-sonnet-4',
      codeImplementation: 'claude-sonnet-4',
      qaReview: 'claude-opus-4-5',
    },
  },
};
