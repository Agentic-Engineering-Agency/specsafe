import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { Workflow } from '@specsafe/core';
import { ProjectTracker } from '@specsafe/core';
import { TypeScriptTestGenerator } from '@specsafe/test-gen';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { readFile } from 'fs/promises';

export const testCommand = new Command('test')
  .description('Generate tests from spec (SPEC → TEST)')
  .argument('<id>', 'Spec ID')
  .action(async (id: string) => {
    const spinner = ora(`Generating tests for ${id}...`).start();
    
    try {
      const workflow = new Workflow();
      const tracker = new ProjectTracker(process.cwd());
      
      // Load existing specs from disk
      await tracker.loadSpecsIntoWorkflow(workflow);
      
      // Read spec file to extract scenarios
      const specPath = join('specs/active', `${id}.md`);
      let specContent: string;
      try {
        specContent = await readFile(specPath, 'utf-8');
      } catch {
        throw new Error(`Spec file not found: ${specPath}`);
      }
      
      // Parse requirements from spec
      const reqMatch = specContent.match(/###\s+Functional\s+Requirements[\s\S]*?(?=###|$)/i);
      let requirements: any[] = [];
      if (reqMatch) {
        const rows = reqMatch[0].match(/\|\s*FR-\d+\s*\|[^|]+\|/g);
        if (rows) {
          requirements = rows.map(row => ({
            id: row.match(/FR-\d+/)?.[0] || 'REQ-1',
            description: row.split('|')[2]?.trim() || 'Requirement',
            priority: 'P0' as const,
            acceptanceCriteria: []
          }));
        }
      }
      
      // Update spec with requirements
      const spec = workflow.getSpec(id);
      if (spec) {
        spec.requirements = requirements;
      }
      
      // Move to test stage
      workflow.moveToTest(id);
      
      // Generate test files
      const generator = new TypeScriptTestGenerator({
        framework: 'vitest',
        outputDir: 'tests'
      });
      
      // Parse scenarios from spec
      const scenarios = generator.parseScenarios(specContent);
      
      // Generate test code
      const testCode = generator.generate({
        id,
        name: id,
        description: `Tests for ${id}`,
        stage: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
        requirements,
        scenarios: scenarios || [],
        testFiles: [],
        implementationFiles: [],
        metadata: {}
      });
      
      // Write test file
      await mkdir('tests', { recursive: true });
      const testPath = join('tests', `${id.toLowerCase().replace(/-/g, '_')}.test.ts`);
      await writeFile(testPath, testCode);
      
      // Update spec with test file
      const updatedSpec = workflow.getSpec(id);
      if (updatedSpec) {
        updatedSpec.testFiles.push(testPath);
      }
      
      // Persist state
      await tracker.addSpec(workflow.getSpec(id)!);
      
      spinner.succeed(chalk.green(`Generated tests for ${id}`));
      console.log(chalk.blue(`  Test file: ${testPath}`));
      console.log(chalk.blue('Next: Run specsafe code <id> to start implementation'));
    } catch (error: any) {
      spinner.fail(chalk.red(error.message));
      process.exit(1);
    }
  });