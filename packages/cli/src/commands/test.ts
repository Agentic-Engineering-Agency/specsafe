import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { Workflow, ProjectTracker, validateSpecId } from '@specsafe/core';
import { TypeScriptTestGenerator, ScenarioParser } from '@specsafe/test-gen';
import { mkdir, writeFile, readFile } from 'fs/promises';
import { join } from 'path';

export const testCommand = new Command('test')
  .description('Generate tests from spec (SPEC → TEST)')
  .argument('<id>', 'Spec ID')
  .action(async (id: string) => {
    // Validate spec ID format
    validateSpecId(id);
    
    const spinner = ora(`Generating tests for ${id}...`).start();
    
    try {
      const workflow = new Workflow();
      const tracker = new ProjectTracker(process.cwd());
      
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
      
      // Use ScenarioParser to extract requirements from spec content
      const parser = new ScenarioParser();
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
              priority: 'P0' as const,
              scenarios: []
            }));
          }
        }
      }
      
      // Ensure spec exists in workflow
      let spec = workflow.getSpec(id);
      if (!spec) {
        throw new Error(`Spec '${id}' not found in project state. Run 'specsafe spec ${id}' first.`);
      }
      
      // Update spec with parsed requirements
      spec.requirements = requirements;
      
      // Also parse inline scenarios from spec content
      const generator = new TypeScriptTestGenerator({
        framework: 'vitest'
      });
      const inlineScenarios = generator.parseScenarios(specContent);
      
      // Add inline scenarios to requirements if they exist and requirements lack scenarios
      if (inlineScenarios.length > 0 && spec.requirements.length > 0) {
        // Distribute scenarios across requirements, or add to first requirement
        const firstReq = spec.requirements[0];
        if (firstReq.scenarios.length === 0) {
          firstReq.scenarios = inlineScenarios;
        }
      }
      
      // Move to test stage (validates requirements exist)
      workflow.moveToTest(id);
      
      // Generate test code using the actual spec object
      const testCode = generator.generate(spec);
      
      // Write test file
      await mkdir('tests', { recursive: true });
      const testPath = join('tests', `${id.toLowerCase().replace(/-/g, '_')}.test.ts`);
      await writeFile(testPath, testCode);
      
      // Update spec with test file reference
      spec.testFiles.push(testPath);
      
      // Persist state
      await tracker.addSpec(spec);
      
      spinner.succeed(chalk.green(`Generated tests for ${id}`));
      console.log(chalk.blue(`  Test file: ${testPath}`));
      console.log(chalk.blue(`  Requirements: ${requirements.length}`));
      console.log(chalk.blue('Next: Run specsafe code <id> to start implementation'));
    } catch (error: any) {
      spinner.fail(chalk.red(error.message));
      process.exit(1);
    }
  });
