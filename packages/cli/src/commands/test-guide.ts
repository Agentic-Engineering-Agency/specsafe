import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import {
  Workflow,
  ProjectTracker,
  generateGuide,
  formatGuideAsMarkdown,
  formatGuideAsJSON,
  generateGuideContent,
  convertToPlaywrightScenarios,
  generatePlaywrightScript,
} from '@specsafe/core';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname, normalize, isAbsolute } from 'path';

function validateSpecInput(specInput: string): string {
  if (specInput.endsWith('.md')) return specInput;
  if (!/^[A-Za-z0-9_-]+$/.test(specInput)) {
    throw new Error('Invalid spec identifier. Use only letters, numbers, dash, and underscore.');
  }
  return specInput;
}

function sanitizeOutputPath(outputPath: string): string {
  const normalized = normalize(outputPath);
  if (isAbsolute(normalized) || normalized.includes('..')) {
    throw new Error('Output path must be a safe relative path');
  }
  return normalized;
}

export const testGuideCommand = new Command('test-guide')
  .description('Generate E2E test guide from spec')
  .argument('<spec>', 'Spec ID or path to spec file')
  .option('-o, --output <file>', 'Output file path')
  .option('--format <format>', 'Output format (markdown|json)', 'markdown')
  .option('--mode <mode>', 'Automation mode (manual|playwright)', 'manual')
  .option('--auto', 'Generate Playwright script output')
  .option('--priority <priorities...>', 'Filter by priority (P0 P1 P2)', ['P0', 'P1', 'P2'])
  .action(async (specInput: string, options: {
    output?: string;
    format?: string;
    mode?: 'manual' | 'playwright';
    auto?: boolean;
    priority?: string[];
  }) => {
    const spinner = ora('Generating test guide...').start();

    try {
      specInput = validateSpecInput(specInput);

      const workflow = new Workflow();
      const tracker = new ProjectTracker(process.cwd());
      await tracker.loadSpecsIntoWorkflow(workflow);

      let specId: string;
      let specContent: string;
      let specPath: string;

      if (specInput.endsWith('.md')) {
        specPath = specInput;
        try {
          specContent = await readFile(specPath, 'utf-8');
          specId = specInput.split('/').pop()!.replace('.md', '');
        } catch {
          throw new Error(`Spec file not found: ${specPath}`);
        }
      } else {
        specId = specInput;
        specPath = join('specs/active', `${specId}.md`);
        try {
          specContent = await readFile(specPath, 'utf-8');
        } catch {
          throw new Error(`Spec file not found: ${specPath}`);
        }
      }

      let spec = workflow.getSpec(specId);
      if (!spec) spec = parseSpecFromContent(specId, specContent);

      spinner.text = 'Generating test content...';

      const priorityFilter = options.priority as ('P0' | 'P1' | 'P2')[];
      const mode = options.auto ? 'playwright' : (options.mode ?? 'manual');

      const guide = generateGuide(spec, {
        priorityFilter,
        format: options.format as 'markdown' | 'json',
        mode,
      });

      let output: string;
      let outputFormat: 'md' | 'json' | 'js';

      if (options.auto) {
        const scenarios = convertToPlaywrightScenarios(guide);
        output = generatePlaywrightScript(spec.id, scenarios);
        outputFormat = 'js';
      } else {
        const result = generateGuideContent(spec, {
          priorityFilter,
          format: options.format as 'markdown' | 'json',
          mode,
        });
        output = result.content;
        outputFormat = result.format === 'markdown' ? 'md' : result.format;
      }

      spinner.stop();

      let outputPath: string;
      if (options.output) {
        outputPath = sanitizeOutputPath(options.output);
      } else {
        const guidesDir = join('.specsafe', 'e2e', 'guides');
        await mkdir(guidesDir, { recursive: true });
        const extension = outputFormat;
        outputPath = join(guidesDir, `test-guide-${specId}.${extension}`);
      }

      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, output, 'utf-8');

      console.log(chalk.green(`\n✅ Test guide generated: ${outputPath}`));
      console.log(chalk.blue('\nGuide Summary:'));
      console.log(`  Mode: ${mode}`);
      console.log(`  Scenarios: ${guide.scenarios.length}`);
      console.log(`  Steps: ${guide.scenarios.reduce((sum, s) => sum + s.steps.length, 0)}`);
      console.log(`  P0 (Critical): ${guide.scenarios.filter(s => s.priority === 'P0').length}`);
      console.log(`  P1 (High): ${guide.scenarios.filter(s => s.priority === 'P1').length}`);
      console.log(`  P2 (Normal): ${guide.scenarios.filter(s => s.priority === 'P2').length}`);

      console.log(chalk.blue('\nNext steps:'));
      if (mode === 'playwright') {
        console.log(chalk.gray(`  1. Run generated script with: npx playwright test ${outputPath}`));
        console.log(chalk.gray('  2. Review screenshots captured at configured intervals'));
        console.log(chalk.gray('  3. Validate assertions and adjust selectors as needed'));
      } else {
        console.log(chalk.gray(`  1. Review the test guide: ${outputPath}`));
        console.log(chalk.gray('  2. Execute test scenarios manually'));
        console.log(chalk.gray('  3. Take screenshots at key steps'));
        console.log(chalk.gray(`  4. Submit for analysis: specsafe test-submit ${specId} --screenshots ./my-screenshots/`));
      }
    } catch (error: any) {
      spinner.fail(chalk.red(error.message));
      if (error.message.includes('not found')) {
        console.log(chalk.gray(`\n💡 Tip: Create a spec first with 'specsafe new <name>'`));
      }
      process.exit(1);
    }
  });

function parseSpecFromContent(specId: string, content: string) {
  const safeContent = content.slice(0, 500_000);
  const nameMatch = safeContent.match(/^#\s+(.+?)(?:\s+Specification)?$/m);
  const name = nameMatch ? nameMatch[1] : specId;

  const descMatch = safeContent.match(/## Overview\n+([\s\S]*?)(?=##|$)/);
  const description = descMatch ? descMatch[1].trim() : '';

  const requirements: Array<{
    id: string;
    text: string;
    priority: 'P0' | 'P1' | 'P2';
    scenarios: Array<{ id: string; given: string; when: string; thenOutcome: string }>;
  }> = [];

  const tableMatch = safeContent.match(/\| ID \| Requirement \| Priority \|[^|]+\|\n\|[-\s|]+\|\n([\s\S]*?)(?=\n## |\n### |$)/);
  if (tableMatch) {
    const rows = tableMatch[1].trim().split('\n');
    for (const row of rows) {
      const cells = row.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length >= 3) {
        const [id, text, priority] = cells;
        requirements.push({ id, text, priority: (priority as 'P0' | 'P1' | 'P2') || 'P1', scenarios: [] });
      }
    }
  }

  const scenariosMatch = safeContent.match(/## \d+\.\s*Scenarios\n+([\s\S]*?)(?=## \d+\.|$)/);
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
          thenOutcome: thenMatch[1].trim(),
        };

        if (requirements.length > 0) requirements[0].scenarios.push(scenario);
        else requirements.push({ id: 'FR-1', text: 'Generated from scenarios', priority: 'P1', scenarios: [scenario] });
      }
    }
  }

  if (requirements.length === 0) {
    requirements.push({
      id: 'FR-1',
      text: 'Feature implementation matches spec',
      priority: 'P0',
      scenarios: [{ id: 'SC-1', given: 'user accesses the feature', when: 'user interacts with the feature', thenOutcome: 'feature behaves as specified' }],
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
    metadata: { author: 'unknown', project: 'unknown', tags: [] },
  };
}
