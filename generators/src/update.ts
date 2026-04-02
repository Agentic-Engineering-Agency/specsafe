import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SpecSafeConfig } from './adapters/types.js';
import { install } from './install.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = import.meta.dirname ?? resolve(__filename, '..');

function defaultCanonicalDir(): string {
  return resolve(__dirname, '..', '..', 'canonical');
}

export interface UpdateOptions {
  cwd?: string;
  canonicalDir?: string;
}

export async function update(opts: UpdateOptions = {}): Promise<void> {
  const cwd = opts.cwd ?? process.cwd();
  const canonicalDir = opts.canonicalDir ?? defaultCanonicalDir();

  const configPath = join(cwd, 'specsafe.config.json');
  let config: SpecSafeConfig;
  try {
    const raw = await readFile(configPath, 'utf-8');
    config = JSON.parse(raw);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Could not read specsafe.config.json (${msg}). Run \`specsafe init\` first.`);
    process.exitCode = 1;
    return;
  }

  if (!Array.isArray(config.tools)) {
    console.error('Invalid config: "tools" must be an array. Run `specsafe doctor` to diagnose.');
    process.exitCode = 1;
    return;
  }

  if (config.tools.length === 0) {
    console.log('No tools configured. Run `specsafe install <tool>` to add one.');
    return;
  }

  console.log(`Updating ${config.tools.length} tool(s)...`);
  for (const tool of config.tools) {
    await install(tool, { cwd, canonicalDir });
  }
  console.log('Update complete.');
}
