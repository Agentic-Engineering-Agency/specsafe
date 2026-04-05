import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { CanonicalSkill, GeneratedFile, ToolAdapter } from './types.js';
import { readCanonicalRule } from './utils.js';

export const continueAdapter: ToolAdapter = {
  name: 'continue',
  displayName: 'Continue',

  async detect(projectRoot: string): Promise<boolean> {
    return existsSync(join(projectRoot, '.continue'));
  },

  async generate(skills: CanonicalSkill[], canonicalDir: string): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    for (const skill of skills) {
      let body = skill.content;
      if (skill.workflowContent) {
        body += `\n${skill.workflowContent}`;
      }

      const displayName = skill.name
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      files.push({
        path: `.continue/prompts/${skill.directory}.md`,
        content: `---\nname: ${displayName}\ndescription: ${skill.description}\ninvokable: true\n---\n\n${body}`,
      });
    }

    const config = readCanonicalRule(canonicalDir, 'continue-config.yaml');
    if (config) {
      files.push({ path: '.continue/agents/specsafe.yaml', content: config });
    }

    return files;
  },
};
