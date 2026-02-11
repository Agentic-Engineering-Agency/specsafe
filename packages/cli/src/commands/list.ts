import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ProjectTracker } from '@specsafe/core';
import { loadConfig } from '../config.js';
import type { SpecStage, SpecSummary } from '@specsafe/core';

export const listCommand = new Command('list')
  .description('List all specs from PROJECT_STATE.md')
  .option('--stage <stage>', 'Filter by stage (spec, test, code, qa, complete, archived)')
  .option('--json', 'Output as JSON')
  .action(async (options: { stage?: string; json?: boolean }) => {
    const spinner = ora('Loading specs...').start();
    
    try {
      const config = await loadConfig();
      const tracker = new ProjectTracker(process.cwd());
      const state = await tracker.readState();
      
      if (!state) {
        spinner.stop();
        console.log(chalk.yellow('No SpecSafe project found. Run: specsafe init'));
        return;
      }
      
      spinner.stop();
      
      // Filter specs if stage option is provided
      let specs = state.specs;
      if (options.stage) {
        const stage = options.stage.toLowerCase() as SpecStage;
        const validStages: SpecStage[] = ['spec', 'test', 'code', 'qa', 'complete', 'archived'];
        
        if (!validStages.includes(stage)) {
          console.error(chalk.red(`Invalid stage: ${options.stage}`));
          console.log(chalk.gray(`Valid stages: ${validStages.join(', ')}`));
          process.exit(1);
        }
        
        specs = specs.filter(s => s.stage === stage);
      }
      
      // Sort by last updated (most recent first)
      specs = specs.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
      
      // Output as JSON if requested
      if (options.json) {
        const output = specs.map(s => ({
          id: s.id,
          name: s.name,
          stage: s.stage,
          progress: s.progress,
          lastUpdated: s.lastUpdated.toISOString(),
          createdAt: s.createdAt?.toISOString(),
          completedAt: s.completedAt?.toISOString()
        }));
        console.log(JSON.stringify(output, null, 2));
        return;
      }
      
      // Table output
      if (specs.length === 0) {
        console.log(chalk.yellow('\nNo specs found.'));
        if (options.stage) {
          console.log(chalk.gray(`No specs in stage: ${options.stage.toUpperCase()}`));
        } else {
          console.log(chalk.gray('Create your first spec with: specsafe new <name>'));
        }
        console.log();
        return;
      }
      
      console.log(chalk.bold.blue(`\n📋 ${config.projectName} - Specs (${specs.length})\n`));
      
      // Print table header
      console.log(chalk.bold('ID                 Name                           Stage      Progress  Last Updated'));
      console.log(chalk.gray('─'.repeat(90)));
      
      // Print specs
      specs.forEach((spec: SpecSummary) => {
        const stageColor = getStageColor(spec.stage);
        const id = spec.id.padEnd(18);
        const name = spec.name.slice(0, 28).padEnd(30);
        const stage = stageColor(spec.stage.toUpperCase().padEnd(10));
        const progress = `${spec.progress}%`.padEnd(8);
        const lastUpdated = spec.lastUpdated.toISOString().split('T')[0];
        
        console.log(`${id} ${name} ${stage} ${progress} ${lastUpdated}`);
      });
      
      console.log();
      
      // Print summary by stage
      const stages: SpecStage[] = ['spec', 'test', 'code', 'qa', 'complete', 'archived'];
      const byStage = stages.map(s => ({
        stage: s,
        count: state.specs.filter(spec => spec.stage === s).length
      })).filter(s => s.count > 0);
      
      if (byStage.length > 0 && !options.stage) {
        console.log(chalk.bold('Summary:'));
        byStage.forEach(({ stage, count }) => {
          const color = getStageColor(stage);
          console.log(`  ${color(stage.toUpperCase().padEnd(10))} ${count}`);
        });
        console.log();
      }
      
    } catch (error: any) {
      spinner.fail(chalk.red(error.message));
      process.exit(1);
    }
  });

function getStageColor(stage: string): (text: string) => string {
  switch (stage) {
    case 'complete':
      return chalk.green;
    case 'archived':
      return chalk.gray;
    case 'qa':
      return chalk.magenta;
    case 'code':
      return chalk.yellow;
    case 'test':
      return chalk.cyan;
    case 'spec':
      return chalk.blue;
    default:
      return chalk.white;
  }
}
