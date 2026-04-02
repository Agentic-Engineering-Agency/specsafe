import { describe, it, expect } from 'vitest';
import { opencodeAdapter } from '../../src/adapters/opencode.js';
import { createTempDir, setupDetectDir, createTestSkills, findFile, createCanonicalDir } from './helpers.js';

describe('opencode adapter', () => {
  describe('detect', () => {
    it('returns true when .opencode/ exists', async () => {
      const tmp = createTempDir();
      setupDetectDir(tmp, ['.opencode']);
      expect(await opencodeAdapter.detect(tmp)).toBe(true);
    });

    it('returns true when OPENCODE.md exists', async () => {
      const tmp = createTempDir();
      setupDetectDir(tmp, ['OPENCODE.md']);
      expect(await opencodeAdapter.detect(tmp)).toBe(true);
    });

    it('returns false when neither exists', async () => {
      const tmp = createTempDir();
      expect(await opencodeAdapter.detect(tmp)).toBe(false);
    });
  });

  describe('generate', () => {
    it('generates SKILL.md and command for each skill', async () => {
      const tmp = createTempDir();
      const canonical = createCanonicalDir(tmp);
      const skills = createTestSkills();
      const files = await opencodeAdapter.generate(skills, canonical);

      expect(findFile(files, '.opencode/skills/specsafe-init/SKILL.md')).toBeDefined();
      expect(findFile(files, '.opencode/skills/specsafe-code/SKILL.md')).toBeDefined();

      const cmd = findFile(files, '.opencode/command/specsafe-init.md');
      expect(cmd).toBeDefined();
      expect(cmd!.content).toContain('description: Initialize a new SpecSafe project');
      expect(cmd!.content).toContain('Follow the instructions in the skill: specsafe-init');
    });

    it('generates workflow.md when present', async () => {
      const tmp = createTempDir();
      const canonical = createCanonicalDir(tmp);
      const skills = createTestSkills();
      const files = await opencodeAdapter.generate(skills, canonical);

      expect(findFile(files, '.opencode/skills/specsafe-code/workflow.md')).toBeDefined();
      expect(findFile(files, '.opencode/skills/specsafe-init/workflow.md')).toBeUndefined();
    });
  });
});
