#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { statusCommand } from './commands/status.js';
import { specCommand } from './commands/spec.js';
import { testCommand } from './commands/test.js';
import { devCommand } from './commands/dev.js';
import { qaCommand } from './commands/qa.js';
import { completeCommand, completeListCommand } from './commands/complete.js';
import {
  archiveCommand,
  archiveListCommand,
  archiveRestoreCommand,
} from './commands/archive.js';
import { trackCommand } from './commands/track.js';

const program = new Command();

program
  .name('specsafe')
  .description(
    'Test-Driven Development (TDD) framework for AI-assisted software engineering'
  )
  .version('0.1.0')
  .helpOption('-h, --help');

// Project initialization
program.addCommand(initCommand);

// Status
program.addCommand(statusCommand);

// Spec management
program.addCommand(specCommand);

// Test management
program.addCommand(testCommand);

// Development mode
program.addCommand(devCommand);

// QA validation
program.addCommand(qaCommand);

// Complete workflow
program.addCommand(completeCommand);
program.addCommand(completeListCommand);

// Archive
program.addCommand(archiveCommand);
program.addCommand(archiveListCommand);
program.addCommand(archiveRestoreCommand);

// Tracking
program.addCommand(trackCommand);

program.parse();
