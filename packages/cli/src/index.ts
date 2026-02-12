#!/usr/bin/env node

/**
 * SpecSafe CLI
 * Command-line interface for the SpecSafe TDD framework
 * Version 0.4.0 - OpenSpec-style workflow
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
import { doneCommand } from './commands/done.js';
import { completeCommand } from './commands/complete.js';
import { listCommand } from './commands/list.js';
import { archiveCommand } from './commands/archive.js';
import { doctorCommand } from './commands/doctor.js';
import { rulesCommand } from './commands/rules.js';
import { verifyCommand } from './commands/verify.js';
import { exploreCommand } from './commands/explore.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const packageJson = require('../package.json');

const program = new Command();

program
  .name('specsafe')
  .description('SpecSafe - Test-Driven Development framework for AI-assisted software engineering')
  .version(packageJson.version)
  .option('-v, --verbose', 'Enable verbose output');

// Add commands
program.addCommand(initCommand);
program.addCommand(newCommand);
program.addCommand(statusCommand);
program.addCommand(listCommand);
program.addCommand(exploreCommand);     // NEW: Pre-spec exploration
program.addCommand(specCommand);
program.addCommand(testCommand);
program.addCommand(codeCommand);
program.addCommand(qaCommand);
program.addCommand(verifyCommand);      // NEW: Test runner with loop
program.addCommand(doneCommand);        // NEW: Complete + archive
program.addCommand(completeCommand);    // DEPRECATED: Use 'done' instead
program.addCommand(archiveCommand);
program.addCommand(doctorCommand);
program.addCommand(rulesCommand);

// Workflow command group
program
  .command('workflow')
  .description('Show the SpecSafe workflow diagram')
  .action(() => {
    console.log(chalk.blue('\n┌─────────────────────────────────────────────────────────────┐'));
    console.log(chalk.blue('│                    SpecSafe Workflow                        │'));
    console.log(chalk.blue('│                       v0.4.0 - OpenSpec                    │'));
    console.log(chalk.blue('└─────────────────────────────────────────────────────────────┘\n'));
    
    console.log(chalk.white('Pre-Spec:'));
    console.log(chalk.gray('  specsafe explore          → Think through ideas before committing\n'));
    
    console.log(chalk.white('Development Cycle:'));
    console.log(chalk.cyan('  specsafe new [feature]    → Create spec with PRD'));
    console.log(chalk.gray('       ↓'));
    console.log(chalk.cyan('  specsafe spec <id>        → Refine requirements from PRD'));
    console.log(chalk.gray('       ↓'));
    console.log(chalk.cyan('  specsafe test <id>        → Generate tests from scenarios'));
    console.log(chalk.gray('       ↓'));
    console.log(chalk.cyan('  specsafe code <id>        → Start implementation'));
    console.log(chalk.gray('       ↓'));
    console.log(chalk.cyan('  specsafe verify <id>      → Run tests, loop if fail (KEY!)'));
    console.log(chalk.gray('       ↓ (if tests pass)'));
    console.log(chalk.cyan('  specsafe qa <id>          → QA validation'));
    console.log(chalk.gray('       ↓'));
    console.log(chalk.cyan('  specsafe done <id>        → Complete & archive'));
    console.log();
    
    console.log(chalk.white('Utility Commands:'));
    console.log(chalk.gray('  specsafe status           → View project status'));
    console.log(chalk.gray('  specsafe list             → List all specs'));
    console.log(chalk.gray('  specsafe doctor           → Check project health'));
    console.log();
    
    console.log(chalk.yellow('💡 The verify command is the key differentiator:'));
    console.log(chalk.yellow('   It runs tests and provides feedback for the dev loop.\n'));
  });

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
