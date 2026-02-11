/**
 * Types for the rules module
 * TypeScript interfaces for tool registry and rule management
 */

/**
 * Represents a tool that can be integrated with SpecSafe
 */
export interface ToolDefinition {
  /** Unique identifier for the tool */
  name: string;
  /** Human-readable description */
  description: string;
  /** Configuration files that this tool uses */
  files: string[];
  /** Optional: Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Represents an installed tool configuration
 */
export interface InstalledTool {
  /** Tool name */
  name: string;
  /** Whether the tool is enabled */
  enabled: boolean;
  /** Installed version of the rules */
  version: string;
  /** When the tool was installed */
  installedAt?: string;
}

/**
 * Tool registry entry with detection logic
 */
export interface ToolRegistryEntry extends ToolDefinition {
  /** Detect if this tool is already configured in the project */
  detect(): Promise<boolean> | boolean;
  /** Install rules for this tool */
  install(cwd: string): Promise<void>;
  /** Remove rules for this tool */
  remove(cwd: string): Promise<void>;
}

/**
 * Configuration for tools in specsafe.config.json
 */
export interface ToolsConfig {
  [toolName: string]: {
    enabled: boolean;
    version: string;
  };
}

/**
 * Extended SpecSafe config with tools support
 */
export interface SpecSafeConfigWithTools {
  projectName: string;
  version: string;
  stages: string[];
  testFramework: 'vitest' | 'jest';
  language: 'typescript';
  tools?: ToolsConfig;
}

/**
 * Result of a rule operation
 */
export interface RuleOperationResult {
  success: boolean;
  message: string;
  tool?: string;
  error?: Error;
}

/**
 * Available rule sources
 */
export type RuleSource = 'github' | 'local';

/**
 * Download options for rules
 */
export interface DownloadOptions {
  /** Source to download from */
  source?: RuleSource;
  /** Specific version to download */
  version?: string;
  /** Force overwrite existing files */
  force?: boolean;
}
