/**
 * Create Command
 * Interactive spec creation using the elicitation system
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { writeFile, mkdir } from 'fs/promises';
import { dirname, resolve } from 'path';
import {
  ElicitationEngine,
  quickFlow,
  fullFlow,
  earsFlow,
  generateSpec,
  defaultOutputPath,
} from '@specsafe/core';
import { input, select, editor, confirm, checkbox } from '@inquirer/prompts';
import type { ElicitationStep } from '@specsafe/core';

/**
 * Prompt the user for a single elicitation step
 */
async function promptStep(step: ElicitationStep): Promise<any> {
  const message = step.prompt;

  switch (step.type) {
    case 'text':
      // Use editor for longer text fields (requirements, descriptions)
      if (
        step.id.includes('requirements') ||
        step.id.includes('description') ||
        step.id.includes('criteria') ||
        step.id.includes('considerations') ||
        step.id.includes('risks') ||
        step.id.includes('dependencies')
      ) {
        return editor({
          message,
          default: step.default,
        });
      }
      return input({
        message,
        default: step.default,
        required: step.required ?? false,
      });

    case 'choice':
      return select({
        message,
        choices: (step.choices ?? []).map((c) => ({ name: c, value: c })),
        default: step.default,
      });

    case 'multi-choice':
      return checkbox({
        message,
        choices: (step.choices ?? []).map((c) => ({ name: c, value: c })),
      });

    case 'confirm':
      return confirm({
        message,
        default: step.default ?? true,
      });

    case 'conditional':
      // Conditional steps are handled by the engine; prompt as text
      return input({
        message,
        default: step.default,
      });

    default:
      return input({ message, default: step.default });
  }
}

/**
 * Generate default output path
 */

export const createCommand = new Command('create')
  .description('Create a new spec via interactive elicitation')
  .option('--quick', 'Use quick flow (fewer questions)')
  .option('--ears', 'Use EARS flow (structured requirements)')
  .option('-o, --output <path>', 'Output file path')
  .action(
    async (options: { quick?: boolean; ears?: boolean; output?: string }) => {
      console.log(
        chalk.blue('\n🧠 SpecSafe Interactive Spec Creation\n')
      );

      // Select flow
      let flow = fullFlow;
      let flowLabel = 'full';
      if (options.quick) {
        flow = quickFlow;
        flowLabel = 'quick';
      } else if (options.ears) {
        flow = earsFlow;
        flowLabel = 'EARS';
      }

      console.log(
        chalk.gray(`Using ${flowLabel} flow: ${flow.description}\n`)
      );

      // Run elicitation
      const engine = new ElicitationEngine(flow);
      let step = engine.start();

      while (step) {
        try {
          const answer = await promptStep(step);
          step = engine.answer(step.id, answer);
        } catch (err: any) {
          // Handle validation errors — re-prompt
          if (err.message?.includes('required') || err.message?.includes('Validation')) {
            console.log(chalk.red(`  ⚠ ${err.message}`));
            continue;
          }
          throw err;
        }
      }

      // Generate spec
      const spinner = ora('Generating specification...').start();

      const result = engine.getResult();
      const spec = generateSpec(result);

      // Determine output path
      const outputPath = resolve(options.output ?? defaultOutputPath());

      try {
        // Ensure directory exists
        await mkdir(dirname(outputPath), { recursive: true });

        // Write spec
        await writeFile(outputPath, spec, 'utf-8');
      } catch (err) {
        spinner.fail(chalk.red(`Failed to write spec to ${chalk.bold(outputPath)}`));
        throw err;
      }

      spinner.succeed(
        chalk.green(`Spec written to ${chalk.bold(outputPath)}`)
      );

      console.log(
        chalk.gray(
          `\n  Flow: ${flowLabel} | Steps completed: ${Object.keys(result.answers).length} | Skipped: ${result.metadata.skipped.length}\n`
        )
      );
    }
  );
