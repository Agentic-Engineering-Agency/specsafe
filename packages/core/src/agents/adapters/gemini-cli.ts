/**
 * Gemini CLI Adapter
 * Generates configuration for Gemini CLI
 */

import { BaseAgentAdapter } from './base.js';
import type { AgentDefinition, GeneratedFile, GenerateOptions } from '../types.js';
import { getRequiredAgentDefinition } from '../registry.js';

export class GeminiCliAdapter extends BaseAgentAdapter {
  agent: AgentDefinition = getRequiredAgentDefinition('gemini-cli');

  async generateConfig(projectDir: string, options?: GenerateOptions): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    // Generate config.yaml
    files.push({
      path: '.gemini/config.yaml',
      content: `# Gemini CLI configuration for SpecSafe v1.0
name: SpecSafe
version: 1.0.0

# Context files to always include
context:
  - PROJECT_STATE.md
  - specsafe.config.json
  - specs/active/*.md

# Custom prompts directory
prompts_dir: .gemini/prompts

# Default model
model: gemini-1.5-pro

# System instructions
system: |
  ${this.getMainContext().split('\n').join('\n  ')}
`,
    });

    return files;
  }

  async generateCommands(projectDir: string, options?: GenerateOptions): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    // Generate prompt files for each command
    for (const command of this.getWorkflowCommands()) {
      files.push({
        path: `.gemini/prompts/${command}.md`,
        content: `# ${this.getCommandDescription(command)}

${this.getCommandPrompt(command)}

---
Command: /${command}
`,
      });
    }

    return files;
  }

  getInstructions(): string {
    return `Gemini CLI Setup Complete!

Files created:
- .gemini/config.yaml - Main configuration
- .gemini/prompts/ - Workflow command prompts

## Usage

1. Install Gemini CLI if not already installed
2. Navigate to your project directory
3. Use commands:
   - gemini /specsafe - Check status
   - gemini /specsafe-explore - Start exploration
   - gemini /specsafe-new - Create spec
   - gemini /specsafe-spec - Generate detailed spec
   - gemini /specsafe-test-create - Generate tests
   - gemini /specsafe-test-apply - Implement
   - gemini /specsafe-verify - Verify tests
   - gemini /specsafe-done - Complete spec

The CLI will use the prompts in .gemini/prompts/ to guide the workflow.
`;
  }
}
