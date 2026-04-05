import { describe, it, expect, afterEach } from 'vitest';
import { cursorAdapter } from '../../src/adapters/cursor.js';
import { createTempDir, setupDetectDir, createTestSkills, findFile, createCanonicalDir, cleanupTempDirs } from './helpers.js';

describe('cursor adapter', () => {
  afterEach(cleanupTempDirs);
  describe('detect', () => {
    it('returns true when .cursor/ exists', async () => {
      const tmp = createTempDir();
      setupDetectDir(tmp, ['.cursor']);
      expect(await cursorAdapter.detect(tmp)).toBe(true);
    });

    it('returns true when .cursorrules exists', async () => {
      const tmp = createTempDir();
      setupDetectDir(tmp, ['.cursorrules']);
      expect(await cursorAdapter.detect(tmp)).toBe(true);
    });

    it('returns false when neither exists', async () => {
      const tmp = createTempDir();
      expect(await cursorAdapter.detect(tmp)).toBe(false);
    });
  });

  describe('generate', () => {
    it('generates SKILL.md for each skill', async () => {
      const tmp = createTempDir();
      const canonical = createCanonicalDir(tmp);
      const skills = createTestSkills();
      const files = await cursorAdapter.generate(skills, canonical);

      expect(findFile(files, '.cursor/skills/specsafe-init/SKILL.md')).toBeDefined();
      expect(findFile(files, '.cursor/skills/specsafe-code/SKILL.md')).toBeDefined();
    });

    it('generates specsafe.mdc rules file', async () => {
      const tmp = createTempDir();
      const canonical = createCanonicalDir(tmp);
      const skills = createTestSkills();
      const files = await cursorAdapter.generate(skills, canonical);

      const rules = findFile(files, '.cursor/rules/specsafe.mdc');
      expect(rules).toBeDefined();
      expect(rules!.content).toContain('description: SpecSafe');
    });

    it('generates workflow.md when present', async () => {
      const tmp = createTempDir();
      const canonical = createCanonicalDir(tmp);
      const skills = createTestSkills();
      const files = await cursorAdapter.generate(skills, canonical);

      expect(findFile(files, '.cursor/skills/specsafe-code/workflow.md')).toBeDefined();
    });
  });
});
