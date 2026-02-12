/**
 * Agent types for multi-agent support
 * Defines interfaces for AI coding assistants integration
 */

/**
 * Supported AI coding agent
 */
export interface AgentDefinition {
  /** Unique identifier for the agent (e.g., 'claude-code', 'cursor') */
  id: string;
  /** Human-readable name */
  name: string;
  /** Configuration directory path (e.g., '.claude') */
  configDir?: string;
  /** Command directory path (e.g., '.claude/skills') */
  commandDir?: string;
  /** Config file extension (e.g., '.md', '.json', '.yaml') */
  fileExtension: string;
  /** Command format used by the agent (e.g., '/command', '@command') */
  commandFormat: string;
  /** Configuration file names to detect */
  detectionFiles: string[];
}

/**
 * Agent adapter interface
 * Each agent implements this to generate its specific configuration
 */
export interface AgentAdapter {
  /** Agent definition */
  agent: AgentDefinition;
  
  /** Generate main configuration file(s) for this agent */
  generateConfig(projectDir: string, options?: GenerateOptions): Promise<GeneratedFile[]>;
  
  /** Generate command/skill files for workflow commands */
  generateCommands(projectDir: string, options?: GenerateOptions): Promise<GeneratedFile[]>;
  
  /** Get instructions for using this agent with SpecSafe */
  getInstructions(): string;
  
  /** Detect if this agent is already configured in the project */
  detect(projectDir: string): Promise<boolean>;
}

/**
 * Options for generating agent configurations
 */
export interface GenerateOptions {
  /** Overwrite existing files */
  force?: boolean;
  /** Project name */
  projectName?: string;
  /** Test framework */
  testFramework?: string;
  /** Custom configuration values */
  custom?: Record<string, unknown>;
}

/**
 * Generated file metadata
 */
export interface GeneratedFile {
  /** Relative path from project root */
  path: string;
  /** File content */
  content: string;
  /** Whether this is an executable file */
  executable?: boolean;
}

/**
 * Agent registry entry with metadata
 */
export interface AgentRegistryEntry extends AgentDefinition {
  /** Adapter implementation */
  adapter: AgentAdapter;
}
