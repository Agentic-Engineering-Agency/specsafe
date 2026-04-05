import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, readdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { init } from '../src/init.js';
import { install } from '../src/install.js';
import { doctor } from '../src/doctor.js';

const canonicalDir = join(import.meta.dirname, '..', '..', 'canonical');

describe('E2E: full CLI workflow', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'specsafe-e2e-'));
    process.exitCode = undefined;
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
    process.exitCode = undefined;
  });

  it('full init → install → doctor cycle', async () => {
    await init('e2e-project', { cwd: tmpDir, canonicalDir });
    await install('claude-code', { cwd: tmpDir, canonicalDir });

    const checks = await doctor({ cwd: tmpDir });

    const statuses = checks.map(c => c.status);
    expect(statuses).not.toContain('ERROR');
  });

  it('init creates correct structure', async () => {
    await init('structure-test', { cwd: tmpDir, canonicalDir });

    // Directories
    await expect(readdir(join(tmpDir, 'specs', 'active'))).resolves.toBeDefined();
    await expect(readdir(join(tmpDir, 'specs', 'completed'))).resolves.toBeDefined();
    await expect(readdir(join(tmpDir, 'specs', 'archive'))).resolves.toBeDefined();

    // Files
    await expect(access(join(tmpDir, 'specsafe.config.json'))).resolves.toBeUndefined();
    await expect(access(join(tmpDir, 'PROJECT_STATE.md'))).resolves.toBeUndefined();
    await expect(access(join(tmpDir, 'specs', 'template.md'))).resolves.toBeUndefined();

    // Config content
    const raw = await readFile(join(tmpDir, 'specsafe.config.json'), 'utf-8');
    const config = JSON.parse(raw);
    expect(config.project).toBe('structure-test');
    expect(config.version).toBe('1.0.0');
    expect(config.tools).toEqual([]);
    expect(config.specsafeVersion).toBe('2.1.0');
  });

  describe('install generates correct files for each tier', () => {
    beforeEach(async () => {
      await init('tier-test', { cwd: tmpDir, canonicalDir });
    });

    it('tier 1 (claude-code): .claude/skills and CLAUDE.md', async () => {
      await install('claude-code', { cwd: tmpDir, canonicalDir });

      // Skills directory with SKILL.md files
      await expect(access(join(tmpDir, '.claude', 'skills', 'specsafe-init', 'SKILL.md'))).resolves.toBeUndefined();
      // CLAUDE.md rules file
      await expect(access(join(tmpDir, 'CLAUDE.md'))).resolves.toBeUndefined();

      const claudeMd = await readFile(join(tmpDir, 'CLAUDE.md'), 'utf-8');
      expect(claudeMd.length).toBeGreaterThan(0);
    });

    it('tier 2 (aider): .aider.conf.yml and CONVENTIONS.md', async () => {
      await install('aider', { cwd: tmpDir, canonicalDir });

      await expect(access(join(tmpDir, '.aider.conf.yml'))).resolves.toBeUndefined();
      await expect(access(join(tmpDir, 'CONVENTIONS.md'))).resolves.toBeUndefined();

      const conf = await readFile(join(tmpDir, '.aider.conf.yml'), 'utf-8');
      expect(conf).toContain('CONVENTIONS.md');
    });

    it('tier 3 (continue): .continue/prompts/*.md', async () => {
      await install('continue', { cwd: tmpDir, canonicalDir });

      await expect(access(join(tmpDir, '.continue', 'prompts', 'specsafe-init.md'))).resolves.toBeUndefined();

      const prompt = await readFile(join(tmpDir, '.continue', 'prompts', 'specsafe-init.md'), 'utf-8');
      expect(prompt).toContain('---');
      expect(prompt.length).toBeGreaterThan(50);
    });
  });

  it('install multiple tools', async () => {
    await init('multi-tool', { cwd: tmpDir, canonicalDir });

    await install('claude-code', { cwd: tmpDir, canonicalDir });
    await install('opencode', { cwd: tmpDir, canonicalDir });

    // Both tool dirs exist
    await expect(access(join(tmpDir, '.claude', 'skills', 'specsafe-init', 'SKILL.md'))).resolves.toBeUndefined();
    await expect(access(join(tmpDir, '.opencode', 'skills', 'specsafe-init', 'SKILL.md'))).resolves.toBeUndefined();

    // Config has both tools
    const raw = await readFile(join(tmpDir, 'specsafe.config.json'), 'utf-8');
    const config = JSON.parse(raw);
    expect(config.tools).toContain('claude-code');
    expect(config.tools).toContain('opencode');
  });

  it('doctor after full setup reports no errors', async () => {
    await init('healthy', { cwd: tmpDir, canonicalDir });
    await install('claude-code', { cwd: tmpDir, canonicalDir });

    const checks = await doctor({ cwd: tmpDir });

    for (const check of checks) {
      expect(check.status).not.toBe('ERROR');
    }
    expect(checks.length).toBeGreaterThan(0);
  });

  it('generated SKILL.md files have valid frontmatter and content', async () => {
    await init('skill-check', { cwd: tmpDir, canonicalDir });
    await install('claude-code', { cwd: tmpDir, canonicalDir });

    const skillDirs = await readdir(join(tmpDir, '.claude', 'skills'));
    expect(skillDirs.length).toBe(21); // All 21 canonical skills

    for (const dir of skillDirs) {
      const skillPath = join(tmpDir, '.claude', 'skills', dir, 'SKILL.md');
      const content = await readFile(skillPath, 'utf-8');

      // Frontmatter present
      expect(content).toMatch(/^---\n/);
      expect(content).toContain('name:');
      expect(content).toContain('description:');

      // Content non-empty (body after frontmatter)
      const bodyMatch = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
      expect(bodyMatch).toBeTruthy();
      expect(bodyMatch![1].trim().length).toBeGreaterThan(0);
    }
  });
});
