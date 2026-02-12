/**
 * Tool Registry
 * Manages available tools and their detection logic
 */

import { existsSync } from 'fs';
import { access, mkdir, writeFile, readFile, rm } from 'fs/promises';
import { join } from 'path';
import type { ToolDefinition, ToolRegistryEntry, InstalledTool } from './types.js';

/**
 * Hardcoded list of available rules/tools
 */
export const AVAILABLE_RULES: ToolDefinition[] = [
  {
    name: 'cursor',
    description: 'Cursor IDE integration',
    files: ['.cursorrules'],
  },
  {
    name: 'continue',
    description: 'Continue.dev for VS Code',
    files: ['.continue/config.yaml'],
  },
  {
    name: 'aider',
    description: 'Aider CLI integration',
    files: ['.aider.conf.yml'],
  },
  {
    name: 'zed',
    description: 'Zed Editor integration',
    files: ['.zed/settings.json'],
  },
  {
    name: 'git-hooks',
    description: 'Pre-commit validation',
    files: ['.githooks/pre-commit'],
  },
  {
    name: 'claude-code',
    description: 'Claude Code by Anthropic',
    files: ['CLAUDE.md'],
  },
  {
    name: 'crush',
    description: 'Crush (formerly OpenCode) by Charmbracelet',
    files: ['.opencode/commands/specsafe.md', '.opencode/commands/spec.md', '.opencode/commands/validate.md'],
  },
];

/**
 * Detect if a tool is configured by checking for its config files
 */
export async function detectTool(toolName: string, cwd: string = process.cwd()): Promise<boolean> {
  const tool = AVAILABLE_RULES.find((t) => t.name === toolName);
  if (!tool) return false;

  for (const file of tool.files) {
    const filePath = join(cwd, file);
    try {
      await access(filePath);
      return true;
    } catch {
      // File doesn't exist, continue checking
    }
  }
  return false;
}

/**
 * Detect all available tools in the project
 */
export async function detectAllTools(cwd: string = process.cwd()): Promise<string[]> {
  const detected: string[] = [];
  for (const tool of AVAILABLE_RULES) {
    if (await detectTool(tool.name, cwd)) {
      detected.push(tool.name);
    }
  }
  return detected;
}

/**
 * Get tool definition by name
 */
export function getTool(name: string): ToolDefinition | undefined {
  return AVAILABLE_RULES.find((t) => t.name === name);
}

/**
 * Check if a tool name is valid
 */
export function isValidTool(name: string): boolean {
  return AVAILABLE_RULES.some((t) => t.name === name);
}

/**
 * Get all available tools
 */
export function getAllTools(): ToolDefinition[] {
  return [...AVAILABLE_RULES];
}

/**
 * Load installed tools from config
 */
export async function loadInstalledTools(cwd: string = process.cwd()): Promise<InstalledTool[]> {
  const configPath = join(cwd, 'specsafe.config.json');
  try {
    const content = await readFile(configPath, 'utf-8');
    const config = JSON.parse(content);
    const tools = config.tools || {};
    
    return Object.entries(tools).map(([name, toolConfig]) => ({
      name,
      ...(toolConfig as Omit<InstalledTool, 'name'>),
    }));
  } catch {
    return [];
  }
}

/**
 * Save tool configuration to specsafe.config.json
 */
export async function saveToolConfig(
  toolName: string,
  config: { enabled: boolean; version: string },
  cwd: string = process.cwd()
): Promise<void> {
  const configPath = join(cwd, 'specsafe.config.json');
  let existingConfig: Record<string, unknown> = {};

  try {
    const content = await readFile(configPath, 'utf-8');
    existingConfig = JSON.parse(content);
  } catch {
    // Config doesn't exist yet, start fresh
  }

  existingConfig.tools = {
    ...((existingConfig.tools as Record<string, unknown> | undefined) || {}),
    [toolName]: config,
  };

  await writeFile(configPath, JSON.stringify(existingConfig, null, 2));
}

/**
 * Remove tool configuration from specsafe.config.json
 */
export async function removeToolConfig(
  toolName: string,
  cwd: string = process.cwd()
): Promise<void> {
  const configPath = join(cwd, 'specsafe.config.json');
  let content: string;
  try {
    content = await readFile(configPath, 'utf-8');
  } catch {
    return;
  }

  let config: Record<string, any>;
  try {
    config = JSON.parse(content);
  } catch {
    // Config is malformed JSON, nothing safe to do
    return;
  }

  if (config.tools && config.tools[toolName]) {
    delete config.tools[toolName];
    await writeFile(configPath, JSON.stringify(config, null, 2));
  }
}
