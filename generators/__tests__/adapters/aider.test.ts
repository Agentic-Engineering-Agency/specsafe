import { describe, it, expect } from 'vitest';
import { aiderAdapter } from '../../src/adapters/aider.js';
import { createTempDir, setupDetectDir, createTestSkills, findFile, createCanonicalDir } from './helpers.js';

describe('aider adapter', () => {
  describe('detect', () => {
    it('returns true when .aider.conf.yml exists', async () => {
      const tmp = createTempDir();
      setupDetectDir(tmp, ['.aider.conf.yml']);
      expect(await aiderAdapter.detect(tmp)).toBe(true);
    });

    it('returns false when .aider.conf.yml is missing', async () => {
      const tmp = createTempDir();
      expect(await aiderAdapter.detect(tmp)).toBe(false);
    });
  });

  describe('generate', () => {
    it('generates .aider.conf.yml with read list', async () => {
      const tmp = createTempDir();
      const canonical = createCanonicalDir(tmp);
      const skills = createTestSkills();
      const files = await aiderAdapter.generate(skills, canonical);

      const conf = findFile(files, '.aider.conf.yml');
      expect(conf).toBeDefined();
      expect(conf!.content).toContain('CONVENTIONS.md');
      expect(conf!.content).toContain('PROJECT_STATE.md');
    });

    it('generates CONVENTIONS.md', async () => {
      const tmp = createTempDir();
      const canonical = createCanonicalDir(tmp);
      const skills = createTestSkills();
      const files = await aiderAdapter.generate(skills, canonical);

      const conv = findFile(files, 'CONVENTIONS.md');
      expect(conv).toBeDefined();
      expect(conv!.content).toContain('# Conventions');
    });
  });
});
