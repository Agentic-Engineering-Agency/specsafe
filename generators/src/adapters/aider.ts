import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ToolAdapter, CanonicalSkill, GeneratedFile } from './types.js';
import { readCanonicalRule } from './utils.js';

export const aiderAdapter: ToolAdapter = {
  name: 'aider',
  displayName: 'Aider',

  async detect(projectRoot: string): Promise<boolean> {
    return existsSync(join(projectRoot, '.aider.conf.yml'));
  },

  async generate(_skills: CanonicalSkill[], canonicalDir: string): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    files.push({
      path: '.aider.conf.yml',
      content: 'read:\n  - CONVENTIONS.md\n  - PROJECT_STATE.md\n',
    });

    const conventions = readCanonicalRule(canonicalDir, 'CONVENTIONS.md');
    if (conventions) {
      files.push({ path: 'CONVENTIONS.md', content: conventions });
    }

    return files;
  },
};
