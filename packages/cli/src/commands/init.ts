import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { writeFile, mkdir } from 'fs/promises';
import { ProjectTracker } from '@specsafe/core';
import { checkbox, select, confirm, input } from '@inquirer/prompts';
import { detectInstalledTools, availableTools } from '../utils/detectTools.js';
import { generateToolConfig, generateGitHooks } from '../utils/generateToolConfig.js';

export const initCommand = new Command('init')
  .description('Initialize a new SpecSafe project')
  .argument('[name]', 'Project name', 'my-project')
  .action(async (defaultName: string) => {
    const spinner = ora('Initializing SpecSafe project...').start();

    try {
      // Interactive prompts for project name
      spinner.stop();
      const name = await input({
        message: 'Project name:',
        default: defaultName,
      });

      // 1. Detect existing tools
      const detectedTools = detectInstalledTools();

      // 2. Prompt user to confirm/select tools
      const toolChoices = availableTools.map((tool) => ({
        name: tool.displayName + (detectedTools.includes(tool.name) ? ' (detected)' : ''),
        value: tool.name,
        checked: detectedTools.includes(tool.name),
      }));

      const selectedTools = await checkbox({
        message: 'Which AI coding assistants do you use?',
        choices: toolChoices,
      });

      // 3. Prompt for test framework
      const testFramework = await select({
        message: 'Select testing framework:',
        choices: [
          { name: 'Vitest (recommended)', value: 'vitest' },
          { name: 'Jest', value: 'jest' },
          { name: 'Playwright (E2E)', value: 'playwright' },
        ],
        default: 'vitest',
      });

      // 4. Prompt for git hooks
      const useGitHooks = await confirm({
        message: 'Enable git hooks for spec validation?',
        default: true,
      });

      spinner.start('Creating project structure...');

      // Create directory structure
      await mkdir('specs/active', { recursive: true });
      await mkdir('specs/completed', { recursive: true });
      await mkdir('specs/archive', { recursive: true });
      await mkdir('src', { recursive: true });
      await mkdir('tests', { recursive: true });

      // Create PROJECT_STATE.md
      const tracker = new ProjectTracker(process.cwd());
      await tracker.initialize(name);

      // Create spec template
      const template = `# Spec Template

## Metadata
- **ID**: SPEC-{YYYYMMDD}-{NNN}
- **Status**: draft
- **Priority**: P1

## 1. Purpose (WHY)

## 2. Scope (WHAT)
### In Scope
- 

### Out of Scope
- 

## 3. Requirements
| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
|    |             |          |                     |

## 4. Technical Approach (HOW)

## 5. Test Strategy

## 6. Implementation Plan

## 7. Success Criteria
- [ ] 

## 8. Risks & Mitigations

## 9. Notes & References
`;
      await writeFile('specs/template.md', template);

      // Create config file with selected tools
      const toolsConfig: Record<string, { enabled: boolean }> = {};
      for (const tool of selectedTools) {
        toolsConfig[tool] = { enabled: true };
      }

      const config = {
        project: name,
        version: '1.0.0',
        stages: ['spec', 'test', 'code', 'qa', 'complete'],
        testFramework,
        language: 'typescript',
        tools: toolsConfig,
        gitHooks: {
          enabled: useGitHooks,
        },
      };
      await writeFile('specsafe.config.json', JSON.stringify(config, null, 2));

      spinner.text = 'Generating tool configurations...';

      // Generate tool configs for selected tools
      for (const tool of selectedTools) {
        await generateToolConfig(tool, '.');
      }

      // Generate git hooks if enabled
      if (useGitHooks) {
        await generateGitHooks('.');
      }

      spinner.succeed(chalk.green(`Initialized SpecSafe project: ${name}`));

      console.log('\n' + chalk.blue('Generated configurations:'));
      for (const tool of selectedTools) {
        console.log(chalk.green(`  ✓ ${tool} configuration`));
      }
      if (useGitHooks) {
        console.log(chalk.green('  ✓ Git hooks enabled'));
      }
      console.log(chalk.green(`  ✓ ${testFramework} configuration`));

      console.log('\n' + chalk.blue('Next steps:'));
      console.log('  1. specsafe new <spec-name>  - Create a new spec');
      console.log('  2. specsafe status             - View project status');
      console.log('  3. Edit specs/active/ to define requirements');
    } catch (error: any) {
      spinner.fail(chalk.red(`Failed to initialize: ${error.message}`));
      if (error.message.includes('EEXIST')) {
        console.log(chalk.gray("💡 Tip: Directory already exists. Use 'specsafe init <name>' to create elsewhere."));
      }
      if (error.message.includes('User force closed')) {
        console.log(chalk.gray('💡 Tip: Init was cancelled by user.'));
        process.exit(0);
      }
      process.exit(1);
    }
  });
