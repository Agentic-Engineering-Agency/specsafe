import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ToolAdapter, CanonicalSkill, GeneratedFile } from './types.js';
import { readCanonicalRule, reconstructSkillMd } from './utils.js';

export const cursorAdapter: ToolAdapter = {
  name: 'cursor',
  displayName: 'Cursor',

  async detect(projectRoot: string): Promise<boolean> {
    return (
      existsSync(join(projectRoot, '.cursor')) ||
      existsSync(join(projectRoot, '.cursorrules'))
    );
  },

  async generate(skills: CanonicalSkill[], canonicalDir: string): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    for (const skill of skills) {
      files.push({
        path: `.cursor/skills/${skill.directory}/SKILL.md`,
        content: reconstructSkillMd(skill),
      });
      if (skill.workflowContent) {
        files.push({
          path: `.cursor/skills/${skill.directory}/workflow.md`,
          content: skill.workflowContent,
        });
      }
    }

    const cursorRules = readCanonicalRule(canonicalDir, '.cursorrules.mdc');
    if (cursorRules) {
      files.push({ path: '.cursor/rules/specsafe.mdc', content: cursorRules });
    }

    return files;
  },
};
