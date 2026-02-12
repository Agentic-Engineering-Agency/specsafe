/**
 * OpenCode Adapter
 * Generates configuration for OpenCode (Charm)
 */

import { BaseAgentAdapter } from './base.js';
import type { AgentDefinition, GeneratedFile, GenerateOptions } from '../types.js';
import { AGENT_DEFINITIONS } from '../registry.js';

export class OpenCodeAdapter extends BaseAgentAdapter {
  agent: AgentDefinition = AGENT_DEFINITIONS.find((a) => a.id === 'opencode')!;

  async generateConfig(projectDir: string, options?: GenerateOptions): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    // Generate README for context
    files.push({
      path: '.opencode/README.md',
      content: `# SpecSafe Commands for OpenCode

${this.getMainContext()}

## Available Commands

${this.getWorkflowCommands().map((cmd) => `- /${cmd} - ${this.getCommandDescription(cmd)}`).join('\n')}

## Usage

Invoke commands using \`/command-name\` syntax.
Each command is defined in the commands/ directory.
`,
    });

    return files;
  }

  async generateCommands(projectDir: string, options?: GenerateOptions): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    // Generate command files
    for (const command of this.getWorkflowCommands()) {
      files.push({
        path: `.opencode/commands/${command}.md`,
        content: `# ${this.getCommandDescription(command)}

${this.getCommandPrompt(command)}
`,
      });
    }

    return files;
  }

  getInstructions(): string {
    return `OpenCode Setup Complete!

Files created:
- .opencode/README.md - Overview
- .opencode/commands/ - Workflow commands

## Usage

1. Open your project with OpenCode
2. Use slash commands:
   - /specsafe - Check status
   - /specsafe-explore - Start exploration
   - /specsafe-new - Create spec
   - /specsafe-test-create - Generate tests
   - /specsafe-test-apply - Implement
   - /specsafe-verify - Verify tests
   - /specsafe-done - Complete spec

OpenCode will load commands from .opencode/commands/ directory.
`;
  }
}
