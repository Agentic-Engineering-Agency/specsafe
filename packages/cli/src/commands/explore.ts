import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { input, editor, select, confirm } from '@inquirer/prompts';

interface ExplorationResult {
  idea: string;
  approach: string;
  pros: string[];
  cons: string[];
  alternatives: string[];
  recommendation: 'proceed' | 'refine' | 'pivot' | 'abort';
  nextSteps: string[];
}

export const exploreCommand = new Command('explore')
  .description('Explore ideas before creating a spec')
  .argument('[topic]', 'Topic or idea to explore')
  .option('-t, --template <type>', 'Exploration template', 'general')
  .action(async (topic: string | undefined, options: { template: string }) => {
    const spinner = ora('Starting exploration session...').start();
    
    try {
      spinner.stop();
      
      console.log(chalk.blue('\n🔍 SpecSafe Exploration Mode\n'));
      console.log(chalk.gray('Think through ideas before committing to a spec.\n'));
      
      // Get the topic if not provided
      let explorationTopic = topic;
      if (!explorationTopic) {
        explorationTopic = await input({
          message: 'What idea or feature do you want to explore?',
          validate: (value) => value.length > 0 || 'Please provide a topic'
        });
      }

      console.log(chalk.blue(`\nExploring: ${explorationTopic}\n`));

      // Choose exploration approach
      const approach = await select({
        message: 'What aspect do you want to focus on?',
        choices: [
          { 
            name: 'Technical Feasibility', 
            value: 'feasibility',
            description: 'Evaluate if this is technically possible'
          },
          { 
            name: 'User Impact', 
            value: 'impact',
            description: 'Understand how users would benefit'
          },
          { 
            name: 'Implementation Approaches', 
            value: 'approaches',
            description: 'Compare different ways to build this'
          },
          { 
            name: 'Risk Assessment', 
            value: 'risks',
            description: 'Identify potential problems and mitigations'
          },
          { 
            name: 'Free-form Exploration', 
            value: 'freeform',
            description: 'Open-ended exploration'
          }
        ]
      });

      const result: ExplorationResult = {
        idea: explorationTopic,
        approach: '',
        pros: [],
        cons: [],
        alternatives: [],
        recommendation: 'proceed',
        nextSteps: []
      };

      // Guided prompts based on approach
      switch (approach) {
        case 'feasibility':
          result.approach = await editor({
            message: 'Describe the proposed solution:',
            default: `# ${explorationTopic}\n\n## Proposed Solution\n\n[Describe your idea here]\n\n## Technical Considerations\n\n- What technologies would be needed?\n- What are the integration points?\n- Are there any blockers?`
          });
          break;

        case 'impact':
          result.approach = await editor({
            message: 'Describe the user impact:',
            default: `# ${explorationTopic}\n\n## Target Users\n\n[Who benefits from this?]\n\n## Problem Being Solved\n\n[What pain point does this address?]\n\n## Expected Outcomes\n\n[What changes for the user?]`
          });
          break;

        case 'approaches':
          result.approach = await editor({
            message: 'Compare different approaches:',
            default: `# ${explorationTopic}\n\n## Option 1: [Name]\n\nDescription...\n\nPros:\n- \n\nCons:\n- \n\n## Option 2: [Name]\n\nDescription...\n\nPros:\n- \n\nCons:\n- `
          });
          break;

        case 'risks':
          result.approach = await editor({
            message: 'Identify risks and mitigations:',
            default: `# ${explorationTopic}\n\n## Potential Risks\n\n| Risk | Probability | Impact | Mitigation |\n|------|-------------|--------|------------|\n| | | | |\n\n## Dependencies\n\n- What does this depend on?\n- What depends on this?\n\n## Unknowns\n\n[What don't we know yet?]`
          });
          break;

        case 'freeform':
        default:
          result.approach = await editor({
            message: 'Explore your idea freely:',
            default: explorationTopic
          });
      }

      // Pros and cons
      console.log(chalk.blue('\nPros and Cons:\n'));
      
      const prosInput = await editor({
        message: 'List the advantages/benefits:',
        default: '- \n- \n- '
      });
      result.pros = prosInput.split('\n').filter(line => line.trim().startsWith('-')).map(line => line.replace(/^-\s*/, '').trim());

      const consInput = await editor({
        message: 'List the challenges/risks:',
        default: '- \n- \n- '
      });
      result.cons = consInput.split('\n').filter(line => line.trim().startsWith('-')).map(line => line.replace(/^-\s*/, '').trim());

      // Alternatives
      const alternativesInput = await editor({
        message: 'What alternatives exist?',
        default: `- Do nothing (status quo)
- [Alternative approach 1]
- [Alternative approach 2]`
      });
      result.alternatives = alternativesInput.split('\n').filter(line => line.trim().startsWith('-')).map(line => line.replace(/^-\s*/, '').trim());

      // Recommendation
      result.recommendation = await select({
        message: 'What is your recommendation?',
        choices: [
          { name: '✅ Proceed - Create a spec', value: 'proceed' },
          { name: '🔄 Refine - Needs more thought', value: 'refine' },
          { name: '↩️  Pivot - Consider alternatives', value: 'pivot' },
          { name: '❌ Abort - Not worth pursuing', value: 'abort' }
        ]
      });

      // Next steps
      const nextStepsInput = await editor({
        message: 'What are the next steps?',
        default: result.recommendation === 'proceed' 
          ? `1. Create spec with: specsafe new ${explorationTopic.toLowerCase().replace(/\s+/g, '-')}\n2. Define detailed requirements\n3. Identify technical approach`
          : `1. [Research needed]\n2. [Stakeholder input needed]\n3. [Decision needed]`
      });
      result.nextSteps = nextStepsInput.split('\n').filter(line => line.trim());

      // Generate summary
      console.log(chalk.blue('\n' + '━'.repeat(60)));
      console.log(chalk.bold('  Exploration Summary'));
      console.log(chalk.blue('━'.repeat(60) + '\n'));

      console.log(chalk.white(`  Topic: ${explorationTopic}`));
      console.log(chalk.gray(`  Focus: ${approach}\n`));

      if (result.pros.length > 0) {
        console.log(chalk.green('  Pros:'));
        for (const pro of result.pros) {
          console.log(chalk.green(`    ✓ ${pro}`));
        }
        console.log();
      }

      if (result.cons.length > 0) {
        console.log(chalk.red('  Cons:'));
        for (const con of result.cons) {
          console.log(chalk.red(`    ✗ ${con}`));
        }
        console.log();
      }

      // Recommendation
      const recColors: Record<string, (text: string) => string> = {
        proceed: chalk.green.bold,
        refine: chalk.yellow.bold,
        pivot: chalk.blue.bold,
        abort: chalk.red.bold
      };
      
      const recLabels: Record<string, string> = {
        proceed: 'PROCEED',
        refine: 'REFINE',
        pivot: 'PIVOT',
        abort: 'ABORT'
      };

      const recColor = recColors[result.recommendation];
      const recLabel = recLabels[result.recommendation];
      console.log(chalk.white('  Recommendation: ') + recColor(recLabel));
      console.log();

      if (result.nextSteps.length > 0) {
        console.log(chalk.blue('  Next Steps:'));
        for (const step of result.nextSteps) {
          console.log(chalk.white(`    → ${step}`));
        }
      }

      console.log(chalk.blue('\n' + '━'.repeat(60)));

      // Offer to create spec if recommended
      if (result.recommendation === 'proceed') {
        const shouldCreate = await confirm({
          message: 'Create a spec now?',
          default: true
        });

        if (shouldCreate) {
          const featureName = explorationTopic.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          console.log(chalk.blue(`\nRun: specsafe new ${featureName}`));
        }
      }

      console.log();

    } catch (error: any) {
      if (error.message.includes('User force closed')) {
        console.log(chalk.gray('\nExploration cancelled.'));
        process.exit(0);
      }
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });
