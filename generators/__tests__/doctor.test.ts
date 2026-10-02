import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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
    process.exitCode = undefined;
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
    process.exitCode = undefined;
    vi.restoreAllMocks();
  });

  it.each([
    { name: 'healthy', warnings: 0, errors: 0, exitCode: 0 },
    { name: 'warnings', warnings: 1, errors: 0, exitCode: 1 },
    { name: 'errors override warnings', warnings: 1, errors: 1, exitCode: 2 },
  ])('prints only JSON for $name with exit code $exitCode', async ({ warnings, errors, exitCode }) => {
    await init('json-project', { cwd: tmpDir, canonicalDir });
    if (warnings) await rm(join(tmpDir, 'specs', 'archive'), { recursive: true });
    if (errors) await rm(join(tmpDir, 'specsafe.config.json'));
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    const humanChecks = await doctor({ cwd: tmpDir });
    expect(log.mock.calls).toMatchSnapshot();
    expect(log.mock.calls[1][0]).toContain(errors
      ? '1 error(s), 1 warning(s) found. Run `specsafe init` to fix.'
      : warnings ? '1 warning(s), but project looks healthy.' : 'Project looks healthy!');
    expect(process.exitCode).toBe(errors ? 1 : undefined);
    log.mockClear();

    const checks = await doctor({ cwd: tmpDir, json: true });

    expect(checks).toEqual(humanChecks);
    expect(log).toHaveBeenCalledTimes(1);
    expect(JSON.parse(log.mock.calls[0][0])).toEqual({
      schemaVersion: 1,
      checks: humanChecks,
      summary: { errors, warnings },
      exitCode,
    });
    expect(checks).toEqual([
      { label: 'specsafe.config.json', status: errors ? 'ERROR' : 'OK',
        ...(errors ? { message: 'File not found' } : {}) },
      { label: 'PROJECT_STATE.md', status: 'OK' },
      { label: 'specs/active', status: 'OK' },
      { label: 'specs/completed', status: 'OK' },
      { label: 'specs/archive', status: warnings ? 'WARNING' : 'OK',
        ...(warnings ? { message: 'Directory missing' } : {}) },
    ]);
    expect(process.exitCode).toBe(exitCode);
  });

  it('reports malformed config as JSON with exit code 2', async () => {
    await writeFile(join(tmpDir, 'specsafe.config.json'), 'not json{{{');
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    await doctor({ cwd: tmpDir, json: true });

    const report = JSON.parse(log.mock.calls[0][0]);
    expect(report.checks[0]).toEqual({
      label: 'specsafe.config.json', status: 'ERROR', message: 'Invalid JSON',
    });
    expect(report.summary).toEqual({ errors: 2, warnings: 3 });
    expect(report.exitCode).toBe(2);
    expect(process.exitCode).toBe(2);
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
      specsafeVersion: '2.2.3',
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
      specsafeVersion: '2.2.3',
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
