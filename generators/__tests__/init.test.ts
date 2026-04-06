import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, readdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { init } from '../src/init.js';

const canonicalDir = join(import.meta.dirname, '..', '..', 'canonical');

describe('specsafe init', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'specsafe-init-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('creates all expected directories and files', async () => {
    await init('test-project', { cwd: tmpDir, canonicalDir });

    // Check directories
    const activeStat = await readdir(join(tmpDir, 'specs', 'active'));
    expect(activeStat).toBeDefined();
    const completedStat = await readdir(join(tmpDir, 'specs', 'completed'));
    expect(completedStat).toBeDefined();
    const archiveStat = await readdir(join(tmpDir, 'specs', 'archive'));
    expect(archiveStat).toBeDefined();

    // Check files exist
    await expect(access(join(tmpDir, 'specsafe.config.json'))).resolves.toBeUndefined();
    await expect(access(join(tmpDir, 'PROJECT_STATE.md'))).resolves.toBeUndefined();
    await expect(access(join(tmpDir, 'specs', 'template.md'))).resolves.toBeUndefined();
  });

  it('replaces template placeholders correctly', async () => {
    await init('my-awesome-project', { cwd: tmpDir, canonicalDir });

    const config = await readFile(join(tmpDir, 'specsafe.config.json'), 'utf-8');
    expect(config).toContain('"my-awesome-project"');
    expect(config).not.toContain('{{project-name}}');

    const state = await readFile(join(tmpDir, 'PROJECT_STATE.md'), 'utf-8');
    expect(state).toContain('my-awesome-project');
    expect(state).not.toContain('{{project-name}}');
    expect(state).not.toContain('{{version}}');
    expect(state).not.toContain('{{timestamp}}');
  });

  it('aborts if specsafe.config.json already exists', async () => {
    // First init
    await init('test-project', { cwd: tmpDir, canonicalDir });

    const configBefore = await readFile(join(tmpDir, 'specsafe.config.json'), 'utf-8');

    // Second init should not overwrite
    await init('other-name', { cwd: tmpDir, canonicalDir });

    const configAfter = await readFile(join(tmpDir, 'specsafe.config.json'), 'utf-8');
    expect(configAfter).toBe(configBefore);
    expect(configAfter).toContain('test-project');
  });

  it('produces valid JSON in specsafe.config.json', async () => {
    await init('json-test', { cwd: tmpDir, canonicalDir });

    const raw = await readFile(join(tmpDir, 'specsafe.config.json'), 'utf-8');
    const config = JSON.parse(raw);
    expect(config.project).toBe('json-test');
    expect(config.version).toBe('1.0.0');
    expect(config.tools).toEqual([]);
    expect(config.specsafeVersion).toBe('2.2.3');
  });

  it('uses directory basename when no name is provided', async () => {
    await init(undefined, { cwd: tmpDir, canonicalDir });

    const raw = await readFile(join(tmpDir, 'specsafe.config.json'), 'utf-8');
    const config = JSON.parse(raw);
    // tmpDir basename is something like "specsafe-init-XXXXXX"
    expect(config.project).toBeTruthy();
    expect(config.project).not.toContain('{{');
  });
});
