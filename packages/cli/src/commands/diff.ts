import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { DeltaParser, SemanticMerger } from '@specsafe/core';

export const diffCommand = new Command('diff')
  .description('Show what would change when applying delta specs')
  .argument('<spec-id>', 'Base spec ID (e.g., SPEC-20260101-001)')
  .option('-v, --verbose', 'Show detailed diff')
  .action(async (specId: string, options: { verbose: boolean }) => {
    const spinner = ora('Loading delta specs...').start();

    try {
      // Validate specId to prevent path traversal
      if (!/^[A-Za-z0-9_-]+$/.test(specId)) {
        spinner.fail(chalk.red('Invalid spec ID. Use only alphanumeric characters, hyphens, and underscores.'));
        process.exit(1);
      }

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

      spinner.succeed(chalk.green(`Found ${deltaFiles.length} delta spec(s)`));

      // Parse and display each delta
      const parser = new DeltaParser();
      const merger = new SemanticMerger();

      for (const file of deltaFiles) {
        const deltaPath = join(deltasDir, file);
        const deltaContent = await readFile(deltaPath, 'utf-8');
        const deltaId = file.replace(/\.md$/, '');

        console.log(chalk.blue(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`));
        console.log(chalk.blue.bold(`📄 ${deltaId}`));
        console.log(chalk.blue(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`));

        try {
          const deltaSpec = parser.parse(deltaContent, deltaId, specId);
          
          // Validate
          const validation = parser.validate(deltaSpec);
          if (!validation.valid) {
            console.log(chalk.red('⚠️  Validation Errors:'));
            for (const error of validation.errors) {
              console.log(chalk.red(`   • ${error}`));
            }
            console.log();
          }

          // Show diff preview
          const diffPreview = merger.diff(baseContent, deltaSpec);
          console.log(diffPreview);

          // Show detailed changes if verbose
          if (options.verbose) {
            const mergeResult = merger.merge(baseContent, deltaSpec);
            
            console.log(chalk.blue('\n📊 Merge Statistics:'));
            console.log(chalk.green(`   ✓ Added: ${mergeResult.stats.added}`));
            console.log(chalk.yellow(`   ~ Modified: ${mergeResult.stats.modified}`));
            console.log(chalk.red(`   - Removed: ${mergeResult.stats.removed}`));
            
            if (mergeResult.conflicts.length > 0) {
              console.log(chalk.red(`\n⚠️  Conflicts (${mergeResult.conflicts.length}):`));
              for (const conflict of mergeResult.conflicts) {
                console.log(chalk.red(`   • [${conflict.type}] ${conflict.message}`));
              }
            }
          }

        } catch (err: any) {
          console.log(chalk.red(`❌ Failed to parse: ${err.message}`));
        }
      }

      console.log(chalk.blue(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`));
      console.log(chalk.gray('  Next steps:'));
      console.log(chalk.gray(`    • Review changes above`));
      console.log(chalk.gray(`    • Edit delta specs if needed`));
      console.log(chalk.gray(`    • Run: specsafe apply ${specId}`));

    } catch (error: any) {
      spinner.fail(chalk.red(`Failed to generate diff: ${error.message}`));
      process.exit(1);
    }
  });
