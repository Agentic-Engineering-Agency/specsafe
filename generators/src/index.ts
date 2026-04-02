#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf-8'));

const program = new Command();

program
  .name('specsafe')
  .description('SpecSafe — Skills-first TDD framework for AI-assisted development')
  .version(pkg.version);

program
  .command('init')
  .description('Initialize a new SpecSafe project')
  .argument('[name]', 'Project name (defaults to directory name)')
  .action(async (name?: string) => {
    const { init } = await import('./init.js');
    await init(name, { interactive: true });
  });

program
  .command('install')
  .description('Install SpecSafe skills for a specific AI tool')
  .argument('<tool>', 'Tool name (claude-code, opencode, cursor, continue, aider, zed, gemini, antigravity)')
  .action(async (tool: string) => {
    const { install } = await import('./install.js');
    await install(tool);
  });

program
  .command('update')
  .description('Regenerate all tool files from canonical skills')
  .action(async () => {
    const { update } = await import('./update.js');
    await update();
  });

program
  .command('doctor')
  .description('Validate SpecSafe project health')
  .action(async () => {
    const { doctor } = await import('./doctor.js');
    await doctor();
  });

program.parse();
