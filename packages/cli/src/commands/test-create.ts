import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { Workflow, ProjectTracker, validateSpecId } from '@specsafe/core';
import { TypeScriptTestGenerator, ScenarioParser } from '@specsafe/test-gen';
import { loadConfig } from '../config.js';
import { mkdir, writeFile, readFile, access } from 'fs/promises';
import { join } from 'path';
import { input, confirm, select } from '@inquirer/prompts';

export const testCommand = new Command('test')
  .description('Generate tests from spec scenarios (SPEC → TEST)')
  .argument('<id>', 'Spec ID')
  .option('-n, --dry-run', 'Preview changes without writing files')
  .option('--scenarios-only', 'Only generate tests for specific scenarios')
  .option('--framework <framework>', 'Override test framework')
  .action(async (id: string, options: { dryRun?: boolean; scenariosOnly?: boolean; framework?: string }) => {
    const spinner = ora(`Generating tests for ${id}...`).start();
    
    try {
      // Validate spec ID format
      validateSpecId(id);

      const config = await loadConfig();
      const workflow = new Workflow();
      const tracker = new ProjectTracker(process.cwd());
      
      // Use specified framework or fall back to config
      const framework = options.framework || config.testFramework;
      
      // Load existing specs from disk
      await tracker.loadSpecsIntoWorkflow(workflow);
      
      // Read spec file to extract scenarios
      const specPath = join('specs', 'active', `${id}.md`);
      let specContent: string;
      try {
        specContent = await readFile(specPath, 'utf-8');
      } catch {
        throw new Error(`Spec file not found: ${specPath}`);
      }
      
      spinner.stop();
      
      // Parse scenarios from spec
      const parser = new ScenarioParser();
      let scenarios = parser.parseScenarios(specContent);
      
      // Also parse requirements
      let requirements = parser.parseRequirements(specContent);
      
      // Fall back to basic table parsing if ScenarioParser finds nothing
      if (requirements.length === 0) {
        const reqMatch = specContent.match(/###\s+Functional\s+Requirements[\s\S]*?(?=###|$)/i);
        if (reqMatch) {
          const rows = reqMatch[0].match(/\|\s*FR-\d+\s*\|[^|]+\|/g);
          if (rows) {
            requirements = rows.map(row => ({
              id: row.match(/FR-\d+/)?.[0] || 'REQ-1',
              text: row.split('|')[2]?.trim() || 'Requirement',
              priority: 'P1' as const,
              scenarios: []
            }));
          }
        }
      }

      // Parse manual scenarios from markdown
      if (scenarios.length === 0) {
        const scenarioMatches = specContent.matchAll(
          /###\s*Scenario\s*\d*:?\s*(.+?)\n[\s\S]*?\*\*Given\*\*\s*(.+?)\n[\s\S]*?\*\*When\*\*\s*(.+?)\n[\s\S]*?\*\*Then\*\*\s*(.+?)(?=\n###|$)/gi
        );
        
        for (const match of scenarioMatches) {
          scenarios.push({
            id: `SC-${scenarios.length + 1}`,
            given: match[2].trim(),
            when: match[3].trim(),
            then: match[4].trim()
          });
        }
      }
      
      // Ensure spec exists in workflow
      let spec = workflow.getSpec(id);
      if (!spec) {
        throw new Error(`Spec '${id}' not found in project state. Run 'specsafe spec ${id}' first.`);
      }
      
      // Update spec with parsed requirements
      spec.requirements = requirements;
      
      // Add scenarios to requirements
      if (scenarios.length > 0 && spec.requirements.length > 0) {
        // Distribute scenarios across requirements
        scenarios.forEach((scenario: any, index: number) => {
          const reqIndex = index % spec.requirements.length;
          spec.requirements[reqIndex].scenarios.push(scenario);
        });
      }

      // Display what we found
      console.log(chalk.blue(`\n📋 Found in spec:`));
      console.log(chalk.gray(`   ${requirements.length} requirements`));
      console.log(chalk.gray(`   ${scenarios.length} scenarios`));

      // Move to test stage (validates requirements exist)
      try {
        workflow.moveToTest(id);
      } catch (moveError: any) {
        if (moveError.message.includes('not found')) {
          throw new Error(`Spec '${id}' not found in project state. Run 'specsafe spec ${id}' first.`);
        }
        if (moveError.message.includes('Must be in SPEC stage')) {
          // Spec might already be in test stage or beyond, that's okay
          console.log(chalk.gray(`   Note: Spec is already in ${spec.stage.toUpperCase()} stage`));
        }
        if (moveError.message.includes('No requirements defined')) {
          throw new Error(`Spec '${id}' has no requirements defined. Add requirements to the spec file first.`);
        }
      }

      // Generate test code using the actual spec object
      spinner.start('Generating test code...');
      
      const generator = new TypeScriptTestGenerator({
        framework: framework as any
      });
      
      const testCode = generator.generate(spec);
      
      // Determine test file path
      const testFileName = `${id.toLowerCase().replace(/-/g, '_')}.test.ts`;
      const testPath = join('tests', testFileName);
      
      // Check if test file already exists
      let shouldOverwrite = true;
      try {
        await access(testPath);
        spinner.stop();
        shouldOverwrite = await confirm({
          message: `Test file ${testPath} already exists. Overwrite?`,
          default: false
        });
        spinner.start();
      } catch {
        // File doesn't exist, proceed
      }

      // Handle dry-run mode
      if (options.dryRun) {
        spinner.stop();
        console.log(chalk.cyan('\n[DRY RUN] Would generate the following test file:\n'));
        console.log(chalk.cyan(`  ${testPath}`));
        console.log(chalk.cyan(`\nTest code preview (first 30 lines):\n`));
        const previewLines = testCode.split('\n').slice(0, 30).join('\n');
        console.log(chalk.gray(previewLines));
        if (testCode.split('\n').length > 30) {
          console.log(chalk.gray('  ... (truncated)'));
        }
        console.log(chalk.cyan(`\nFramework: ${framework}`));
        console.log(chalk.cyan(`Requirements: ${requirements.length}`));
        console.log(chalk.cyan(`Scenarios: ${scenarios.length}`));
        console.log(chalk.cyan(`Would update PROJECT_STATE.md for spec: ${id}`));
        process.exit(0);
      }

      if (!shouldOverwrite) {
        console.log(chalk.yellow('\nSkipped: Test file not modified'));
        return;
      }

      // Write test file
      await mkdir('tests', { recursive: true });
      await writeFile(testPath, testCode);
      
      // Update spec with test file reference
      if (!spec.testFiles.includes(testPath)) {
        spec.testFiles.push(testPath);
      }
      
      // Persist state
      await tracker.addSpec(spec);
      
      spinner.succeed(chalk.green(`Generated tests for ${id}`));
      
      console.log(chalk.blue(`\n  Test file: ${testPath}`));
      console.log(chalk.blue(`  Framework: ${framework}`));
      console.log(chalk.blue(`  Requirements: ${requirements.length}`));
      console.log(chalk.blue(`  Scenarios: ${scenarios.length}`));
      
      console.log(chalk.gray('\n  Next steps:'));
      console.log(chalk.gray(`    1. Review and customize tests in ${testPath}`));
      console.log(chalk.gray(`    2. Run: specsafe code ${id}  → Start implementation`));
      console.log(chalk.gray(`    3. Run: specsafe verify ${id} → Verify against tests`));
      
    } catch (error: any) {
      spinner.fail(chalk.red(error.message));
      if (error.message.includes('not found in project state') || error.message.includes('Run \'specsafe spec\'')) {
        console.log(chalk.gray(`💡 Tip: Run 'specsafe spec ${id}' to validate the spec first.`));
      } else if (error.message.includes('no requirements defined')) {
        console.log(chalk.gray(`💡 Tip: Add requirements to specs/active/${id}.md before generating tests.`));
      } else if (error.message.includes('Spec file not found')) {
        console.log(chalk.gray(`💡 Tip: Run 'specsafe new <name>' to create a spec first.`));
        console.log(chalk.gray(`   Expected file: specs/active/${id}.md`));
      }
      process.exit(1);
    }
  });
