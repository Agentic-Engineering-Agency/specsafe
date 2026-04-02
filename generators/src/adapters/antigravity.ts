import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ToolAdapter, CanonicalSkill, GeneratedFile } from './types.js';
import { readCanonicalRule, reconstructSkillMd } from './utils.js';

export const antigravityAdapter: ToolAdapter = {
  name: 'antigravity',
  displayName: 'Antigravity',

  async detect(projectRoot: string): Promise<boolean> {
    return (
      existsSync(join(projectRoot, '.agent')) ||
      existsSync(join(projectRoot, 'AGENTS.md'))
    );
  },

  async generate(skills: CanonicalSkill[], canonicalDir: string): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    for (const skill of skills) {
      files.push({
        path: `.agent/skills/${skill.directory}/SKILL.md`,
        content: reconstructSkillMd(skill),
      });
      if (skill.workflowContent) {
        files.push({
          path: `.agent/skills/${skill.directory}/workflow.md`,
          content: skill.workflowContent,
        });
      }
    }

    const agentsMd = readCanonicalRule(canonicalDir, 'AGENTS.md');
    if (agentsMd) {
      files.push({ path: '.agent/rules/specsafe.md', content: agentsMd });
      files.push({ path: 'AGENTS.md', content: agentsMd });
    }

    return files;
  },
};
