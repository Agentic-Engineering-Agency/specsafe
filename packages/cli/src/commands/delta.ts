import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { generateDeltaTemplate } from '@specsafe/core';
import { input, confirm } from '@inquirer/prompts';
import { execFileSync } from 'child_process';

export const deltaCommand = new Command('delta')
  .description('Create a new delta spec for an existing spec (brownfield changes)')
  .argument('<spec-id>', 'Base spec ID (e.g., SPEC-20260101-001)')
  .option('-a, --author <author>', 'Author name', 'developer')
  .option('--no-edit', 'Create without opening in editor')
  .action(async (specId: string, options: { author: string; edit: boolean }) => {
    const spinner = ora('Creating delta spec...').start();

    try {
      // Validate specId to prevent path traversal
      if (!/^[A-Za-z0-9_-]+$/.test(specId)) {
        spinner.fail(chalk.red('Invalid spec ID. Use only alphanumeric characters, hyphens, and underscores.'));
        process.exit(1);
      }

      // Validate base spec exists
      const baseSpecPath = join('specs/active', `${specId}.md`);
      try {
        await readFile(baseSpecPath, 'utf-8');
      } catch {
        spinner.fail(chalk.red(`Base spec not found: ${specId}`));
        console.log(chalk.gray('💡 Tip: Check that the spec exists in specs/active/'));
        process.exit(1);
      }

      // Generate delta spec ID
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const deltaId = `DELTA-${specId}-${date}`;

      // Create deltas directory if needed
      await mkdir('specs/deltas', { recursive: true });

      const deltaPath = join('specs/deltas', `${deltaId}.md`);

      // Check if delta already exists
      try {
        await readFile(deltaPath, 'utf-8');
        spinner.stop();
        const overwrite = await confirm({
          message: `Delta spec ${deltaId} already exists. Overwrite?`,
          default: false
        });
        if (!overwrite) {
          spinner.stop();
          console.log(chalk.yellow('Delta creation cancelled.'));
          process.exit(0);
        }
      } catch {
        // File doesn't exist, proceed
      }

      // Generate template
      const template = generateDeltaTemplate(deltaId, specId, options.author);
      await writeFile(deltaPath, template);

      spinner.succeed(chalk.green(`Created delta spec: ${deltaId}`));
      console.log(chalk.blue(`  Location: ${deltaPath}`));
      console.log(chalk.gray('\n  Next steps:'));
      console.log(chalk.gray(`    1. Edit ${deltaPath} to describe changes`));
      console.log(chalk.gray(`    2. Run: specsafe diff ${specId}`));
      console.log(chalk.gray(`    3. Run: specsafe apply ${specId}`));

      // Open in editor if requested
      if (options.edit) {
        spinner.start('Opening in editor...');
        try {
          const editor = process.env.EDITOR || 'nano';
          execFileSync(editor, [deltaPath], { stdio: 'inherit' });
          spinner.stop();
        } catch (err) {
          spinner.warn(chalk.yellow('Could not open editor. Edit the file manually.'));
        }
      }
    } catch (error: any) {
      spinner.fail(chalk.red(`Failed to create delta spec: ${error.message}`));
      process.exit(1);
    }
  });
