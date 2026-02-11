import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { writeFile, mkdir } from 'fs/promises';
import { ProjectTracker } from '@specsafe/core';

export const initCommand = new Command('init')
  .description('Initialize a new SpecSafe project')
  .argument('[name]', 'Project name', 'my-project')
  .action(async (name: string) => {
    const spinner = ora('Initializing SpecSafe project...').start();

    try {
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

      // Create config file
      const config = {
        projectName: name,
        version: '1.0.0',
        stages: ['spec', 'test', 'code', 'qa', 'complete'],
        testFramework: 'vitest',
        language: 'typescript'
      };
      await writeFile('specsafe.config.json', JSON.stringify(config, null, 2));

      spinner.succeed(chalk.green(`Initialized SpecSafe project: ${name}`));
      
      console.log('\n' + chalk.blue('Next steps:'));
      console.log('  1. specsafe new <spec-name>  - Create a new spec');
      console.log('  2. specsafe status             - View project status');
      console.log('  3. Edit specs/active/ to define requirements');
    } catch (error: any) {
      spinner.fail(chalk.red(`Failed to initialize: ${error.message}`));
      if (error.message.includes('EEXIST')) {
        console.log(chalk.gray('💡 Tip: Directory already exists. Use \'specsafe init <name>\' to create elsewhere.'));
      }
      process.exit(1);
    }
  });