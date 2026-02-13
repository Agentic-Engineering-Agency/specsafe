import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { access } from 'fs/promises';
import { ProjectMemoryManager, SteeringEngine } from '@specsafe/core';

export const memoryCommand = new Command('memory')
  .description('Project memory and steering commands')
  .addCommand(
    new Command('show')
      .description('Display project patterns and decisions')
      .option('-p, --patterns', 'Show only patterns')
      .option('-d, --decisions', 'Show only decisions')
      .option('-c, --constraints', 'Show only constraints')
      .action(async (options: { patterns?: boolean; decisions?: boolean; constraints?: boolean }) => {
        const spinner = ora('Loading project memory...').start();

        try {
          // Check if we're in a SpecSafe project
          try {
            await access('.specsafe');
          } catch {
            spinner.fail(chalk.red('Not a SpecSafe project. Run "specsafe init" first.'));
            process.exit(1);
          }

          const manager = new ProjectMemoryManager(process.cwd());
          
          if (!(await manager.exists())) {
            spinner.stop();
            console.log(chalk.yellow('\n📭 No project memory found yet.'));
            console.log(chalk.gray('Memory will be created as you work on specs.\n'));
            console.log(chalk.gray('To start building memory:'));
            console.log(chalk.gray('  1. Create specs with specsafe new'));
            console.log(chalk.gray('  2. Record decisions with patterns\n'));
            return;
          }

          const memory = await manager.load('project');
          spinner.stop();

          const showAll = !options.patterns && !options.decisions && !options.constraints;

          // Header
          console.log(chalk.blue('\n┌─────────────────────────────────────────────────────────────┐'));
          console.log(chalk.blue('│                   Project Memory                            │'));
          console.log(chalk.blue('└─────────────────────────────────────────────────────────────┘\n'));

          // Patterns
          if (showAll || options.patterns) {
            if (memory.patterns.length > 0) {
              console.log(chalk.cyan('📐 Patterns\n'));
              
              // Sort by usage count
              const sortedPatterns = [...memory.patterns]
                .sort((a, b) => b.usageCount - a.usageCount);

              for (const pattern of sortedPatterns) {
                const color = pattern.usageCount >= 3 ? chalk.green : 
                             pattern.usageCount >= 2 ? chalk.yellow : chalk.gray;
                console.log(color(`  ${pattern.name} ${chalk.gray(`(${pattern.usageCount} spec${pattern.usageCount > 1 ? 's' : ''})`)}`));
                console.log(chalk.gray(`    ${pattern.description}`));
                
                // Show examples
                if (pattern.examples.length > 0) {
                  const examples = pattern.examples.slice(0, 3);
                  console.log(chalk.gray(`    Used in: ${examples.map(e => e.specId).join(', ')}`));
                }
                console.log();
              }
            } else if (options.patterns) {
              console.log(chalk.gray('No patterns recorded yet.\n'));
            }
          }

          // Decisions
          if (showAll || options.decisions) {
            if (memory.decisions.length > 0) {
              console.log(chalk.cyan('📋 Decisions\n'));

              // Sort by timestamp (most recent first)
              const sortedDecisions = [...memory.decisions]
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .slice(0, 10); // Show last 10

              for (const decision of sortedDecisions) {
                const date = decision.timestamp.toISOString().split('T')[0];
                console.log(chalk.white(`  ${decision.decision}`));
                console.log(chalk.gray(`    ${decision.rationale}`));
                console.log(chalk.gray(`    In: ${decision.specId} (${date})`));
                
                if (decision.alternatives.length > 0) {
                  console.log(chalk.gray(`    Alternatives considered: ${decision.alternatives.join(', ')}`));
                }
                console.log();
              }

              if (memory.decisions.length > 10) {
                console.log(chalk.gray(`  ... and ${memory.decisions.length - 10} more decisions\n`));
              }
            } else if (options.decisions) {
              console.log(chalk.gray('No decisions recorded yet.\n'));
            }
          }

          // Constraints
          if (showAll || options.constraints) {
            if (memory.constraints.length > 0) {
              console.log(chalk.cyan('🔒 Constraints\n'));

              const byType = {
                technical: memory.constraints.filter(c => c.type === 'technical'),
                architectural: memory.constraints.filter(c => c.type === 'architectural'),
                business: memory.constraints.filter(c => c.type === 'business')
              };

              for (const [type, constraints] of Object.entries(byType)) {
                if (constraints.length > 0) {
                  console.log(chalk.yellow(`  ${type.charAt(0).toUpperCase() + type.slice(1)}:`));
                  for (const constraint of constraints) {
                    console.log(chalk.gray(`    • ${constraint.description}`));
                  }
                  console.log();
                }
              }
            } else if (options.constraints) {
              console.log(chalk.gray('No constraints recorded yet.\n'));
            }
          }

          // Summary footer
          if (showAll) {
            console.log(chalk.blue('─'.repeat(63)));
            console.log(chalk.gray(`\n  Total: ${memory.patterns.length} patterns, ${memory.decisions.length} decisions, ${memory.constraints.length} constraints`));
            console.log(chalk.gray(`  Specs tracked: ${memory.specs.length}\n`));
          }
        } catch (error: any) {
          spinner.fail(chalk.red(`Failed to load memory: ${error.message}`));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('context')
      .description('Show context for a specific spec')
      .argument('<spec-id>', 'Spec ID to get context for')
      .action(async (specId: string) => {
        const spinner = ora('Loading context...').start();

        try {
          const engine = new SteeringEngine(process.cwd());
          await engine.initialize('project');

          const context = engine.getMemoryManager().getContextForSpec(specId);
          spinner.stop();

          console.log(chalk.blue(`\n📚 Context for ${specId}\n`));

          console.log(chalk.white('Summary:'));
          console.log(chalk.gray(`  ${context.summary}\n`));

          if (context.patterns.length > 0) {
            console.log(chalk.cyan('Reusable Patterns:'));
            for (const pattern of context.patterns.slice(0, 5)) {
              console.log(chalk.gray(`  • ${pattern.name} (${pattern.usageCount} uses)`));
            }
            console.log();
          }

          if (context.decisions.length > 0) {
            console.log(chalk.cyan('Related Decisions:'));
            for (const decision of context.decisions.slice(0, 5)) {
              console.log(chalk.gray(`  • ${decision.decision} (${decision.specId})`));
            }
            console.log();
          }

          if (context.relatedSpecs.length > 0) {
            console.log(chalk.cyan('Related Specs:'));
            console.log(chalk.gray(`  ${context.relatedSpecs.join(', ')}\n`));
          }
        } catch (error: any) {
          spinner.fail(chalk.red(`Failed to get context: ${error.message}`));
          process.exit(1);
        }
      })
  );
