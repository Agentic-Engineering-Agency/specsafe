import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CanonicalSkill, GeneratedFile, ToolAdapter } from './types.js';
import { readCanonicalRule } from './utils.js';

const SPECSAFE_READ_ENTRIES = ['CONVENTIONS.md', 'PROJECT_STATE.md'];

export const aiderAdapter: ToolAdapter = {
  name: 'aider',
  displayName: 'Aider',

  async detect(projectRoot: string): Promise<boolean> {
    return existsSync(join(projectRoot, '.aider.conf.yml'));
  },

  async generate(
    _skills: CanonicalSkill[],
    canonicalDir: string,
    projectRoot?: string,
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    const readEntries = [...SPECSAFE_READ_ENTRIES];
    let otherLines: string[] = [];
    if (projectRoot) {
      const confPath = join(projectRoot, '.aider.conf.yml');
      if (existsSync(confPath)) {
        try {
          const existing = readFileSync(confPath, 'utf-8');
          // Separate "read:" block from all other config lines
          const lines = existing.split('\n');
          let inReadBlock = false;
          for (const line of lines) {
            if (/^read:\s*$/.test(line)) {
              inReadBlock = true;
              continue;
            }
            if (inReadBlock && /^\s+-\s+/.test(line)) {
              // Read entry — merge with dedup
              const entry = line.replace(/^\s+-\s+/, '').trim();
              if (entry && !readEntries.includes(entry)) {
                readEntries.push(entry);
              }
              continue;
            }
            // Any non-read line ends the read block
            inReadBlock = false;
            if (line.trim() !== '') {
              otherLines.push(line);
            }
          }
        } catch {
          // Can't read — use defaults
        }
      }
    }

    const readYaml = readEntries.map((e) => `  - ${e}`).join('\n');
    const otherYaml = otherLines.length > 0 ? `\n${otherLines.join('\n')}\n` : '';
    files.push({
      path: '.aider.conf.yml',
      content: `read:\n${readYaml}\n${otherYaml}`,
    });

    const conventions = readCanonicalRule(canonicalDir, 'CONVENTIONS.md');
    if (conventions) {
      files.push({ path: 'CONVENTIONS.md', content: conventions });
    }

    return files;
  },
};
