/**
 * Agent Registry
 * Central registry for all supported AI coding agents
 */

import type { AgentDefinition, AgentRegistryEntry, AgentAdapter } from './types.js';

/**
 * Supported agent definitions
 */
export const AGENT_DEFINITIONS: AgentDefinition[] = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    configDir: '.claude',
    commandDir: '.claude/skills',
    fileExtension: '.md',
    commandFormat: '/command-name',
    detectionFiles: ['CLAUDE.md', '.claude/skills'],
  },
  {
    id: 'cursor',
    name: 'Cursor IDE',
    configDir: undefined,
    commandDir: undefined,
    fileExtension: '.cursorrules',
    commandFormat: '@command',
    detectionFiles: ['.cursorrules'],
  },
  {
    id: 'copilot',
    name: 'GitHub Copilot',
    configDir: '.github',
    commandDir: undefined,
    fileExtension: '.md',
    commandFormat: '@workspace /command',
    detectionFiles: ['.github/copilot-instructions.md'],
  },
  {
    id: 'gemini-cli',
    name: 'Gemini CLI',
    configDir: '.gemini',
    commandDir: '.gemini/prompts',
    fileExtension: '.md',
    commandFormat: '/command',
    detectionFiles: ['.gemini/config.yaml', '.gemini/prompts'],
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    configDir: '.opencode',
    commandDir: '.opencode/commands',
    fileExtension: '.md',
    commandFormat: '/command',
    detectionFiles: ['.opencode/commands'],
  },
  {
    id: 'windsurf',
    name: 'Windsurf',
    configDir: '.windsurf',
    commandDir: '.windsurf/rules',
    fileExtension: '.md',
    commandFormat: '@command',
    detectionFiles: ['.windsurf/rules.md'],
  },
  {
    id: 'continue',
    name: 'Continue.dev',
    configDir: '.continue',
    commandDir: '.continue/prompts',
    fileExtension: '.md',
    commandFormat: '/command',
    detectionFiles: ['.continue/config.yaml'],
  },
  {
    id: 'crush',
    name: 'Crush',
    configDir: '.opencode',
    commandDir: '.opencode/commands',
    fileExtension: '.md',
    commandFormat: '/command',
    detectionFiles: ['.opencode/commands'],
  },
  {
    id: 'codex',
    name: 'Codex',
    configDir: '.codex',
    commandDir: '.codex/commands',
    fileExtension: '.md',
    commandFormat: '/command',
    detectionFiles: ['.codex/config.json'],
  },
  {
    id: 'qwen-code',
    name: 'Qwen Code',
    configDir: '.qwen',
    commandDir: '.qwen/prompts',
    fileExtension: '.md',
    commandFormat: '/command',
    detectionFiles: ['.qwen/config.yaml'],
  },
];

/**
 * Agent registry - stores agent definitions with their adapters
 */
class AgentRegistry {
  private agents: Map<string, AgentRegistryEntry> = new Map();

  /**
   * Register an agent with its adapter
   */
  register(definition: AgentDefinition, adapter: AgentAdapter): void {
    this.agents.set(definition.id, {
      ...definition,
      adapter,
    });
  }

  /**
   * Get agent by ID
   */
  getAgent(id: string): AgentRegistryEntry | undefined {
    return this.agents.get(id);
  }

  /**
   * Get all registered agents
   */
  listAgents(): AgentRegistryEntry[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agent IDs
   */
  getAgentIds(): string[] {
    return Array.from(this.agents.keys());
  }

  /**
   * Check if agent is registered
   */
  hasAgent(id: string): boolean {
    return this.agents.has(id);
  }
}

// Global registry instance
const registry = new AgentRegistry();

/**
 * Get agent definition by ID
 */
export function getAgent(id: string): AgentRegistryEntry | undefined {
  return registry.getAgent(id);
}

/**
 * Get all registered agents
 */
export function listAgents(): AgentRegistryEntry[] {
  return registry.listAgents();
}

/**
 * Get list of supported agent IDs
 */
export function getSupportedAgents(): string[] {
  return AGENT_DEFINITIONS.map((a) => a.id);
}

/**
 * Check if an agent ID is supported
 */
export function isValidAgent(id: string): boolean {
  return AGENT_DEFINITIONS.some((a) => a.id === id);
}

/**
 * Get agent definition (without adapter) by ID
 */
export function getAgentDefinition(id: string): AgentDefinition | undefined {
  return AGENT_DEFINITIONS.find((a) => a.id === id);
}

/**
 * Register an agent adapter
 * Used by adapters to register themselves with the registry
 */
export function registerAgent(definition: AgentDefinition, adapter: AgentAdapter): void {
  registry.register(definition, adapter);
}

// Export registry instance for advanced use cases
export { registry };
