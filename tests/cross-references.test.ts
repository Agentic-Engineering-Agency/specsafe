import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const SKILLS_DIR = path.resolve(__dirname, '../canonical/skills');

// Expected persona assignments per the plan
const PERSONA_MAP: Record<string, { name: string; role: string }> = {
  'specsafe-explore': { name: 'Elena', role: 'Exploration Lead' },
  'specsafe-new': { name: 'Kai', role: 'Spec Architect' },
  'specsafe-spec': { name: 'Kai', role: 'Spec Architect' },
  'specsafe-test': { name: 'Reva', role: 'Test Engineer' },
  'specsafe-code': { name: 'Zane', role: 'Implementation Engineer' },
  'specsafe-verify': { name: 'Lyra', role: 'QA Inspector' },
  'specsafe-qa': { name: 'Lyra', role: 'QA Inspector' },
  'specsafe-complete': { name: 'Cass', role: 'Release Manager' },
};

// All valid skill names for handoff validation
const VALID_SKILL_NAMES = fs.readdirSync(SKILLS_DIR).filter((entry) =>
  fs.statSync(path.join(SKILLS_DIR, entry)).isDirectory(),
);

// Skills with workflow.md files
const WORKFLOW_SKILLS = VALID_SKILL_NAMES.filter((skill) =>
  fs.existsSync(path.join(SKILLS_DIR, skill, 'workflow.md')),
);

describe('Cross-references', () => {
  describe('handoff references', () => {
    for (const skill of WORKFLOW_SKILLS) {
      const workflowPath = path.join(SKILLS_DIR, skill, 'workflow.md');
      const content = fs.readFileSync(workflowPath, 'utf-8');

      // Find the Handoff section
      const handoffMatch = content.match(/## Handoff\n([\s\S]*?)(?=\n## |\n$|$)/);
      if (!handoffMatch) continue;

      const handoffSection = handoffMatch[1];

      // Extract all /specsafe-<name> references
      const skillRefs = handoffSection.match(/\/specsafe-[\w-]+/g);
      if (!skillRefs) continue;

      for (const ref of skillRefs) {
        const referencedSkill = ref.slice(1); // remove leading /
        it(`${skill} handoff to ${referencedSkill} references a valid skill`, () => {
          expect(VALID_SKILL_NAMES).toContain(referencedSkill);
        });
      }
    }
  });

  describe('persona assignments match plan', () => {
    for (const [skill, expected] of Object.entries(PERSONA_MAP)) {
      const workflowPath = path.join(SKILLS_DIR, skill, 'workflow.md');
      if (!fs.existsSync(workflowPath)) continue;

      it(`${skill} uses persona ${expected.name}`, () => {
        const content = fs.readFileSync(workflowPath, 'utf-8');
        const personaLine = content.match(/> \*\*Persona:\*\* (.+)/);
        expect(personaLine).not.toBeNull();
        expect(personaLine![1]).toContain(expected.name);
      });
    }
  });

  describe('handoff chain completeness', () => {
    // The expected handoff chain from the plan
    const EXPECTED_HANDOFFS: Record<string, string[]> = {
      'specsafe-explore': ['specsafe-new'],
      'specsafe-new': ['specsafe-spec'],
      'specsafe-spec': ['specsafe-test'],
      'specsafe-test': ['specsafe-code'],
      'specsafe-verify': ['specsafe-qa', 'specsafe-code'],
      'specsafe-qa': ['specsafe-complete', 'specsafe-code'],
    };

    for (const [skill, expectedTargets] of Object.entries(EXPECTED_HANDOFFS)) {
      const workflowPath = path.join(SKILLS_DIR, skill, 'workflow.md');
      if (!fs.existsSync(workflowPath)) continue;

      it(`${skill} hands off to expected skills`, () => {
        const content = fs.readFileSync(workflowPath, 'utf-8');
        const handoffMatch = content.match(/## Handoff\n([\s\S]*?)(?=\n## |\n$|$)/);
        expect(handoffMatch).not.toBeNull();

        const handoffSection = handoffMatch![1];
        for (const target of expectedTargets) {
          expect(handoffSection).toContain(target);
        }
      });
    }
  });
});
