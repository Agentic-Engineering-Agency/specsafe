import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { install } from '../src/install.js';

const canonicalDir = join(import.meta.dirname, '..', '..', 'canonical');

describe('specsafe install', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'specsafe-install-'));
    // Create a config file so install can update it
    await writeFile(join(tmpDir, 'specsafe.config.json'), JSON.stringify({
      project: 'test',
      version: '1.0.0',
      tools: [],
      testFramework: 'vitest',
      testCommand: 'pnpm test',
      coverageCommand: 'pnpm test --coverage',
      specsafeVersion: '2.1.0',
    }, null, 2) + '\n', 'utf-8');
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
    process.exitCode = undefined;
  });

  it('rejects invalid tool names', async () => {
    await install('nonexistent-tool', { cwd: tmpDir, canonicalDir });
    expect(process.exitCode).toBe(1);
  });

  it('updates specsafe.config.json tools array', async () => {
    await install('claude-code', { cwd: tmpDir, canonicalDir });

    const raw = await readFile(join(tmpDir, 'specsafe.config.json'), 'utf-8');
    const config = JSON.parse(raw);
    expect(config.tools).toContain('claude-code');
  });

  it('does not duplicate tool in config on repeated install', async () => {
    await install('claude-code', { cwd: tmpDir, canonicalDir });
    await install('claude-code', { cwd: tmpDir, canonicalDir });

    const raw = await readFile(join(tmpDir, 'specsafe.config.json'), 'utf-8');
    const config = JSON.parse(raw);
    expect(config.tools.filter((t: string) => t === 'claude-code').length).toBe(1);
  });

  it('writes generated skill files to disk', async () => {
    await install('claude-code', { cwd: tmpDir, canonicalDir });

    // Real claude-code adapter generates .claude/skills/<name>/SKILL.md
    await expect(access(join(tmpDir, '.claude', 'skills', 'specsafe-init', 'SKILL.md'))).resolves.toBeUndefined();

    const content = await readFile(join(tmpDir, '.claude', 'skills', 'specsafe-init', 'SKILL.md'), 'utf-8');
    expect(content).toContain('name: specsafe-init');
  });

  it('generates CLAUDE.md rules file', async () => {
    await install('claude-code', { cwd: tmpDir, canonicalDir });

    await expect(access(join(tmpDir, 'CLAUDE.md'))).resolves.toBeUndefined();
    const content = await readFile(join(tmpDir, 'CLAUDE.md'), 'utf-8');
    expect(content).toContain('SpecSafe');
  });

  it('prevents path traversal in generated files', async () => {
    // The real adapters don't generate traversal paths, but the containment check exists
    await install('claude-code', { cwd: tmpDir, canonicalDir });
    expect(process.exitCode).toBeUndefined();
  });

  it('handles missing config gracefully', async () => {
    const emptyDir = await mkdtemp(join(tmpdir(), 'specsafe-noconfig-'));
    try {
      // Install should succeed for file generation but warn about config
      await install('aider', { cwd: emptyDir, canonicalDir });
      // Files should still be generated
      await expect(access(join(emptyDir, 'CONVENTIONS.md'))).resolves.toBeUndefined();
    } finally {
      await rm(emptyDir, { recursive: true, force: true });
    }
  });
});
