/**
 * Export System Types
 * Defines types for exporting specs in multiple formats
 */

/** Available export formats */
export type ExportFormat = 'markdown' | 'json' | 'html' | 'pdf-bundle' | 'stakeholder';

/** Options for exporting specs */
export interface ExportOptions {
  format: ExportFormat;
  includeMetadata?: boolean;
  includeHistory?: boolean;
  template?: string;
}

/** Result of an export operation */
export interface ExportResult {
  content: string | Buffer;
  filename: string;
  mimeType: string;
  size: number;
}

/** Stakeholder-specific bundle containing role-based views */
export interface StakeholderBundle {
  /** Executive summary - business goals, timeline, risks */
  executive: ExportResult;
  /** Technical specification - architecture, APIs, data models */
  technical: ExportResult;
  /** QA view - requirements, acceptance criteria, test scenarios */
  qa: ExportResult;
  /** Design view - UX flows, UI requirements, accessibility */
  design: ExportResult;
}

/** Parsed spec structure for export processing */
export interface ParsedSpec {
  id: string;
  name: string;
  description: string;
  stage: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  metadata: {
    author: string;
    project: string;
    tags: string[];
  };
  prd?: {
    problemStatement?: string;
    userStories?: string[];
    acceptanceCriteria?: string[];
    technicalConsiderations?: string;
  };
  requirements?: Array<{
    id: string;
    text: string;
    priority: 'P0' | 'P1' | 'P2';
    scenarios?: Array<{
      id: string;
      given: string;
      when: string;
      thenOutcome: string;
    }>;
  }>;
  architecture?: {
    overview?: string;
    components?: string[];
    apis?: Array<{
      name: string;
      endpoint?: string;
      method?: string;
      description?: string;
    }>;
    dataModels?: string[];
  };
  scenarios?: Array<{
    id: string;
    name: string;
    given: string;
    when: string;
    thenOutcome: string;
  }>;
  design?: {
    uxFlows?: string[];
    uiRequirements?: string[];
    accessibility?: string[];
  };
  testResults?: {
    passed: number;
    failed: number;
    skipped: number;
    coverage?: {
      statements: number;
      branches: number;
      functions: number;
      lines: number;
    };
  };
  risks?: string[];
  timeline?: {
    estimatedDuration?: string;
    milestones?: string[];
  };
}

/** Export configuration for customization */
export interface ExportConfig {
  /** Default formats to export */
  defaultFormats: ExportFormat[];
  /** Whether to include metadata by default */
  includeMetadataByDefault: boolean;
  /** Whether to include history by default */
  includeHistoryByDefault: boolean;
  /** Custom templates directory */
  templatesDir?: string;
  /** Output directory for exports */
  outputDir?: string;
}
