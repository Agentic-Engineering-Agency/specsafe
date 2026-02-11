import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { Workflow, ProjectTracker } from '@specsafe/core';
import { readFile } from 'fs/promises';
import { join, basename } from 'path';

export const specCommand = new Command('spec')
  .description('Validate spec requirements and move to SPEC stage')
  .argument('<id>', 'Spec ID')
  .action(async (id: string) => {
    const spinner = ora(`Validating ${id} requirements...`).start();
    
    try {
      const workflow = new Workflow();
      const tracker = new ProjectTracker(process.cwd());
      
      // Load existing specs from disk
      await tracker.loadSpecsIntoWorkflow(workflow);
      
      // Check if spec exists
      let spec = workflow.getSpec(id);
      
      if (!spec) {
        // Try to load from file
        try {
          const specPath = join('specs/active', `${id}.md`);
          const content = await readFile(specPath, 'utf-8');
          
          // Extract name from content (first heading)
          const nameMatch = content.match(/^#\s+(.+?)\s+Specification/m);
          const name = nameMatch ? nameMatch[1] : id;
          
          // Create spec in workflow
          spec = workflow.createSpec(
            id,
            name,
            `Spec loaded from ${specPath}`,
            'developer',
            basename(process.cwd())
          );
          
          // Parse requirements from content
          const reqMatch = content.match(/###\s+Functional\s+Requirements[\s\S]*?(?=###|$)/i);
          if (reqMatch) {
            // Extract requirement rows from table
            const rows = reqMatch[0].match(/\|\s*FR-\d+\s*\|[^|]+\|/g);
            if (rows && rows.length > 0) {
              spec.requirements = rows.map(row => ({
                id: row.match(/FR-\d+/)?.[0] || 'REQ-1',
                text: row.split('|')[2]?.trim() || 'Requirement',
                priority: 'P0' as const,
                scenarios: []
              }));
            }
          }
          
          await tracker.addSpec(spec);
        } catch (fileError) {
          throw new Error(`Spec ${id} not found. Run 'specsafe new <name>' to create it first.`);
        }
      }
      
      // Validate requirements are defined
      if (spec.requirements.length === 0) {
        spinner.warn(chalk.yellow(`${id} has no requirements defined yet`));
        console.log(chalk.blue('Add requirements to the spec file before moving to TEST stage'));
      } else {
        spinner.succeed(chalk.green(`${id} validated: ${spec.requirements.length} requirements defined`));
      }
      
      console.log(chalk.blue('Next: Run specsafe test <id> to generate tests'));
    } catch (error: any) {
      spinner.fail(chalk.red(error.message));
      process.exit(1);
    }
  });