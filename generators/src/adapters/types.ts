/**
 * Canonical skill definition parsed from SKILL.md
 */
export interface CanonicalSkill {
  name: string;
  description: string;
  disableModelInvocation: boolean;
  content: string;         // Full SKILL.md content (after frontmatter)
  workflowContent?: string; // workflow.md content if exists
  directory: string;        // Directory name (e.g., "specsafe-init")
}

/**
 * Result of generating files for a tool
 */
export interface GeneratedFile {
  path: string;      // Relative path from project root
  content: string;   // File content
}

/**
 * Each tool adapter transforms canonical skills into tool-specific files
 */
export interface ToolAdapter {
  /** Tool identifier (e.g., "claude-code", "opencode") */
  name: string;

  /** Human-readable tool name */
  displayName: string;

  /** Detect if this tool is present in the project */
  detect(projectRoot: string): Promise<boolean>;

  /** Generate all files for this tool from canonical skills */
  generate(skills: CanonicalSkill[], projectRoot: string): Promise<GeneratedFile[]>;
}

/**
 * SpecSafe project configuration (specsafe.config.json)
 */
export interface SpecSafeConfig {
  project: string;
  version: string;
  tools: string[];
  testFramework: string;
  testCommand: string;
  coverageCommand: string;
  language: string;
  specsafeVersion: string;
}

/**
 * Tool registry - maps tool names to their adapters
 */
export const TOOL_NAMES = [
  'claude-code',
  'opencode',
  'cursor',
  'continue',
  'aider',
  'zed',
  'gemini',
  'antigravity',
] as const;

export type ToolName = typeof TOOL_NAMES[number];
