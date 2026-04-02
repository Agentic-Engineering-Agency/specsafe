import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ToolAdapter, CanonicalSkill, GeneratedFile } from './types.js';
import { reconstructSkillMd } from './utils.js';

export const opencodeAdapter: ToolAdapter = {
  name: 'opencode',
  displayName: 'OpenCode',

  async detect(projectRoot: string): Promise<boolean> {
    return (
      existsSync(join(projectRoot, '.opencode')) ||
      existsSync(join(projectRoot, 'OPENCODE.md'))
    );
  },

  async generate(skills: CanonicalSkill[], _canonicalDir: string): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    for (const skill of skills) {
      files.push({
        path: `.opencode/skills/${skill.directory}/SKILL.md`,
        content: reconstructSkillMd(skill),
      });
      if (skill.workflowContent) {
        files.push({
          path: `.opencode/skills/${skill.directory}/workflow.md`,
          content: skill.workflowContent,
        });
      }
      files.push({
        path: `.opencode/command/${skill.directory}.md`,
        content: `---\ndescription: ${skill.description}\n---\n\nFollow the instructions in the skill: ${skill.name}\n`,
      });
    }

    return files;
  },
};
