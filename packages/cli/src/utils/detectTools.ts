import { existsSync } from 'fs';

/**
 * Detects installed AI coding tools by checking for their config files
 * @returns Array of detected tool names
 */
export function detectInstalledTools(): string[] {
  const tools: string[] = [];
  
  if (existsSync('.cursorrules')) tools.push('cursor');
  if (existsSync('.continue/config.json')) tools.push('continue');
  if (existsSync('.aider.conf.yml')) tools.push('aider');
  if (existsSync('.zed/settings.json')) tools.push('zed');
  if (existsSync('.claude') || existsSync('CLAUDE.md')) tools.push('claude-code');
  if (existsSync('.opencode') || existsSync('.opencode/commands')) tools.push('crush');
  
  return tools;
}

/**
 * Tool configuration mapping
 */
export interface ToolConfig {
  name: string;
  displayName: string;
  configFiles: string[];
}

export const availableTools: ToolConfig[] = [
  {
    name: 'cursor',
    displayName: 'Cursor IDE',
    configFiles: ['.cursorrules', '.cursor/rules.md'],
  },
  {
    name: 'continue',
    displayName: 'Continue.dev',
    configFiles: ['.continue/config.json'],
  },
  {
    name: 'aider',
    displayName: 'Aider CLI',
    configFiles: ['.aider.conf.yml'],
  },
  {
    name: 'zed',
    displayName: 'Zed Editor',
    configFiles: ['.zed/settings.json'],
  },
  {
    name: 'claude-code',
    displayName: 'Claude Code',
    configFiles: ['CLAUDE.md', '.claude/'],
  },
  {
    name: 'crush',
    displayName: 'Crush',
    configFiles: ['.opencode/commands/'],
  },
];
