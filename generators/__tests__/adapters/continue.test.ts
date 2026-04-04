import { describe, it, expect, afterEach } from 'vitest';
import { continueAdapter } from '../../src/adapters/continue.js';
import { createTempDir, setupDetectDir, createTestSkills, findFile, createCanonicalDir, cleanupTempDirs } from './helpers.js';

describe('continue adapter', () => {
  afterEach(cleanupTempDirs);
  describe('detect', () => {
    it('returns true when .continue/ exists', async () => {
      const tmp = createTempDir();
      setupDetectDir(tmp, ['.continue']);
      expect(await continueAdapter.detect(tmp)).toBe(true);
    });

    it('returns false when .continue/ is missing', async () => {
      const tmp = createTempDir();
      expect(await continueAdapter.detect(tmp)).toBe(false);
    });
  });

  describe('generate', () => {
    it('generates prompt files with frontmatter', async () => {
      const tmp = createTempDir();
      const canonical = createCanonicalDir(tmp);
      const skills = createTestSkills();
      const files = await continueAdapter.generate(skills, canonical);

      const prompt = findFile(files, '.continue/prompts/specsafe-init.md');
      expect(prompt).toBeDefined();
      expect(prompt!.content).toContain('name: Specsafe Init');
      expect(prompt!.content).toContain('description: Initialize a new SpecSafe project');
      expect(prompt!.content).toContain('invokable: true');
      expect(prompt!.content).toContain('# SpecSafe Init');
    });

    it('merges workflow content into prompt file', async () => {
      const tmp = createTempDir();
      const canonical = createCanonicalDir(tmp);
      const skills = createTestSkills();
      const files = await continueAdapter.generate(skills, canonical);

      const prompt = findFile(files, '.continue/prompts/specsafe-code.md');
      expect(prompt).toBeDefined();
      expect(prompt!.content).toContain('Follow the instructions');
      expect(prompt!.content).toContain('Refactor');
    });

    it('generates specsafe.yaml agent config', async () => {
      const tmp = createTempDir();
      const canonical = createCanonicalDir(tmp);
      const skills = createTestSkills();
      const files = await continueAdapter.generate(skills, canonical);

      const config = findFile(files, '.continue/agents/specsafe.yaml');
      expect(config).toBeDefined();
      expect(config!.content).toContain('name: SpecSafe');
    });
  });
});
