/**
 * Agent Adapters Index
 * Exports all agent adapters and registers them with the registry
 */

import { BaseAgentAdapter } from './base.js';
import { ClaudeCodeAdapter } from './claude-code.js';
import { CursorAdapter } from './cursor.js';
import { CopilotAdapter } from './copilot.js';
import { GeminiCliAdapter } from './gemini-cli.js';
import { OpenCodeAdapter } from './opencode.js';
import { registerAgent, getAgentDefinition } from '../registry.js';

// Export adapters
export { BaseAgentAdapter } from './base.js';
export { ClaudeCodeAdapter } from './claude-code.js';
export { CursorAdapter } from './cursor.js';
export { CopilotAdapter } from './copilot.js';
export { GeminiCliAdapter } from './gemini-cli.js';
export { OpenCodeAdapter } from './opencode.js';

// Track initialization state
let initialized = false;

/**
 * Initialize and register all adapters
 * This function is idempotent - calling it multiple times is safe
 */
export function initializeAdapters(): void {
  if (initialized) {
    return;
  }

  // Define adapters to register as [id, AdapterClass] pairs
  const adapters: Array<[string, new () => BaseAgentAdapter]> = [
    ['claude-code', ClaudeCodeAdapter],
    ['cursor', CursorAdapter],
    ['copilot', CopilotAdapter],
    ['gemini-cli', GeminiCliAdapter],
    ['opencode', OpenCodeAdapter],
  ];

  // Register each adapter
  for (const [id, AdapterClass] of adapters) {
    const definition = getAgentDefinition(id);
    if (definition) {
      registerAgent(definition, new AdapterClass());
    }
  }

  initialized = true;
}

// Auto-initialize when module is imported
initializeAdapters();
