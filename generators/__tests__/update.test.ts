import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { update } from '../src/update.js';

const canonicalDir = join(import.meta.dirname, '..', '..', 'canonical');

describe('specsafe update', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'specsafe-update-'));
    process.exitCode = undefined;
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
    process.exitCode = undefined;
  });

  it('processes all tools from config', async () => {
    await writeFile(join(tmpDir, 'specsafe.config.json'), JSON.stringify({
      project: 'test',
      version: '1.0.0',
      tools: ['aider'],
      testFramework: 'vitest',
      testCommand: 'pnpm test',
      coverageCommand: 'pnpm test --coverage',
      specsafeVersion: '2.2.0',
    }, null, 2) + '\n', 'utf-8');

    await update({ cwd: tmpDir, canonicalDir });

    // Verify aider files were generated
    await expect(access(join(tmpDir, 'CONVENTIONS.md'))).resolves.toBeUndefined();
    const content = await readFile(join(tmpDir, 'CONVENTIONS.md'), 'utf-8');
    expect(content).toContain('SpecSafe');
  });

  it('errors when no config exists', async () => {
    await update({ cwd: tmpDir, canonicalDir });
    expect(process.exitCode).toBe(1);
  });

  it('handles empty tools array gracefully', async () => {
    await writeFile(join(tmpDir, 'specsafe.config.json'), JSON.stringify({
      project: 'test',
      version: '1.0.0',
      tools: [],
      specsafeVersion: '2.2.0',
    }), 'utf-8');

    await update({ cwd: tmpDir, canonicalDir });
    // Should not error
    expect(process.exitCode).toBeUndefined();
  });

  it('regenerates files for multiple tools', async () => {
    await writeFile(join(tmpDir, 'specsafe.config.json'), JSON.stringify({
      project: 'test',
      version: '1.0.0',
      tools: ['claude-code', 'aider'],
      specsafeVersion: '2.2.0',
    }), 'utf-8');

    await update({ cwd: tmpDir, canonicalDir });

    // Both tools generated
    await expect(access(join(tmpDir, '.claude', 'skills', 'specsafe-init', 'SKILL.md'))).resolves.toBeUndefined();
    await expect(access(join(tmpDir, 'CONVENTIONS.md'))).resolves.toBeUndefined();
  });

  it('errors on invalid config (missing tools array)', async () => {
    await writeFile(join(tmpDir, 'specsafe.config.json'), JSON.stringify({
      project: 'test',
      version: '1.0.0',
    }), 'utf-8');

    await update({ cwd: tmpDir, canonicalDir });
    expect(process.exitCode).toBe(1);
  });
});
