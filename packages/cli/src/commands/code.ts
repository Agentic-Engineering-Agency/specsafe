import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { Workflow, ProjectTracker, validateSpecId } from '@specsafe/core';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { input, confirm, select, editor } from '@inquirer/prompts';

export const codeCommand = new Command('code')
  .description('Start implementation with development guidance (TEST → CODE)')
  .argument('<id>', 'Spec ID')
  .option('--skip-confirm', 'Skip confirmation prompts')
  .option('--quick', 'Quick mode - minimal guidance')
  .action(async (id: string, options: { skipConfirm?: boolean; quick?: boolean }) => {
    const spinner = ora(`Starting implementation for ${id}...`).start();
    
    try {
      // Validate spec ID format
      validateSpecId(id);

      const workflow = new Workflow();
      const tracker = new ProjectTracker(process.cwd());
      
      // Load existing specs from disk
      await tracker.loadSpecsIntoWorkflow(workflow);
      
      // Check if spec exists
      const spec = workflow.getSpec(id);
      if (!spec) {
        throw new Error(`Spec '${id}' not found. Run 'specsafe new <name>' to create it first.`);
      }

      // Read spec content for guidance
      const specPath = join('specs/active', `${id}.md`);
      let specContent: string;
      try {
        specContent = await readFile(specPath, 'utf-8');
      } catch {
        throw new Error(`Spec file not found: ${specPath}`);
      }

      spinner.stop();

      // Display development guidance
      console.log(chalk.blue('\n' + '━'.repeat(60)));
      console.log(chalk.bold(`  Development Mode: ${id}`));
      console.log(chalk.blue('━'.repeat(60) + '\n'));

      // Show current status
      console.log(chalk.white(`  Current Stage: ${spec.stage.toUpperCase()}`));
      console.log(chalk.white(`  Requirements: ${spec.requirements.length}`));
      console.log(chalk.white(`  Test Files: ${spec.testFiles.length}`));
      console.log();

      // Extract key information from spec
      const prdSection = extractSection(specContent, 'Product Requirements Document');
      const acceptanceCriteria = extractSection(specContent, 'Acceptance Criteria');
      const technicalApproach = extractSection(specContent, 'Technical Approach');

      // Show PRD highlights
      if (prdSection) {
        console.log(chalk.cyan('  📝 Problem Statement:'));
        const problem = extractSection(prdSection, 'Problem Statement');
        if (problem) {
          const summary = problem.split('\n').find(line => line.trim() && !line.trim().startsWith('#'));
          if (summary) {
            console.log(chalk.gray(`    ${summary.substring(0, 100)}${summary.length > 100 ? '...' : ''}`));
          }
        }
        console.log();
      }

      // Show acceptance criteria
      if (acceptanceCriteria) {
        console.log(chalk.cyan('  ✅ Acceptance Criteria:'));
        const criteria = acceptanceCriteria
          .split('\n')
          .filter(line => line.trim().startsWith('- [') || line.trim().startsWith('-'))
          .slice(0, 5);
        
        for (const criterion of criteria) {
          const clean = criterion.replace(/^- \[[ x]\]\s*/i, '').trim();
          console.log(chalk.gray(`    • ${clean.substring(0, 60)}${clean.length > 60 ? '...' : ''}`));
        }
        console.log();
      }

      // Show technical approach hints
      if (technicalApproach) {
        console.log(chalk.cyan('  🛠️  Technical Approach:'));
        const techStack = extractSection(technicalApproach, 'Tech Stack');
        if (techStack) {
          console.log(chalk.gray(`    ${techStack.split('\n').find(l => l.trim() && !l.trim().startsWith('#')) || 'See spec for details'}`));
        }
        console.log();
      }

      // Development guidance
      if (!options.quick) {
        console.log(chalk.cyan('  📋 Implementation Checklist:\n'));
        
        const checklist = [
          'Review test files to understand expected behavior',
          'Create minimal implementation to pass first test',
          'Iterate: run tests, fix, repeat',
          'Refactor once all tests pass'
        ];

        for (const item of checklist) {
          console.log(chalk.gray(`    [ ] ${item}`));
        }
        console.log();
      }

      // Interactive guidance
      if (!options.skipConfirm && !options.quick) {
        const wantGuidance = await confirm({
          message: 'Would you like implementation guidance?',
          default: true
        });

        if (wantGuidance) {
          // Offer to create implementation file
          const createFile = await confirm({
            message: 'Create implementation file?',
            default: true
          });

          if (createFile) {
            const fileName = await input({
              message: 'Implementation file name:',
              default: `${id.toLowerCase().replace(/-/g, '_')}.ts`
            });

            const implPath = join('src', fileName);
            
            // Generate boilerplate
            const boilerplate = generateBoilerplate(spec, fileName);
            
            await mkdir('src', { recursive: true });
            await writeFile(implPath, boilerplate);
            
            console.log(chalk.green(`\n  ✅ Created: ${implPath}`));
            
            // Add to spec
            spec.implementationFiles.push(implPath);
          }

          // Offer TDD approach guidance
          const tddApproach = await select({
            message: 'Choose your approach:',
            choices: [
              { name: '📕 Read tests first, then implement', value: 'read-first' },
              { name: '⚡ Start coding (I know what to do)', value: 'start-coding' },
              { name: '🎯 One test at a time', value: 'one-test' }
            ]
          });

          switch (tddApproach) {
            case 'read-first':
              console.log(chalk.blue('\n  📖 Recommended: Read the test files first'));
              if (spec.testFiles.length > 0) {
                console.log(chalk.gray(`     ${spec.testFiles.join(', ')}`));
              }
              console.log(chalk.gray('     Understand what the tests expect, then implement.'));
              break;
            
            case 'one-test':
              console.log(chalk.blue('\n  🎯 Run tests with verbose output:'));
              console.log(chalk.gray(`     npx vitest run --reporter=verbose`));
              console.log(chalk.gray('     Fix one failing test at a time.'));
              break;
            
            case 'start-coding':
              console.log(chalk.blue('\n  ⚡ Go for it! Remember:'));
              console.log(chalk.gray('     - Run specsafe verify after changes'));
              console.log(chalk.gray('     - Keep tests passing as you go'));
              break;
          }
        }
      }

      // Move to code stage (validates tests exist)
      try {
        workflow.moveToCode(id);
        await tracker.addSpec(spec);
        console.log(chalk.green(`\n  ✅ Moved ${id} to CODE stage`));
      } catch (moveError: any) {
        if (moveError.message.includes('Must be in TEST stage')) {
          // Already in code or beyond, that's fine
          console.log(chalk.gray(`\n  Note: Spec already in ${spec.stage.toUpperCase()} stage`));
        } else if (moveError.message.includes('No test files generated')) {
          throw new Error(`No test files found. Run 'specsafe test ${id}' to generate tests first.`);
        } else {
          throw moveError;
        }
      }

      // Development commands reference
      console.log(chalk.blue('\n  Development Commands:\n'));
      console.log(chalk.gray(`    Run tests:     npx vitest run`));
      console.log(chalk.gray(`    Watch mode:    npx vitest`));
      console.log(chalk.gray(`    Verify:        specsafe verify ${id}`));
      console.log(chalk.gray(`    Check status:  specsafe status`));

      console.log(chalk.blue('\n' + '━'.repeat(60)));
      console.log();
      
    } catch (error: any) {
      spinner.fail(chalk.red(error.message));
      if (error.message.includes('not in TEST stage') || error.message.includes('Run \'specsafe test\'')) {
        console.log(chalk.gray(`💡 Tip: Run 'specsafe test ${id}' to generate tests first.`));
      } else if (error.message.includes('not found')) {
        console.log(chalk.gray(`💡 Tip: Run 'specsafe new <name>' to create a spec first.`));
      } else if (error.message.includes('No test files')) {
        console.log(chalk.gray(`💡 Tip: Run 'specsafe test ${id}' to generate tests first.`));
      }
      process.exit(1);
    }
  });

function extractSection(content: string, sectionName: string): string | null {
  const regex = new RegExp(`##+\s*${sectionName}[\\s\\S]*?(?=##+|$)`, 'i');
  const match = content.match(regex);
  return match ? match[0] : null;
}

function generateBoilerplate(spec: any, fileName: string): string {
  const functionName = fileName
    .replace(/\.ts$/, '')
    .replace(/[_-](.)/g, (_, char) => char.toUpperCase())
    .replace(/^(.)/, (_, char) => char.toUpperCase());

  const requirements = spec.requirements.map((r: any) => `// - ${r.text}`).join('\n');

  return `/**
 * ${spec.name}
 * Spec: ${spec.id}
 * 
 * Requirements:
${requirements || ' * (See spec for requirements)'}
 */

// TODO: Implement functionality to pass tests

export interface ${functionName}Options {
  // Define options here
}

export function ${functionName}(options?: ${functionName}Options): void {
  // TODO: Implement
  throw new Error('Not implemented');
}

// TODO: Add more exports as needed
`;
}
