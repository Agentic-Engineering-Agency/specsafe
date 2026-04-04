import { describe, it, expect, afterEach } from 'vitest';
import { claudeCodeAdapter } from '../../src/adapters/claude-code.js';
import { createTempDir, setupDetectDir, createTestSkills, findFile, createCanonicalDir, cleanupTempDirs } from './helpers.js';

describe('claude-code adapter', () => {
  afterEach(cleanupTempDirs);
  describe('detect', () => {
    it('returns true when .claude/ exists', async () => {
      const tmp = createTempDir();
      setupDetectDir(tmp, ['.claude']);
      expect(await claudeCodeAdapter.detect(tmp)).toBe(true);
    });

    it('returns false when .claude/ is missing', async () => {
      const tmp = createTempDir();
      expect(await claudeCodeAdapter.detect(tmp)).toBe(false);
    });
  });

  describe('generate', () => {
    it('generates SKILL.md for each skill', async () => {
      const tmp = createTempDir();
      const canonical = createCanonicalDir(tmp);
      const skills = createTestSkills();
      const files = await claudeCodeAdapter.generate(skills, canonical);

      const init = findFile(files, '.claude/skills/specsafe-init/SKILL.md');
      expect(init).toBeDefined();
      expect(init!.content).toContain('name: specsafe-init');
      expect(init!.content).toContain('# SpecSafe Init');
    });

    it('generates workflow.md when present', async () => {
      const tmp = createTempDir();
      const canonical = createCanonicalDir(tmp);
      const skills = createTestSkills();
      const files = await claudeCodeAdapter.generate(skills, canonical);

      const workflow = findFile(files, '.claude/skills/specsafe-code/workflow.md');
      expect(workflow).toBeDefined();
      expect(workflow!.content).toContain('Refactor');

      // No workflow for init
      expect(findFile(files, '.claude/skills/specsafe-init/workflow.md')).toBeUndefined();
    });

    it('copies CLAUDE.md to project root', async () => {
      const tmp = createTempDir();
      const canonical = createCanonicalDir(tmp);
      const skills = createTestSkills();
      const files = await claudeCodeAdapter.generate(skills, canonical);

      const claude = findFile(files, 'CLAUDE.md');
      expect(claude).toBeDefined();
      expect(claude!.content).toContain('# Claude Rules');
    });
  });
});
