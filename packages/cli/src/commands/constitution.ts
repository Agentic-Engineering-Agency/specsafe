import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { ConstitutionManager, generateConstitution, generateMinimalConstitution, generateStrictConstitution, BUILTIN_PRINCIPLES, type Principle, type Spec } from '@specsafe/core';

async function loadSpec(specId: string, cwd: string = process.cwd()): Promise<Spec> {
  const specsDir = join(cwd, 'specs');
  const specPath = join(specsDir, `${specId}.json`);
  
  if (!existsSync(specPath)) throw new Error(`Spec file not found: ${specPath}`);
  
  const content = await readFile(specPath, 'utf-8');
  const spec = JSON.parse(content);
  
  spec.createdAt = new Date(spec.createdAt);
  spec.updatedAt = new Date(spec.updatedAt);
  if (spec.completedAt) spec.completedAt = new Date(spec.completedAt);
  
  return spec;
}

export const constitutionCommand = new Command('constitution')
  .description('Manage constitutional governance')
  .addCommand(
    new Command('init')
      .description('Initialize constitution')
      .option('--minimal', 'Minimal constitution')
      .option('--strict', 'Strict constitution')
      .option('--force', 'Overwrite existing')
      .action(async (options: { minimal?: boolean; strict?: boolean; force?: boolean }) => {
        const spinner = ora('Initializing...').start();
        try {
          const cwd = process.cwd();
          const specsafeDir = join(cwd, '.specsafe');
          const constitutionPath = join(specsafeDir, 'constitution.md');

          if (existsSync(constitutionPath) && !options.force) {
            spinner.fail(chalk.red('Constitution exists. Use --force'));
            process.exit(1);
          }

          await mkdir(specsafeDir, { recursive: true });

          let projectName = 'My Project';
          try {
            const pkgPath = join(cwd, 'package.json');
            if (existsSync(pkgPath)) {
              const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'));
              projectName = pkg.name || projectName;
            }
          } catch {}

          let content: string;
          if (options.minimal) content = generateMinimalConstitution(projectName);
          else if (options.strict) content = generateStrictConstitution(projectName);
          else content = generateConstitution({ projectName });

          await writeFile(constitutionPath, content);

          spinner.succeed(chalk.green('Constitution initialized'));
          console.log(chalk.gray(`\n${constitutionPath}`));
        } catch (error: any) {
          spinner.fail(chalk.red(error.message));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('list')
      .description('List principles')
      .option('--builtin-only', 'Show built-ins only')
      .action(async (options: { builtinOnly?: boolean }) => {
        const spinner = ora('Loading...').start();
        try {
          if (options.builtinOnly) {
            spinner.stop();
            console.log(chalk.bold('\n📋 Built-in Principles:\n'));
            for (const p of BUILTIN_PRINCIPLES) {
              const lock = p.immutable ? '🔒' : '🔓';
              const sev = p.severity === 'error' ? '🚫' : '⚠️';
              console.log(`${lock} ${sev} ${chalk.cyan(p.id.padEnd(30))} ${p.name}`);
            }
            return;
          }

          const mgr = new ConstitutionManager();
          await mgr.load({ includeBuiltins: true });
          const principles = mgr.listPrinciples();

          spinner.stop();

          console.log(chalk.bold('\n📋 Principles:\n'));
          const errors = principles.filter(p => p.severity === 'error');
          const warnings = principles.filter(p => p.severity === 'warning');

          if (errors.length > 0) {
            console.log(chalk.bold('🚫 Errors:'));
            for (const p of errors) {
              const lock = p.immutable ? '🔒' : '🔓';
              console.log(`  ${lock} ${chalk.red(p.id.padEnd(30))} ${p.name}`);
            }
            console.log();
          }

          if (warnings.length > 0) {
            console.log(chalk.bold('⚠️  Warnings:'));
            for (const p of warnings) {
              const lock = p.immutable ? '🔒' : '🔓';
              console.log(`  ${lock} ${chalk.yellow(p.id.padEnd(30))} ${p.name}`);
            }
            console.log();
          }

          console.log(chalk.gray(`Total: ${principles.length}`));
        } catch (error: any) {
          spinner.fail(chalk.red(error.message));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('check')
      .description('Check spec governance')
      .argument('<spec-id>', 'Spec ID')
      .action(async (specId: string) => {
        const spinner = ora('Checking...').start();
        try {
          const spec = await loadSpec(specId);
          const mgr = new ConstitutionManager();
          await mgr.load({ includeBuiltins: true });
          const results = await mgr.validate(spec);

          spinner.stop();

          console.log(chalk.bold(`\n🔍 ${spec.name}\n`));

          let totalErrors = 0;
          let totalWarnings = 0;

          for (const result of results) {
            const icon = result.passed ? '✅' : '❌';
            const color = result.passed ? chalk.green : chalk.red;
            console.log(`${icon} ${color(result.gate.name)}`);

            if (result.violations.length > 0) {
              for (const v of result.violations) {
                const vIcon = v.severity === 'error' ? '🚫' : '⚠️';
                const vColor = v.severity === 'error' ? chalk.red : chalk.yellow;
                console.log(`   ${vIcon} ${vColor(v.principle.name)}`);
                console.log(`      ${chalk.gray(v.message)}`);
              }
            }

            totalErrors += result.violations.filter(v => v.severity === 'error').length;
            totalWarnings += result.violations.filter(v => v.severity === 'warning').length;
          }

          console.log(chalk.bold('\nSummary:'));
          console.log(chalk.gray(`Gates: ${results.length}`));
          if (totalErrors > 0) console.log(chalk.red(`Errors: ${totalErrors}`));
          if (totalWarnings > 0) console.log(chalk.yellow(`Warnings: ${totalWarnings}`));

          if (totalErrors === 0) {
            console.log(chalk.green('\n✨ Passed!'));
          } else {
            console.log(chalk.red('\n❌ Failed'));
            process.exit(1);
          }
        } catch (error: any) {
          spinner.fail(chalk.red(error.message));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('add')
      .description('Add custom principle')
      .argument('<id>', 'Principle ID')
      .requiredOption('--name <name>', 'Name')
      .requiredOption('--description <desc>', 'Description')
      .option('--severity <level>', 'error or warning', 'warning')
      .option('--immutable', 'Immutable', false)
      .action(async (id: string, options: { name: string; description: string; severity: string; immutable: boolean }) => {
        const spinner = ora('Adding...').start();
        try {
          if (options.severity !== 'error' && options.severity !== 'warning') {
            throw new Error('Severity must be error or warning');
          }

          const mgr = new ConstitutionManager();
          await mgr.load({ includeBuiltins: false });

          const principle: Principle = {
            id,
            name: options.name,
            description: options.description,
            severity: options.severity as 'error' | 'warning',
            immutable: options.immutable,
            metadata: { createdAt: new Date() },
          };

          mgr.addPrinciple(principle);
          
          spinner.text = 'Saving...';
          await mgr.save();
          
          spinner.succeed(chalk.green('Added and saved'));
          console.log(chalk.gray(`\n${principle.id}: ${principle.name}`));
        } catch (error: any) {
          spinner.fail(chalk.red(error.message));
          process.exit(1);
        }
      })
  );
