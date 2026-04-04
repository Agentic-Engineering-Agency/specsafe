import { describe, it, expect } from 'vitest';
import { geminiAdapter } from '../../src/adapters/gemini.js';
import { createTempDir, setupDetectDir, createTestSkills, findFile, createCanonicalDir } from './helpers.js';

describe('gemini adapter', () => {
  describe('detect', () => {
    it('returns true when .gemini/ exists', async () => {
      const tmp = createTempDir();
      setupDetectDir(tmp, ['.gemini']);
      expect(await geminiAdapter.detect(tmp)).toBe(true);
    });

    it('returns true when GEMINI.md exists', async () => {
      const tmp = createTempDir();
      setupDetectDir(tmp, ['GEMINI.md']);
      expect(await geminiAdapter.detect(tmp)).toBe(true);
    });

    it('returns false when neither exists', async () => {
      const tmp = createTempDir();
      expect(await geminiAdapter.detect(tmp)).toBe(false);
    });
  });

  describe('generate', () => {
    it('generates SKILL.md for each skill', async () => {
      const tmp = createTempDir();
      const canonical = createCanonicalDir(tmp);
      const skills = createTestSkills();
      const files = await geminiAdapter.generate(skills, canonical);

      expect(findFile(files, '.gemini/skills/specsafe-init/SKILL.md')).toBeDefined();
      expect(findFile(files, '.gemini/skills/specsafe-code/SKILL.md')).toBeDefined();
    });

    it('generates TOML command files', async () => {
      const tmp = createTempDir();
      const canonical = createCanonicalDir(tmp);
      const skills = createTestSkills();
      const files = await geminiAdapter.generate(skills, canonical);

      const cmd = findFile(files, '.gemini/commands/specsafe-init.toml');
      expect(cmd).toBeDefined();
      expect(cmd!.content).toContain('description = "Initialize a new SpecSafe project"');
      expect(cmd!.content).toContain('prompt = "Activate the specsafe-init skill. {{args}}"');
    });

    it('generates GEMINI.md at project root', async () => {
      const tmp = createTempDir();
      const canonical = createCanonicalDir(tmp);
      const skills = createTestSkills();
      const files = await geminiAdapter.generate(skills, canonical);

      const gemini = findFile(files, 'GEMINI.md');
      expect(gemini).toBeDefined();
      expect(gemini!.content).toContain('# Gemini Rules');
    });

    it('escapes quotes in TOML command files', async () => {
      const tmp = createTempDir();
      const canonical = createCanonicalDir(tmp);
      const skills = createTestSkills();
      skills[0].description = 'A "special" skill with \\ backslash';
      const files = await geminiAdapter.generate(skills, canonical);

      const cmd = findFile(files, '.gemini/commands/specsafe-init.toml');
      expect(cmd).toBeDefined();
      expect(cmd!.content).toContain('A \\"special\\" skill with \\\\ backslash');
    });

    it('generates workflow.md when present', async () => {
      const tmp = createTempDir();
      const canonical = createCanonicalDir(tmp);
      const skills = createTestSkills();
      const files = await geminiAdapter.generate(skills, canonical);

      expect(findFile(files, '.gemini/skills/specsafe-code/workflow.md')).toBeDefined();
      expect(findFile(files, '.gemini/skills/specsafe-init/workflow.md')).toBeUndefined();
    });
  });
});
