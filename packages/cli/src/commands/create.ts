import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import {
  ElicitationEngine,
  quickFlow,
  fullFlow,
  earsFlow,
  generateSpec,
  type ElicitationFlow,
  type ElicitationStep,
} from '@specsafe/core';

/**
 * Prompt user for input based on step type
 * This is a simplified version - in a real implementation,
 * you would use inquirer or prompts for interactive input
 */
async function promptForStep(step: ElicitationStep): Promise<any> {
  console.log(chalk.cyan(`\n${step.prompt}`));
  
  if (step.type === 'choice' && step.choices) {
    console.log(chalk.gray('Choices:'));
    step.choices.forEach((choice, i) => {
      console.log(chalk.gray(`  ${i + 1}. ${choice}`));
    });
    if (step.default) {
      console.log(chalk.gray(`Default: ${step.default}`));
    }
  }
  
  if (step.default !== undefined) {
    console.log(chalk.gray(`(default: ${step.default})`));
  }
  
  // For now, use default or empty string
  // In a real implementation, this would use inquirer to get user input
  return step.default ?? '';
}

/**
 * Run interactive elicitation flow
 */
async function runInteractiveFlow(flow: ElicitationFlow): Promise<string> {
  const engine = new ElicitationEngine(flow);
  
  console.log(chalk.bold.blue(`\n📝 ${flow.name}`));
  console.log(chalk.gray(flow.description));
  console.log(chalk.gray('\nPress Ctrl+C to cancel at any time.\n'));
  
  const spinner = ora('Starting elicitation flow...').start();
  await new Promise(resolve => setTimeout(resolve, 500));
  spinner.succeed('Flow started');
  
  let currentStep: ElicitationStep | null = engine.start();
  
  while (currentStep) {
    const answer = await promptForStep(currentStep);
    
    try {
      currentStep = engine.answer(currentStep.id, answer);
    } catch (error) {
      console.log(chalk.red(`\n❌ Error: ${(error as Error).message}`));
      // In a real implementation, re-prompt the user
      break;
    }
  }
  
  if (!engine.isComplete()) {
    throw new Error('Flow was not completed');
  }
  
  const result = engine.getResult();
  const spec = generateSpec(result);
  
  return spec;
}

/**
 * Create command - interactive spec elicitation
 */
export const createCommand = new Command('create')
  .description('Create a new specification through interactive elicitation')
  .option('--quick', 'Use quick flow (5 questions)')
  .option('--ears', 'Use EARS flow (structured requirements)')
  .option('--template <name>', 'Use a template (coming soon)')
  .option('-o, --output <path>', 'Output file path (default: specs/<spec-id>.md)')
  .action(async (options) => {
    try {
      // Check for template option
      if (options.template) {
        console.log(chalk.yellow('\n⚠️  Template support is coming soon!'));
        console.log(chalk.gray('For now, please use --quick, --ears, or default full flow.\n'));
        process.exit(0);
      }
      
      // Determine which flow to use
      let flow: ElicitationFlow;
      let flowName: string;
      
      if (options.quick) {
        flow = quickFlow;
        flowName = 'Quick';
      } else if (options.ears) {
        flow = earsFlow;
        flowName = 'EARS';
      } else {
        flow = fullFlow;
        flowName = 'Full';
      }
      
      console.log(chalk.bold.green(`\n🚀 SpecSafe Create - ${flowName} Flow\n`));
      
      // Run the elicitation flow
      const spec = await runInteractiveFlow(flow);
      
      // Determine output path
      let outputPath = options.output;
      if (!outputPath) {
        // Extract spec ID from generated spec
        const specIdMatch = spec.match(/\*\*Spec ID\*\*:\s*(\S+)/);
        const specId = specIdMatch ? specIdMatch[1] : `spec-${Date.now()}`;
        outputPath = join(process.cwd(), 'specs', `${specId}.md`);
      }
      
      // Ensure output directory exists
      const outputDir = dirname(outputPath);
      if (!existsSync(outputDir)) {
        await mkdir(outputDir, { recursive: true });
      }
      
      // Write the spec file
      const spinner = ora('Writing specification...').start();
      await writeFile(outputPath, spec, 'utf-8');
      spinner.succeed('Specification created');
      
      console.log(chalk.green(`\n✅ Specification created successfully!`));
      console.log(chalk.gray(`📄 File: ${outputPath}`));
      console.log(chalk.gray(`\nNext steps:`));
      console.log(chalk.gray(`  1. Review and edit the specification`));
      console.log(chalk.gray(`  2. Run: specsafe test-create <spec-id>`));
      console.log(chalk.gray(`  3. Implement the feature\n`));
      
    } catch (error) {
      console.error(chalk.red('\n❌ Error creating specification:'));
      console.error(chalk.red((error as Error).message));
      process.exit(1);
    }
  });
