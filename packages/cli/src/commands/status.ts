import { Command } from 'commander';
import chalk from 'chalk';
import { readFile } from 'fs/promises';
import { ProjectTracker } from '@specsafe/core';

export const statusCommand = new Command('status')
  .description('Show project status')
  .action(async () => {
    try {
      const tracker = new ProjectTracker(process.cwd());
      const state = await tracker.readState();

      if (!state) {
        console.log(chalk.yellow('No SpecSafe project found. Run: specsafe init'));
        return;
      }

      console.log(chalk.bold.blue(`\n📊 ${state.projectName} - Project Status\n`));

      // Metrics
      console.log(chalk.bold('Metrics:'));
      console.log(`  Total Specs: ${state.metrics.totalSpecs}`);
      console.log(`  Completion Rate: ${(state.metrics.completionRate * 100).toFixed(1)}%`);
      console.log(`  Last Updated: ${state.lastUpdated.toISOString().split('T')[0]}`);

      // By stage
      console.log(chalk.bold('\nBy Stage:'));
      const stages = ['spec', 'test', 'code', 'qa', 'complete', 'archived'] as const;
      stages.forEach(stage => {
        const count = state.metrics.byStage[stage];
        const color = count > 0 ? chalk.green : chalk.gray;
        console.log(`  ${stage.toUpperCase().padEnd(10)} ${color(count.toString().padStart(3))}`);
      });

      // Recent specs
      if (state.specs.length > 0) {
        console.log(chalk.bold('\nRecent Specs:'));
        const recentSpecs = state.specs
          .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())
          .slice(0, 5);

        recentSpecs.forEach(spec => {
          const stageColor = spec.stage === 'complete' ? chalk.green : 
                            spec.stage === 'archived' ? chalk.gray : chalk.blue;
          console.log(`  ${spec.id} - ${spec.name} [${stageColor(spec.stage.toUpperCase())}]`);
        });
      }

      console.log(); // Empty line
    } catch (error: any) {
      console.error(chalk.red('Error reading status:'), error.message);
      process.exit(1);
    }
  });