import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ToolAdapter, CanonicalSkill, GeneratedFile } from './types.js';
import { readCanonicalRule } from './utils.js';

const SPECSAFE_READ_ENTRIES = ['CONVENTIONS.md', 'PROJECT_STATE.md'];

export const aiderAdapter: ToolAdapter = {
  name: 'aider',
  displayName: 'Aider',

  async detect(projectRoot: string): Promise<boolean> {
    return existsSync(join(projectRoot, '.aider.conf.yml'));
  },

  async generate(_skills: CanonicalSkill[], canonicalDir: string, projectRoot?: string): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    let readEntries = [...SPECSAFE_READ_ENTRIES];
    if (projectRoot) {
      const confPath = join(projectRoot, '.aider.conf.yml');
      if (existsSync(confPath)) {
        try {
          const existing = readFileSync(confPath, 'utf-8');
          // Extract existing read entries and merge
          const readMatch = existing.match(/^read:\n((?:\s+-\s+.+\n?)*)/m);
          if (readMatch) {
            const existingEntries = readMatch[1]
              .split('\n')
              .map(l => l.replace(/^\s+-\s+/, '').trim())
              .filter(Boolean);
            for (const entry of existingEntries) {
              if (!readEntries.includes(entry)) {
                readEntries.push(entry);
              }
            }
          }
        } catch {
          // Can't read — use defaults
        }
      }
    }

    const readYaml = readEntries.map(e => `  - ${e}`).join('\n');
    files.push({
      path: '.aider.conf.yml',
      content: `read:\n${readYaml}\n`,
    });

    const conventions = readCanonicalRule(canonicalDir, 'CONVENTIONS.md');
    if (conventions) {
      files.push({ path: 'CONVENTIONS.md', content: conventions });
    }

    return files;
  },
};
