import { describe, it, expect, afterEach } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { zedAdapter } from '../../src/adapters/zed.js';
import { createTempDir, setupDetectDir, createTestSkills, findFile, createCanonicalDir, cleanupTempDirs } from './helpers.js';

describe('zed adapter', () => {
  afterEach(cleanupTempDirs);
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

    it('produces correct output with no existing settings.json', async () => {
      const tmp = createTempDir();
      mkdirSync(join(tmp, '.zed'), { recursive: true });
      const canonical = createCanonicalDir(tmp);
      const skills = createTestSkills();
      const files = await zedAdapter.generate(skills, canonical, tmp);

      const settings = findFile(files, '.zed/settings.json');
      expect(settings).toBeDefined();
      const parsed = JSON.parse(settings!.content);
      expect(parsed.assistant.default_model.provider).toBe('anthropic');
      expect(parsed.assistant.version).toBe('2');
    });

    it('merges with existing settings.json preserving user keys', async () => {
      const tmp = createTempDir();
      const zedDir = join(tmp, '.zed');
      mkdirSync(zedDir, { recursive: true });
      writeFileSync(
        join(zedDir, 'settings.json'),
        JSON.stringify({
          theme: 'One Dark',
          assistant: {
            version: '1',
            custom_key: 'preserved',
          },
          tab_size: 4,
        }),
      );
      const canonical = createCanonicalDir(tmp);
      const skills = createTestSkills();
      const files = await zedAdapter.generate(skills, canonical, tmp);

      const settings = findFile(files, '.zed/settings.json');
      expect(settings).toBeDefined();
      const parsed = JSON.parse(settings!.content);
      // User keys preserved
      expect(parsed.theme).toBe('One Dark');
      expect(parsed.tab_size).toBe(4);
      // Nested assistant keys merged — specsafe values override
      expect(parsed.assistant.default_model.provider).toBe('anthropic');
      expect(parsed.assistant.version).toBe('2');
      // User's custom assistant key preserved
      expect(parsed.assistant.custom_key).toBe('preserved');
    });

    it('falls back to overwrite when existing JSON is invalid', async () => {
      const tmp = createTempDir();
      const zedDir = join(tmp, '.zed');
      mkdirSync(zedDir, { recursive: true });
      writeFileSync(join(zedDir, 'settings.json'), '{invalid json!!!');
      const canonical = createCanonicalDir(tmp);
      const skills = createTestSkills();
      const files = await zedAdapter.generate(skills, canonical, tmp);

      const settings = findFile(files, '.zed/settings.json');
      expect(settings).toBeDefined();
      const parsed = JSON.parse(settings!.content);
      expect(parsed.assistant.default_model.provider).toBe('anthropic');
    });
  });
});
