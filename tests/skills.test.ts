import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const SKILLS_DIR = path.resolve(__dirname, '../canonical/skills');

// Dynamically discover all skill directories
const ALL_SKILLS = fs
  .readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

// Categorize by presence of workflow.md
const WORKFLOW_SKILLS = ALL_SKILLS.filter((skill) =>
  fs.existsSync(path.join(SKILLS_DIR, skill, 'workflow.md')),
);

const SELF_CONTAINED_SKILLS = ALL_SKILLS.filter(
  (skill) => !fs.existsSync(path.join(SKILLS_DIR, skill, 'workflow.md')),
);

function parseFrontmatter(content: string): Record<string, string> | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fields: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();
      fields[key] = value;
    }
  }
  return fields;
}

describe('Canonical Skills', () => {
  it('discovers at least one skill', () => {
    expect(ALL_SKILLS.length).toBeGreaterThan(0);
  });

  for (const skill of ALL_SKILLS) {
    describe(skill, () => {
      const skillDir = path.join(SKILLS_DIR, skill);
      const skillMdPath = path.join(skillDir, 'SKILL.md');

      it('directory exists', () => {
        expect(fs.existsSync(skillDir)).toBe(true);
      });

      it('has SKILL.md', () => {
        expect(fs.existsSync(skillMdPath)).toBe(true);
      });

      it('SKILL.md has valid YAML frontmatter with name and description', () => {
        const content = fs.readFileSync(skillMdPath, 'utf-8');
        const fm = parseFrontmatter(content);
        expect(fm).not.toBeNull();
        expect(fm?.name).toBeDefined();
        expect(fm?.name.length).toBeGreaterThan(0);
        expect(fm?.description).toBeDefined();
        expect(fm?.description.length).toBeGreaterThan(0);
      });

      it('SKILL.md name field matches directory name', () => {
        const content = fs.readFileSync(skillMdPath, 'utf-8');
        const fm = parseFrontmatter(content);
        expect(fm?.name).toBe(skill);
      });

      it('SKILL.md has disable-model-invocation: true', () => {
        const content = fs.readFileSync(skillMdPath, 'utf-8');
        const fm = parseFrontmatter(content);
        expect(fm?.['disable-model-invocation']).toBe('true');
      });
    });
  }

  describe('workflow skills', () => {
    for (const skill of WORKFLOW_SKILLS) {
      describe(skill, () => {
        const skillDir = path.join(SKILLS_DIR, skill);
        const skillMdPath = path.join(skillDir, 'SKILL.md');
        const workflowPath = path.join(skillDir, 'workflow.md');

        it('has workflow.md', () => {
          expect(fs.existsSync(workflowPath)).toBe(true);
        });

        it('SKILL.md references workflow.md', () => {
          const content = fs.readFileSync(skillMdPath, 'utf-8');
          expect(content).toContain('workflow.md');
        });

        it('workflow.md has persona block', () => {
          const content = fs.readFileSync(workflowPath, 'utf-8');
          expect(content).toMatch(/> \*\*Persona:\*\*/);
        });

        it('workflow.md has Preconditions section', () => {
          const content = fs.readFileSync(workflowPath, 'utf-8');
          expect(content).toMatch(/## Preconditions/);
        });

        it('workflow.md has Workflow section with at least one Step', () => {
          const content = fs.readFileSync(workflowPath, 'utf-8');
          expect(content).toMatch(/## Workflow/);
          expect(content).toMatch(/### Step \d+/);
        });

        it('workflow.md has Guardrails section', () => {
          const content = fs.readFileSync(workflowPath, 'utf-8');
          expect(content).toMatch(/## Guardrails/);
        });

        it('workflow.md has Handoff or State Changes section', () => {
          const content = fs.readFileSync(workflowPath, 'utf-8');
          const hasHandoff = /## Handoff/.test(content);
          const hasStateChanges = /## State Changes/.test(content);
          expect(hasHandoff || hasStateChanges).toBe(true);
        });
      });
    }
  });

  describe('self-contained skills', () => {
    for (const skill of SELF_CONTAINED_SKILLS) {
      describe(skill, () => {
        const skillMdPath = path.join(SKILLS_DIR, skill, 'SKILL.md');

        it('SKILL.md has workflow content (## Workflow or ## Steps or **Steps**)', () => {
          const content = fs.readFileSync(skillMdPath, 'utf-8');
          const hasWorkflow = /## Workflow/.test(content);
          const hasSteps = /## Steps/.test(content) || /\*\*Steps\*\*/.test(content);
          // Also accept numbered step patterns like "### Step 1" or "1. **"
          const hasNumberedSteps = /### Step \d+/.test(content) || /\d+\.\s+\*\*/.test(content);
          expect(hasWorkflow || hasSteps || hasNumberedSteps).toBe(true);
        });
      });
    }
  });
});
