import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { CanonicalSkill, GeneratedFile, ToolAdapter } from './types.js';
import { readCanonicalRule, reconstructSkillMd } from './utils.js';

/** Escape a string for use inside a TOML double-quoted value */
function escapeToml(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\x08/g, '\\b')
    .replace(/\x0c/g, '\\f');
}

export const geminiAdapter: ToolAdapter = {
  name: 'gemini',
  displayName: 'Gemini',

  async detect(projectRoot: string): Promise<boolean> {
    return existsSync(join(projectRoot, '.gemini')) || existsSync(join(projectRoot, 'GEMINI.md'));
  },

  async generate(skills: CanonicalSkill[], canonicalDir: string): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    for (const skill of skills) {
      files.push({
        path: `.gemini/skills/${skill.directory}/SKILL.md`,
        content: reconstructSkillMd(skill),
      });
      if (skill.workflowContent) {
        files.push({
          path: `.gemini/skills/${skill.directory}/workflow.md`,
          content: skill.workflowContent,
        });
      }
      files.push({
        path: `.gemini/commands/${skill.directory}.toml`,
        content: `description = "${escapeToml(skill.description)}"\nprompt = "Activate the ${escapeToml(skill.name)} skill. {{args}}"\n`,
      });
    }

    const geminiMd = readCanonicalRule(canonicalDir, 'GEMINI.md');
    if (geminiMd) {
      files.push({ path: 'GEMINI.md', content: geminiMd });
    }

    return files;
  },
};
