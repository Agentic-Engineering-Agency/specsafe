import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { readFile, writeFile, readdir, copyFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { DeltaParser, SemanticMerger } from '@specsafe/core';
import { confirm } from '@inquirer/prompts';

export const applyCommand = new Command('apply')
  .description('Apply pending delta specs to a base spec')
  .argument('<spec-id>', 'Base spec ID (e.g., SPEC-20260101-001)')
  .option('--no-backup', 'Skip creating backup before applying')
  .option('-f, --force', 'Apply even if conflicts exist')
  .action(async (specId: string, options: { backup: boolean; force: boolean }) => {
    const spinner = ora('Loading delta specs...').start();

    try {
      // Load base spec
      const baseSpecPath = join('specs/active', `${specId}.md`);
      let baseContent: string;
      try {
        baseContent = await readFile(baseSpecPath, 'utf-8');
      } catch {
        spinner.fail(chalk.red(`Base spec not found: ${specId}`));
        console.log(chalk.gray('💡 Tip: Check that the spec exists in specs/active/'));
        process.exit(1);
      }

      // Find all delta specs for this base spec
      const deltasDir = 'specs/deltas';
      let deltaFiles: string[] = [];
      try {
        const files = await readdir(deltasDir);
        deltaFiles = files.filter(f => f.startsWith(`DELTA-${specId}-`) && f.endsWith('.md'));
      } catch {
        spinner.fail(chalk.red('No deltas directory found'));
        console.log(chalk.gray('💡 Tip: Create a delta spec first with: specsafe delta <spec-id>'));
        process.exit(1);
      }

      if (deltaFiles.length === 0) {
        spinner.fail(chalk.red(`No delta specs found for ${specId}`));
        console.log(chalk.gray('💡 Tip: Create a delta spec first with: specsafe delta <spec-id>'));
        process.exit(1);
      }

      spinner.text = `Found ${deltaFiles.length} delta spec(s)`;

      // Parse all delta specs
      const parser = new DeltaParser();
      const deltaSpecs = [];
      
      for (const file of deltaFiles) {
        const deltaPath = join(deltasDir, file);
        const deltaContent = await readFile(deltaPath, 'utf-8');
        const deltaId = file.replace('.md', '');
        
        try {
          const deltaSpec = parser.parse(deltaContent, deltaId, specId);
          const validation = parser.validate(deltaSpec);
          
          if (!validation.valid) {
            spinner.warn(chalk.yellow(`Validation errors in ${deltaId}:`));
            for (const error of validation.errors) {
              console.log(chalk.yellow(`  - ${error}`));
            }
            
            if (!options.force) {
              const proceed = await confirm({
                message: 'Continue with other deltas?',
                default: false
              });
              if (!proceed) {
                process.exit(1);
              }
              spinner.start('Continuing with other deltas...');
              continue;
            }
            spinner.start('Continuing...');
          }
          
          deltaSpecs.push(deltaSpec);
        } catch (err: any) {
          spinner.warn(chalk.yellow(`Failed to parse ${deltaId}: ${err.message}`));
          spinner.start('Continuing...');
          continue;
        }
      }

      if (deltaSpecs.length === 0) {
        spinner.fail(chalk.red('No valid delta specs to apply'));
        process.exit(1);
      }

      spinner.text = `Applying ${deltaSpecs.length} delta spec(s)...`;

      // Apply all deltas in sequence
      const merger = new SemanticMerger();
      let currentContent = baseContent;
      let totalStats = {
        added: 0,
        modified: 0,
        removed: 0,
        conflicts: 0
      };

      for (const deltaSpec of deltaSpecs) {
        const result = merger.merge(currentContent, deltaSpec);
        
        // Accumulate stats
        totalStats.added += result.stats.added;
        totalStats.modified += result.stats.modified;
        totalStats.removed += result.stats.removed;
        totalStats.conflicts += result.stats.conflicts;

        if (result.conflicts.length > 0) {
          spinner.warn(chalk.yellow(`Conflicts in ${deltaSpec.id}:`));
          for (const conflict of result.conflicts) {
            console.log(chalk.yellow(`  - ${conflict.message}`));
          }
          
          if (!options.force) {
            const proceed = await confirm({
              message: 'Apply anyway (may result in incomplete merge)?',
              default: false
            });
            if (!proceed) {
              spinner.fail(chalk.red('Apply cancelled due to conflicts'));
              process.exit(1);
            }
          }
        }

        currentContent = result.content;
      }

      spinner.stop();

      // Show preview of changes
      console.log(chalk.blue('\n📊 Merge Summary:'));
      console.log(chalk.green(`  ✓ Added: ${totalStats.added} requirements`));
      console.log(chalk.yellow(`  ~ Modified: ${totalStats.modified} requirements`));
      console.log(chalk.red(`  - Removed: ${totalStats.removed} requirements`));
      if (totalStats.conflicts > 0) {
        console.log(chalk.red(`  ⚠ Conflicts: ${totalStats.conflicts}`));
      }

      // Confirm before writing
      const proceed = await confirm({
        message: 'Apply these changes to the base spec?',
        default: true
      });

      if (!proceed) {
        console.log(chalk.yellow('\nApply cancelled.'));
        process.exit(0);
      }

      spinner.start('Applying changes...');

      // Create backup if requested
      if (options.backup) {
        const backupDir = join('specs', 'backups');
        await mkdir(backupDir, { recursive: true });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = join(backupDir, `${specId}-${timestamp}.md`);
        await copyFile(baseSpecPath, backupPath);
        spinner.text = `Created backup: ${backupPath}`;
      }

      // Write merged content
      await writeFile(baseSpecPath, currentContent);

      // Archive applied deltas (only those that were successfully applied)
      const archiveDir = join('specs', 'deltas', 'applied');
      await mkdir(archiveDir, { recursive: true });
      for (const deltaSpec of deltaSpecs) {
        const deltaFile = `${deltaSpec.id}.md`;
        const deltaPath = join(deltasDir, deltaFile);
        const archivePath = join(archiveDir, deltaFile);
        await copyFile(deltaPath, archivePath);
        await unlink(deltaPath); // Remove original after archiving
      }

      spinner.succeed(chalk.green(`Successfully applied ${deltaSpecs.length} delta spec(s) to ${specId}`));
      console.log(chalk.blue(`  Updated: ${baseSpecPath}`));
      if (options.backup) {
        console.log(chalk.blue(`  Backup: specs/backups/`));
      }
      console.log(chalk.blue(`  Archived deltas: specs/deltas/applied/`));
      console.log(chalk.gray('\n  Next steps:'));
      console.log(chalk.gray(`    1. Review changes: git diff ${baseSpecPath}`));
      console.log(chalk.gray(`    2. Update tests if needed`));
      console.log(chalk.gray(`    3. Run: specsafe verify ${specId}`));
    } catch (error: any) {
      spinner.fail(chalk.red(`Failed to apply deltas: ${error.message}`));
      process.exit(1);
    }
  });
