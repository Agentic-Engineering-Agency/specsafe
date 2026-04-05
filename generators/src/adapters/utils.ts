import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CanonicalSkill } from './types.js';

/** Parse YAML frontmatter from markdown content */
export function parseFrontmatter(content: string): {
  frontmatter: Record<string, string>;
  body: string;
} {
  // Normalize line endings to handle Windows \r\n
  const normalized = content.replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };
  const frontmatter: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      let value = line.slice(colonIdx + 1).trim();
      // Remove quotes
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      frontmatter[key] = value;
    }
  }
  return { frontmatter, body: match[2] };
}

/** Load all canonical skills from the canonical/skills directory */
export function loadCanonicalSkills(canonicalDir: string): CanonicalSkill[] {
  const skillsDir = join(canonicalDir, 'skills');
  const skills: CanonicalSkill[] = [];

  for (const dir of readdirSync(skillsDir, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const skillPath = join(skillsDir, dir.name, 'SKILL.md');
    if (!existsSync(skillPath)) continue;

    const content = readFileSync(skillPath, 'utf-8');
    const { frontmatter, body } = parseFrontmatter(content);

    const workflowPath = join(skillsDir, dir.name, 'workflow.md');
    const workflowContent = existsSync(workflowPath)
      ? readFileSync(workflowPath, 'utf-8')
      : undefined;

    skills.push({
      name: frontmatter.name || dir.name,
      description: frontmatter.description || '',
      disableModelInvocation: frontmatter['disable-model-invocation'] === 'true',
      content: body,
      workflowContent,
      directory: dir.name,
    });
  }

  return skills;
}

/** Read a canonical rule file, returning its content or empty string if missing */
export function readCanonicalRule(canonicalDir: string, filename: string): string {
  const rulePath = join(canonicalDir, 'rules', filename);
  return existsSync(rulePath) ? readFileSync(rulePath, 'utf-8') : '';
}

/** Reconstruct full SKILL.md content (frontmatter + body) from a CanonicalSkill */
export function reconstructSkillMd(skill: CanonicalSkill): string {
  let fm = '---\n';
  fm += `name: ${skill.name}\n`;
  fm += `description: '${skill.description.replace(/'/g, "''")}'\n`;
  if (skill.disableModelInvocation) {
    fm += `disable-model-invocation: true\n`;
  }
  fm += '---\n';
  return fm + skill.content;
}
