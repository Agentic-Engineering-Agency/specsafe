import { mkdtempSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { CanonicalSkill } from '../../src/adapters/types.js';

export function createTempDir(): string {
  return mkdtempSync(join(tmpdir(), 'specsafe-test-'));
}

export function setupDetectDir(tmpDir: string, paths: string[]): void {
  for (const p of paths) {
    const full = join(tmpDir, p);
    if (p.includes('.')) {
      // file
      const dir = full.substring(0, full.lastIndexOf('/'));
      mkdirSync(dir, { recursive: true });
      writeFileSync(full, '');
    } else {
      mkdirSync(full, { recursive: true });
    }
  }
}

export function createTestSkills(): CanonicalSkill[] {
  return [
    {
      name: 'specsafe-init',
      description: 'Initialize a new SpecSafe project',
      disableModelInvocation: true,
      content: '\n# SpecSafe Init\n\nInitialize the project.\n',
      workflowContent: undefined,
      directory: 'specsafe-init',
    },
    {
      name: 'specsafe-code',
      description: 'TDD implementation using red-green-refactor cycle',
      disableModelInvocation: true,
      content: '\nFollow the instructions in ./workflow.md\n',
      workflowContent: '# Workflow\n\nStep 1: Red\nStep 2: Green\nStep 3: Refactor\n',
      directory: 'specsafe-code',
    },
  ];
}

export function findFile(files: { path: string; content: string }[], path: string) {
  return files.find((f) => f.path === path);
}

/** Create a minimal canonical directory for use with loadCanonicalSkills */
export function createCanonicalDir(tmpDir: string): string {
  const canonical = join(tmpDir, 'canonical');
  const skillsDir = join(canonical, 'skills');
  const rulesDir = join(canonical, 'rules');
  mkdirSync(skillsDir, { recursive: true });
  mkdirSync(rulesDir, { recursive: true });

  // Create a skill
  const initDir = join(skillsDir, 'specsafe-init');
  mkdirSync(initDir);
  writeFileSync(
    join(initDir, 'SKILL.md'),
    '---\nname: specsafe-init\ndescription: Initialize project\ndisable-model-invocation: true\n---\n\n# Init\n',
  );

  const codeDir = join(skillsDir, 'specsafe-code');
  mkdirSync(codeDir);
  writeFileSync(
    join(codeDir, 'SKILL.md'),
    '---\nname: specsafe-code\ndescription: TDD implementation\n---\n\nFollow workflow.\n',
  );
  writeFileSync(join(codeDir, 'workflow.md'), '# Workflow\n\nDo TDD.\n');

  // Create rules
  writeFileSync(join(rulesDir, 'CLAUDE.md'), '# Claude Rules\n');
  writeFileSync(join(rulesDir, 'CONVENTIONS.md'), '# Conventions\n');
  writeFileSync(join(rulesDir, 'GEMINI.md'), '# Gemini Rules\n');
  writeFileSync(join(rulesDir, 'AGENTS.md'), '# Agents Rules\n');
  writeFileSync(join(rulesDir, '.cursorrules.mdc'), '---\ndescription: SpecSafe\n---\n\n# Rules\n');
  writeFileSync(join(rulesDir, '.rules'), '# Zed Rules\n');
  writeFileSync(join(rulesDir, 'continue-config.yaml'), 'name: SpecSafe\n');

  return canonical;
}
