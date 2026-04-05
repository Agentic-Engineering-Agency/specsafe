import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { CanonicalSkill, GeneratedFile, ToolAdapter } from './types.js';
import { readCanonicalRule, reconstructSkillMd } from './utils.js';

export const claudeCodeAdapter: ToolAdapter = {
  name: 'claude-code',
  displayName: 'Claude Code',

  async detect(projectRoot: string): Promise<boolean> {
    return existsSync(join(projectRoot, '.claude'));
  },

  async generate(skills: CanonicalSkill[], canonicalDir: string): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    for (const skill of skills) {
      files.push({
        path: `.claude/skills/${skill.directory}/SKILL.md`,
        content: reconstructSkillMd(skill),
      });
      if (skill.workflowContent) {
        files.push({
          path: `.claude/skills/${skill.directory}/workflow.md`,
          content: skill.workflowContent,
        });
      }
    }

    const claudeMd = readCanonicalRule(canonicalDir, 'CLAUDE.md');
    if (claudeMd) {
      files.push({ path: 'CLAUDE.md', content: claudeMd });
    }

    return files;
  },
};
