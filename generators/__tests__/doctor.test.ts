import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { doctor } from '../src/doctor.js';
import { init } from '../src/init.js';

const canonicalDir = join(import.meta.dirname, '..', '..', 'canonical');

describe('specsafe doctor', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'specsafe-doctor-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('reports OK on a valid project', async () => {
    await init('healthy-project', { cwd: tmpDir, canonicalDir });

    const checks = await doctor({ cwd: tmpDir });

    const statuses = checks.map(c => c.status);
    expect(statuses).not.toContain('ERROR');
    expect(checks.find(c => c.label === 'specsafe.config.json')?.status).toBe('OK');
    expect(checks.find(c => c.label === 'PROJECT_STATE.md')?.status).toBe('OK');
  });

  it('reports ERROR when specsafe.config.json is missing', async () => {
    // Create only PROJECT_STATE.md and dirs
    await mkdir(join(tmpDir, 'specs', 'active'), { recursive: true });
    await mkdir(join(tmpDir, 'specs', 'completed'), { recursive: true });
    await mkdir(join(tmpDir, 'specs', 'archive'), { recursive: true });
    await writeFile(join(tmpDir, 'PROJECT_STATE.md'), '# State', 'utf-8');

    const checks = await doctor({ cwd: tmpDir });

    expect(checks.find(c => c.label === 'specsafe.config.json')?.status).toBe('ERROR');
  });

  it('reports ERROR when PROJECT_STATE.md is missing', async () => {
    await writeFile(join(tmpDir, 'specsafe.config.json'), JSON.stringify({
      project: 'test',
      version: '1.0.0',
      tools: [],
      specsafeVersion: '2.1.0',
    }), 'utf-8');
    await mkdir(join(tmpDir, 'specs', 'active'), { recursive: true });
    await mkdir(join(tmpDir, 'specs', 'completed'), { recursive: true });
    await mkdir(join(tmpDir, 'specs', 'archive'), { recursive: true });

    const checks = await doctor({ cwd: tmpDir });

    expect(checks.find(c => c.label === 'PROJECT_STATE.md')?.status).toBe('ERROR');
  });

  it('reports WARNING when specs directories are missing', async () => {
    await writeFile(join(tmpDir, 'specsafe.config.json'), JSON.stringify({
      project: 'test',
      version: '1.0.0',
      tools: [],
      specsafeVersion: '2.1.0',
    }), 'utf-8');
    await writeFile(join(tmpDir, 'PROJECT_STATE.md'), '# State', 'utf-8');

    const checks = await doctor({ cwd: tmpDir });

    expect(checks.find(c => c.label === 'specs/active')?.status).toBe('WARNING');
    expect(checks.find(c => c.label === 'specs/completed')?.status).toBe('WARNING');
    expect(checks.find(c => c.label === 'specs/archive')?.status).toBe('WARNING');
  });

  it('reports ERROR for invalid JSON in config', async () => {
    await writeFile(join(tmpDir, 'specsafe.config.json'), 'not json{{{', 'utf-8');
    await writeFile(join(tmpDir, 'PROJECT_STATE.md'), '# State', 'utf-8');

    const checks = await doctor({ cwd: tmpDir });

    expect(checks.find(c => c.label === 'specsafe.config.json')?.status).toBe('ERROR');
    expect(checks.find(c => c.label === 'specsafe.config.json')?.message).toBe('Invalid JSON');
  });
});
