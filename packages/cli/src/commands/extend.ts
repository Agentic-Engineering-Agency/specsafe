/**
 * Extension management commands
 */

import { Command } from 'commander';
import chalk from 'chalk';
import {
  listExtensions,
  listEnabledExtensions,
  enableExtension,
  disableExtension,
  getExtension,
  loadBuiltinExtensions,
} from '@specsafe/core';

export const extendCommand = new Command('extend')
  .description('Manage SpecSafe extensions')
  .addCommand(
    new Command('list')
      .description('List all available extensions')
      .option('-e, --enabled-only', 'Show only enabled extensions')
      .action(async (options) => {
        try {
          // Load builtins first
          await loadBuiltinExtensions();

          const extensions = options.enabledOnly 
            ? listEnabledExtensions()
            : listExtensions();

          if (extensions.length === 0) {
            console.log(chalk.yellow('No extensions found.'));
            return;
          }

          console.log(chalk.bold('\n📦 Extensions:\n'));

          for (const ext of extensions) {
            const status = ext.enabled === false 
              ? chalk.red('disabled')
              : chalk.green('enabled');

            console.log(chalk.bold(`  ${ext.name}`) + ` (${status})`);
            console.log(chalk.gray(`  ID: ${ext.id}`));
            console.log(chalk.gray(`  Version: ${ext.version}`));
            if (ext.author) {
              console.log(chalk.gray(`  Author: ${ext.author}`));
            }
            console.log(`  ${ext.description}`);

            const hookPhases = Object.keys(ext.hooks);
            if (hookPhases.length > 0) {
              console.log(chalk.cyan(`  Hooks: ${hookPhases.join(', ')}`));
            }

            console.log();
          }

          console.log(chalk.gray(`Total: ${extensions.length} extension(s)\n`));
        } catch (error) {
          console.error(chalk.red('Failed to list extensions:'), error);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('enable')
      .description('Enable an extension')
      .argument('<name>', 'Extension ID or name')
      .action(async (name) => {
        try {
          // Load builtins first
          await loadBuiltinExtensions();

          // Try to find by ID first
          let extension = getExtension(name);

          // If not found, search by name
          if (!extension) {
            const allExtensions = listExtensions();
            extension = allExtensions.find(
              (ext) => ext.name.toLowerCase() === name.toLowerCase()
            );
          }

          if (!extension) {
            console.error(chalk.red(`Extension "${name}" not found.`));
            console.log(chalk.gray('Run "specsafe extend list" to see available extensions.'));
            process.exit(1);
          }

          const success = enableExtension(extension.id);

          if (success) {
            console.log(chalk.green(`✓ Enabled extension: ${extension.name}`));
          } else {
            console.error(chalk.red(`Failed to enable extension: ${extension.name}`));
            process.exit(1);
          }
        } catch (error) {
          console.error(chalk.red('Failed to enable extension:'), error);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('disable')
      .description('Disable an extension')
      .argument('<name>', 'Extension ID or name')
      .action(async (name) => {
        try {
          // Load builtins first
          await loadBuiltinExtensions();

          // Try to find by ID first
          let extension = getExtension(name);

          // If not found, search by name
          if (!extension) {
            const allExtensions = listExtensions();
            extension = allExtensions.find(
              (ext) => ext.name.toLowerCase() === name.toLowerCase()
            );
          }

          if (!extension) {
            console.error(chalk.red(`Extension "${name}" not found.`));
            console.log(chalk.gray('Run "specsafe extend list" to see available extensions.'));
            process.exit(1);
          }

          const success = disableExtension(extension.id);

          if (success) {
            console.log(chalk.green(`✓ Disabled extension: ${extension.name}`));
          } else {
            console.error(chalk.red(`Failed to disable extension: ${extension.name}`));
            process.exit(1);
          }
        } catch (error) {
          console.error(chalk.red('Failed to disable extension:'), error);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('info')
      .description('Show detailed information about an extension')
      .argument('<name>', 'Extension ID or name')
      .action(async (name) => {
        try {
          // Load builtins first
          await loadBuiltinExtensions();

          // Try to find by ID first
          let extension = getExtension(name);

          // If not found, search by name
          if (!extension) {
            const allExtensions = listExtensions();
            extension = allExtensions.find(
              (ext) => ext.name.toLowerCase() === name.toLowerCase()
            );
          }

          if (!extension) {
            console.error(chalk.red(`Extension "${name}" not found.`));
            console.log(chalk.gray('Run "specsafe extend list" to see available extensions.'));
            process.exit(1);
          }

          console.log();
          console.log(chalk.bold(extension.name));
          console.log(chalk.gray('─'.repeat(50)));
          console.log(chalk.gray(`ID: ${extension.id}`));
          console.log(chalk.gray(`Version: ${extension.version}`));
          if (extension.author) {
            console.log(chalk.gray(`Author: ${extension.author}`));
          }

          const status = extension.enabled === false 
            ? chalk.red('disabled')
            : chalk.green('enabled');
          console.log(chalk.gray(`Status: ${status}`));

          console.log();
          console.log(extension.description);
          console.log();

          const hookPhases = Object.keys(extension.hooks);
          if (hookPhases.length > 0) {
            console.log(chalk.bold('Hooks:'));
            for (const phase of hookPhases) {
              console.log(chalk.cyan(`  • ${phase}`));
            }
          }

          if (extension.config && Object.keys(extension.config).length > 0) {
            console.log();
            console.log(chalk.bold('Configuration:'));
            console.log(JSON.stringify(extension.config, null, 2));
          }

          console.log();
        } catch (error) {
          console.error(chalk.red('Failed to get extension info:'), error);
          process.exit(1);
        }
      })
  );
