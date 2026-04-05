import { access, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import c from 'ansis';
import Table from 'cli-table3';
import type { SpecSafeConfig } from './adapters/types.js';
import { getAdapter } from './registry.js';

export interface DoctorOptions {
  cwd?: string;
}

interface Check {
  label: string;
  status: 'OK' | 'WARNING' | 'ERROR';
  message?: string;
}

export async function doctor(opts: DoctorOptions = {}): Promise<Check[]> {
  const cwd = opts.cwd ?? process.cwd();
  const checks: Check[] = [];

  // Check specsafe.config.json
  let config: SpecSafeConfig | null = null;
  const configPath = join(cwd, 'specsafe.config.json');
  try {
    const raw = await readFile(configPath, 'utf-8');
    config = JSON.parse(raw);
    // Validate required keys
    const requiredKeys = ['project', 'version', 'tools', 'specsafeVersion'];
    const missing = requiredKeys.filter((k) => !(k in (config as SpecSafeConfig)));
    if (missing.length > 0) {
      checks.push({
        label: 'specsafe.config.json',
        status: 'ERROR',
        message: `Missing keys: ${missing.join(', ')}`,
      });
    } else {
      checks.push({ label: 'specsafe.config.json', status: 'OK' });
    }
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
      checks.push({ label: 'specsafe.config.json', status: 'ERROR', message: 'File not found' });
    } else {
      checks.push({ label: 'specsafe.config.json', status: 'ERROR', message: 'Invalid JSON' });
    }
  }

  // Check PROJECT_STATE.md
  if (await fileExists(join(cwd, 'PROJECT_STATE.md'))) {
    checks.push({ label: 'PROJECT_STATE.md', status: 'OK' });
  } else {
    checks.push({ label: 'PROJECT_STATE.md', status: 'ERROR', message: 'File not found' });
  }

  // Check directory structure
  const specDirs = ['specs/active', 'specs/completed', 'specs/archive'];
  for (const dir of specDirs) {
    if (await dirExists(join(cwd, dir))) {
      checks.push({ label: dir, status: 'OK' });
    } else {
      checks.push({ label: dir, status: 'WARNING', message: 'Directory missing' });
    }
  }

  // Check installed tools
  if (config?.tools) {
    for (const tool of config.tools) {
      const adapter = getAdapter(tool);
      if (adapter) {
        const detected = await adapter.detect(cwd);
        checks.push({
          label: `tool: ${tool}`,
          status: detected ? 'OK' : 'WARNING',
          message: detected ? undefined : 'Tool files not detected',
        });
      } else {
        checks.push({ label: `tool: ${tool}`, status: 'WARNING', message: 'Adapter not loaded' });
      }
    }
  }

  // Print formatted report
  const table = new Table({
    head: [c.bold('Status'), c.bold('Check'), c.bold('Detail')],
    style: { head: [], border: [] },
  });

  for (const check of checks) {
    let statusLabel: string;
    let detail = check.message ?? '';
    if (check.status === 'OK') {
      statusLabel = c.green('\u2713 OK');
      if (!detail) detail = c.green('Valid');
    } else if (check.status === 'WARNING') {
      statusLabel = c.yellow('\u26A0 WARN');
      detail = c.yellow(detail);
    } else {
      statusLabel = c.red('\u2717 ERR');
      detail = c.red(detail);
    }
    table.push([statusLabel, check.label, detail]);
  }

  console.log(table.toString());

  const errorCount = checks.filter((ch) => ch.status === 'ERROR').length;
  const warnCount = checks.filter((ch) => ch.status === 'WARNING').length;

  if (errorCount > 0) {
    console.log(
      c.red(
        `\n${errorCount} error(s)${warnCount > 0 ? `, ${warnCount} warning(s)` : ''} found. Run \`specsafe init\` to fix.`,
      ),
    );
    process.exitCode = 1;
  } else if (warnCount > 0) {
    console.log(c.yellow(`\n${warnCount} warning(s), but project looks healthy.`));
  } else {
    console.log(c.green('\nProject looks healthy!'));
  }

  return checks;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function dirExists(path: string): Promise<boolean> {
  try {
    await readdir(path);
    return true;
  } catch {
    return false;
  }
}
