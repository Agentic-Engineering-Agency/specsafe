import { describe, it, expect, afterEach } from 'vitest';
import { antigravityAdapter } from '../../src/adapters/antigravity.js';
import { createTempDir, setupDetectDir, createTestSkills, findFile, createCanonicalDir, cleanupTempDirs } from './helpers.js';

describe('antigravity adapter', () => {
  afterEach(cleanupTempDirs);
  describe('detect', () => {
    it('returns true when .agent/ exists', async () => {
      const tmp = createTempDir();
      setupDetectDir(tmp, ['.agent']);
      expect(await antigravityAdapter.detect(tmp)).toBe(true);
    });

    it('returns true when AGENTS.md exists', async () => {
      const tmp = createTempDir();
      setupDetectDir(tmp, ['AGENTS.md']);
      expect(await antigravityAdapter.detect(tmp)).toBe(true);
    });

    it('returns false when neither exists', async () => {
      const tmp = createTempDir();
      expect(await antigravityAdapter.detect(tmp)).toBe(false);
    });
  });

  describe('generate', () => {
    it('generates SKILL.md for each skill', async () => {
      const tmp = createTempDir();
      const canonical = createCanonicalDir(tmp);
      const skills = createTestSkills();
      const files = await antigravityAdapter.generate(skills, canonical);

      expect(findFile(files, '.agent/skills/specsafe-init/SKILL.md')).toBeDefined();
      expect(findFile(files, '.agent/skills/specsafe-code/SKILL.md')).toBeDefined();
    });

    it('generates rules and root AGENTS.md', async () => {
      const tmp = createTempDir();
      const canonical = createCanonicalDir(tmp);
      const skills = createTestSkills();
      const files = await antigravityAdapter.generate(skills, canonical);

      const rules = findFile(files, '.agent/rules/specsafe.md');
      expect(rules).toBeDefined();
      expect(rules!.content).toContain('# Agents Rules');

      const agents = findFile(files, 'AGENTS.md');
      expect(agents).toBeDefined();
      expect(agents!.content).toContain('# Agents Rules');
    });

    it('generates workflow.md when present', async () => {
      const tmp = createTempDir();
      const canonical = createCanonicalDir(tmp);
      const skills = createTestSkills();
      const files = await antigravityAdapter.generate(skills, canonical);

      expect(findFile(files, '.agent/skills/specsafe-code/workflow.md')).toBeDefined();
      expect(findFile(files, '.agent/skills/specsafe-init/workflow.md')).toBeUndefined();
    });
  });
});
