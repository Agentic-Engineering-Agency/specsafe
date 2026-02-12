/**
 * Agents Module Index
 * Exports agent registry, types, and adapters
 */

// Export types
export type {
  AgentDefinition,
  AgentAdapter,
  AgentRegistryEntry,
  GenerateOptions,
  GeneratedFile,
} from './types.js';

// Export registry functions
export {
  getAgent,
  listAgents,
  getSupportedAgents,
  isValidAgent,
  getAgentDefinition,
  registerAgent,
  AGENT_DEFINITIONS,
} from './registry.js';

// Export adapters (this will auto-initialize them)
export {
  ClaudeCodeAdapter,
  CursorAdapter,
  CopilotAdapter,
  GeminiCliAdapter,
  OpenCodeAdapter,
  BaseAgentAdapter,
  initializeAdapters,
} from './adapters/index.js';
