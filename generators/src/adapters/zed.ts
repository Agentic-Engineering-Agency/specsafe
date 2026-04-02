import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ToolAdapter, CanonicalSkill, GeneratedFile } from './types.js';
import { readCanonicalRule } from './utils.js';

export const zedAdapter: ToolAdapter = {
  name: 'zed',
  displayName: 'Zed',

  async detect(projectRoot: string): Promise<boolean> {
    return existsSync(join(projectRoot, '.zed'));
  },

  async generate(_skills: CanonicalSkill[], canonicalDir: string): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    const rules = readCanonicalRule(canonicalDir, '.rules');
    if (rules) {
      files.push({ path: '.rules', content: rules });
    }

    files.push({
      path: '.zed/settings.json',
      content: JSON.stringify(
        {
          assistant: {
            version: '2',
            default_model: {
              provider: 'anthropic',
              model: 'claude-sonnet-4-20250514',
            },
          },
        },
        null,
        2,
      ) + '\n',
    });

    return files;
  },
};
