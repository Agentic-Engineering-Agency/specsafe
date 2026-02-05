#!/usr/bin/env node

/**
 * SpecSafe CLI
 * Command-line interface for the SpecSafe TDD framework
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { newCommand } from './commands/new.js';
import { statusCommand } from './commands/status.js';
import { specCommand } from './commands/spec.js';
import { testCommand } from './commands/test.js';
import { codeCommand } from './commands/code.js';
import { qaCommand } from './commands/qa.js';
import { completeCommand } from './commands/complete.js';

const program = new Command();

program
  .name('specsafe')
  .description('SpecSafe - Test-Driven Development framework for AI-assisted software engineering')
  .version('0.1.0');

// Add commands
program.addCommand(initCommand);
program.addCommand(newCommand);
program.addCommand(statusCommand);
program.addCommand(specCommand);
program.addCommand(testCommand);
program.addCommand(codeCommand);
program.addCommand(qaCommand);
program.addCommand(completeCommand);

// Global error handling
program.exitOverride();

(async () => {
  try {
    await program.parseAsync();
  } catch (error: any) {
    if (error.code !== 'commander.help' && error.code !== 'commander.version') {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  }
})();