import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { Workflow, ProjectTracker, generateGuide, formatGuideAsMarkdown } from '@specsafe/core';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

export const testGuideCommand = new Command('test-guide')
  .description('Generate E2E test guide from spec')
  .argument('<spec>', 'Spec ID or path to spec file')
  .option('-o, --output <file>', 'Output file path')
  .option('--format <format>', 'Output format (markdown|json)', 'markdown')
  .option('--priority <priorities...>', 'Filter by priority (P0 P1 P2)', ['P0', 'P1', 'P2'])
  .action(async (specInput: string, options: { 
    output?: string; 
    format?: string;
    priority?: string[];
  }) => {
    const spinner = ora('Generating test guide...').start();

    try {
      const workflow = new Workflow();
      const tracker = new ProjectTracker(process.cwd());

      // Load existing specs
      await tracker.loadSpecsIntoWorkflow(workflow);

      // Determine spec ID and load spec
      let specId: string;
      let specContent: string;
      let specPath: string;

      if (specInput.endsWith('.md')) {
        // Load from file path
        specPath = specInput;
        try {
          specContent = await readFile(specPath, 'utf-8');
          // Extract spec ID from filename
          const filename = specInput.split('/').pop()!.replace('.md', '');
          specId = filename;
        } catch (error) {
          throw new Error(`Spec file not found: ${specPath}`);
        }
      } else {
        // Load by spec ID
        specId = specInput;
        specPath = join('specs/active', `${specId}.md`);
        try {
          specContent = await readFile(specPath, 'utf-8');
        } catch (error) {
          throw new Error(`Spec file not found: ${specPath}`);
        }
      }

      // Get spec from workflow or create from file
      let spec = workflow.getSpec(specId);
      
      if (!spec) {
        // Parse spec from file content
        spec = parseSpecFromContent(specId, specContent);
      }

      spinner.text = 'Generating test guide...';

      // Generate guide
      const priorityFilter = options.priority as ('P0' | 'P1' | 'P2')[];
      const guide = generateGuide(spec, {
        priorityFilter,
        format: options.format as 'markdown' | 'json'
      });

      // Format output
      const output = formatGuideAsMarkdown(guide);

      spinner.stop();

      // Determine output path
      let outputPath: string;
      if (options.output) {
        outputPath = options.output;
      } else {
        // Default to .specsafe/e2e/guides/
        const guidesDir = join('.specsafe', 'e2e', 'guides');
        await mkdir(guidesDir, { recursive: true });
        outputPath = join(guidesDir, `test-guide-${specId}.md`);
      }

      // Ensure output directory exists
      await mkdir(dirname(outputPath), { recursive: true });

      // Write output
      await writeFile(outputPath, output, 'utf-8');

      console.log(chalk.green(`\n✅ Test guide generated: ${outputPath}`));
      console.log(chalk.blue('\nGuide Summary:'));
      console.log(`  Scenarios: ${guide.scenarios.length}`);
      console.log(`  Steps: ${guide.scenarios.reduce((sum, s) => sum + s.steps.length, 0)}`);
      console.log(`  P0 (Critical): ${guide.scenarios.filter(s => s.priority === 'P0').length}`);
      console.log(`  P1 (High): ${guide.scenarios.filter(s => s.priority === 'P1').length}`);
      console.log(`  P2 (Normal): ${guide.scenarios.filter(s => s.priority === 'P2').length}`);

      console.log(chalk.blue('\nNext steps:'));
      console.log(chalk.gray(`  1. Review the test guide: ${outputPath}`));
      console.log(chalk.gray('  2. Execute test scenarios manually'));
      console.log(chalk.gray('  3. Take screenshots at key steps'));
      console.log(chalk.gray(`  4. Submit for analysis: specsafe test-submit ${specId} --screenshots ./my-screenshots/`));

    } catch (error: any) {
      spinner.fail(chalk.red(error.message));
      if (error.message.includes('not found')) {
        console.log(chalk.gray(`\n💡 Tip: Create a spec first with 'specsafe new <name>'`));
      }
      process.exit(1);
    }
  });

/**
 * Parse spec from markdown content
 */
function parseSpecFromContent(specId: string, content: string) {
  // Extract name from first heading
  const nameMatch = content.match(/^#\s+(.+?)(?:\s+Specification)?$/m);
  const name = nameMatch ? nameMatch[1] : specId;

  // Extract description
  const descMatch = content.match(/## Overview\n+([\s\S]*?)(?=##|$)/);
  const description = descMatch ? descMatch[1].trim() : '';

  // Extract requirements
  const requirements: Array<{
    id: string;
    text: string;
    priority: 'P0' | 'P1' | 'P2';
    scenarios: Array<{ id: string; given: string; when: string; thenOutcome: string }>;
  }> = [];

  // Try to find requirements table
  const tableMatch = content.match(/\| ID \| Requirement \| Priority \|[^|]+\|\n\|[-\s|]+\|\n([\s\S]*?)(?=\n## |\n### |$)/);
  if (tableMatch) {
    const rows = tableMatch[1].trim().split('\n');
    for (const row of rows) {
      const cells = row.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length >= 3) {
        const [id, text, priority] = cells;
        requirements.push({
          id,
          text,
          priority: (priority as 'P0' | 'P1' | 'P2') || 'P1',
          scenarios: []
        });
      }
    }
  }

  // Try to find scenarios section
  const scenariosMatch = content.match(/## \d+\.\s*Scenarios\n+([\s\S]*?)(?=## \d+\.|$)/);
  if (scenariosMatch) {
    const scenarioBlocks = scenariosMatch[1].split(/### Scenario \d+:/);
    for (let i = 0; i < scenarioBlocks.length; i++) {
      const block = scenarioBlocks[i];
      const givenMatch = block.match(/[-*]\s*\*\*Given\*\*\s*(.+)/i);
      const whenMatch = block.match(/[-*]\s*\*\*When\*\*\s*(.+)/i);
      const thenMatch = block.match(/[-*]\s*\*\*Then\*\*\s*(.+)/i);

      if (givenMatch && whenMatch && thenMatch) {
        const scenario = {
          id: `SC-${i + 1}`,
          given: givenMatch[1].trim(),
          when: whenMatch[1].trim(),
          thenOutcome: thenMatch[1].trim()
        };

        // Assign to first requirement or create one
        if (requirements.length > 0) {
          requirements[0].scenarios.push(scenario);
        } else {
          requirements.push({
            id: 'FR-1',
            text: 'Generated from scenarios',
            priority: 'P1',
            scenarios: [scenario]
          });
        }
      }
    }
  }

  // If no requirements found, create default ones
  if (requirements.length === 0) {
    requirements.push({
      id: 'FR-1',
      text: 'Feature implementation matches spec',
      priority: 'P0',
      scenarios: [
        {
          id: 'SC-1',
          given: 'user accesses the feature',
          when: 'user interacts with the feature',
          thenOutcome: 'feature behaves as specified'
        }
      ]
    });
  }

  return {
    id: specId,
    name,
    description,
    stage: 'spec' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    requirements,
    testFiles: [],
    implementationFiles: [],
    metadata: {
      author: 'unknown',
      project: 'unknown',
      tags: []
    }
  };
}
