import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as p from '@clack/prompts';
import { TOOL_NAMES } from './adapters/types.js';
import type { SpecSafeConfig } from './adapters/types.js';
import { loadCanonicalSkills } from './adapters/utils.js';
import { getAdapter } from './registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = import.meta.dirname ?? dirname(__filename);

function defaultCanonicalDir(): string {
  return resolve(__dirname, '..', '..', 'canonical');
}

export interface InstallOptions {
  cwd?: string;
  canonicalDir?: string;
}

export async function install(tool: string, opts: InstallOptions = {}): Promise<void> {
  const cwd = opts.cwd ?? process.cwd();
  const canonicalDir = opts.canonicalDir ?? defaultCanonicalDir();

  // Validate tool name
  if (!TOOL_NAMES.includes(tool as any)) {
    console.error(`Unknown tool: "${tool}". Valid tools: ${TOOL_NAMES.join(', ')}`);
    process.exitCode = 1;
    return;
  }

  // Get adapter
  const adapter = getAdapter(tool);
  if (!adapter) {
    console.error(`Adapter for "${tool}" not yet available. Check for updates or install a newer version.`);
    process.exitCode = 1;
    return;
  }

  // Load canonical skills
  const skills = loadCanonicalSkills(canonicalDir);

  // Generate files with spinner
  const s = p.spinner();
  s.start(`Installing ${tool}...`);

  const files = await adapter.generate(skills, canonicalDir, cwd);

  // Write generated files with path containment check
  const resolvedCwd = resolve(cwd);
  for (const file of files) {
    const fullPath = resolve(cwd, file.path);
    if (!fullPath.startsWith(resolvedCwd + '/') && fullPath !== resolvedCwd) {
      console.error(`Security error: path "${file.path}" escapes project directory. Skipping.`);
      continue;
    }
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, file.content, 'utf-8');
  }

  s.stop(`Installed ${tool} — ${files.length} files generated`);

  // Update config
  const configPath = join(cwd, 'specsafe.config.json');
  try {
    const raw = await readFile(configPath, 'utf-8');
    const config: SpecSafeConfig = JSON.parse(raw);
    if (!config.tools.includes(tool)) {
      config.tools.push(tool);
      await writeFile(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`Warning: Could not update specsafe.config.json (${msg}). Run \`specsafe init\` first.`);
  }

  console.log(`Installed ${tool} skills (${files.length} files):`);
  for (const file of files) {
    console.log(`  ${file.path}`);
  }
}
