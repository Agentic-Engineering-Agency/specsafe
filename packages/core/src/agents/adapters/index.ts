/**
 * Agent Adapters Index
 * Exports all agent adapters and registers them with the registry
 */

import { ClaudeCodeAdapter } from './claude-code.js';
import { CursorAdapter } from './cursor.js';
import { CopilotAdapter } from './copilot.js';
import { GeminiCliAdapter } from './gemini-cli.js';
import { OpenCodeAdapter } from './opencode.js';
import { registerAgent, getAgentDefinition } from '../registry.js';

// Export adapters
export { ClaudeCodeAdapter } from './claude-code.js';
export { CursorAdapter } from './cursor.js';
export { CopilotAdapter } from './copilot.js';
export { GeminiCliAdapter } from './gemini-cli.js';
export { OpenCodeAdapter } from './opencode.js';
export { BaseAgentAdapter } from './base.js';

/**
 * Initialize and register all adapters
 */
export function initializeAdapters(): void {
  // Claude Code
  const claudeCodeDef = getAgentDefinition('claude-code');
  if (claudeCodeDef) {
    registerAgent(claudeCodeDef, new ClaudeCodeAdapter());
  }

  // Cursor
  const cursorDef = getAgentDefinition('cursor');
  if (cursorDef) {
    registerAgent(cursorDef, new CursorAdapter());
  }

  // Copilot
  const copilotDef = getAgentDefinition('copilot');
  if (copilotDef) {
    registerAgent(copilotDef, new CopilotAdapter());
  }

  // Gemini CLI
  const geminiCliDef = getAgentDefinition('gemini-cli');
  if (geminiCliDef) {
    registerAgent(geminiCliDef, new GeminiCliAdapter());
  }

  // OpenCode
  const openCodeDef = getAgentDefinition('opencode');
  if (openCodeDef) {
    registerAgent(openCodeDef, new OpenCodeAdapter());
  }
}

// Auto-initialize when module is imported
initializeAdapters();
