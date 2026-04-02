import { describe, it, expect } from 'vitest';
import { zedAdapter } from '../../src/adapters/zed.js';
import { createTempDir, setupDetectDir, createTestSkills, findFile, createCanonicalDir } from './helpers.js';

describe('zed adapter', () => {
  describe('detect', () => {
    it('returns true when .zed/ exists', async () => {
      const tmp = createTempDir();
      setupDetectDir(tmp, ['.zed']);
      expect(await zedAdapter.detect(tmp)).toBe(true);
    });

    it('returns false when .zed/ is missing', async () => {
      const tmp = createTempDir();
      expect(await zedAdapter.detect(tmp)).toBe(false);
    });
  });

  describe('generate', () => {
    it('generates .rules file', async () => {
      const tmp = createTempDir();
      const canonical = createCanonicalDir(tmp);
      const skills = createTestSkills();
      const files = await zedAdapter.generate(skills, canonical);

      const rules = findFile(files, '.rules');
      expect(rules).toBeDefined();
      expect(rules!.content).toContain('# Zed Rules');
    });

    it('generates .zed/settings.json with valid JSON', async () => {
      const tmp = createTempDir();
      const canonical = createCanonicalDir(tmp);
      const skills = createTestSkills();
      const files = await zedAdapter.generate(skills, canonical);

      const settings = findFile(files, '.zed/settings.json');
      expect(settings).toBeDefined();
      const parsed = JSON.parse(settings!.content);
      expect(parsed.assistant).toBeDefined();
      expect(parsed.assistant.default_model.provider).toBe('anthropic');
    });
  });
});
