import { describe, it, expect, afterEach } from 'vitest';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { aiderAdapter } from '../../src/adapters/aider.js';
import { createTempDir, setupDetectDir, createTestSkills, findFile, createCanonicalDir, cleanupTempDirs } from './helpers.js';

describe('aider adapter', () => {
  afterEach(cleanupTempDirs);
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

    it('produces default read entries with no existing .aider.conf.yml', async () => {
      const tmp = createTempDir();
      const canonical = createCanonicalDir(tmp);
      const skills = createTestSkills();
      const files = await aiderAdapter.generate(skills, canonical, tmp);

      const conf = findFile(files, '.aider.conf.yml');
      expect(conf).toBeDefined();
      expect(conf!.content).toContain('CONVENTIONS.md');
      expect(conf!.content).toContain('PROJECT_STATE.md');
    });

    it('preserves user read entries and other config keys from existing file', async () => {
      const tmp = createTempDir();
      writeFileSync(
        join(tmp, '.aider.conf.yml'),
        [
          'read:',
          '  - MY_CUSTOM_FILE.md',
          '  - CONVENTIONS.md',
          'model: claude-sonnet-4-20250514',
          'auto-commits: false',
        ].join('\n'),
      );
      const canonical = createCanonicalDir(tmp);
      const skills = createTestSkills();
      const files = await aiderAdapter.generate(skills, canonical, tmp);

      const conf = findFile(files, '.aider.conf.yml');
      expect(conf).toBeDefined();
      // Specsafe defaults present
      expect(conf!.content).toContain('CONVENTIONS.md');
      expect(conf!.content).toContain('PROJECT_STATE.md');
      // User's custom read entry preserved
      expect(conf!.content).toContain('MY_CUSTOM_FILE.md');
      // Other config keys preserved
      expect(conf!.content).toContain('model: claude-sonnet-4-20250514');
      expect(conf!.content).toContain('auto-commits: false');
    });

    it('deduplicates read entries', async () => {
      const tmp = createTempDir();
      writeFileSync(
        join(tmp, '.aider.conf.yml'),
        ['read:', '  - CONVENTIONS.md', '  - PROJECT_STATE.md', '  - CONVENTIONS.md'].join('\n'),
      );
      const canonical = createCanonicalDir(tmp);
      const skills = createTestSkills();
      const files = await aiderAdapter.generate(skills, canonical, tmp);

      const conf = findFile(files, '.aider.conf.yml');
      expect(conf).toBeDefined();
      // Count occurrences of CONVENTIONS.md in read entries
      const matches = conf!.content.match(/CONVENTIONS\.md/g);
      expect(matches).toHaveLength(1);
    });
  });
});
