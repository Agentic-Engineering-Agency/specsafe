/**
 * Export Command
 * Export specs in multiple formats: markdown, json, html, stakeholder bundles
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { writeFile, mkdir, access } from 'fs/promises';
import { join } from 'path';
import {
  parseSpecFromFile,
  exportSpec,
  generateStakeholderBundle,
  type ExportFormat,
  type ExportResult,
  type ParsedSpec,
  validateFilePath,
  validateOutputPath,
  sanitizeFilename,
  validateExportFormat,
} from '@specsafe/core';

export const exportCommand = new Command('export')
  .description('Export spec in multiple formats')
  .argument('<spec>', 'Spec ID or path to spec file (e.g., SPEC-20260212-001 or specs/active/SPEC-20260212-001.md)')
  .option('-f, --format <format>', 'Export format: markdown, json, html, stakeholder', 'markdown')
  .option('-o, --output <path>', 'Output file or directory')
  .option('--stakeholder', 'Generate all 4 stakeholder bundles')
  .option('--bundle', 'Export all formats as zip (not implemented yet)')
  .option('--no-metadata', 'Exclude metadata from export')
  .option('--include-history', 'Include history in export (JSON only)')
  .action(async (
    specPathOrId: string,
    options: {
      format: ExportFormat;
      output?: string;
      stakeholder?: boolean;
      bundle?: boolean;
      metadata?: boolean;
      includeHistory?: boolean;
    }
  ) => {
    const spinner = ora('Loading spec...').start();

    try {
      // Validate export format
      try {
        validateExportFormat(options.format);
      } catch (error: any) {
        spinner.fail(chalk.red(error.message));
        process.exit(1);
      }

      // Determine spec file path
      let specFilePath = specPathOrId;

      // If it looks like a spec ID, find the file
      if (!specFilePath.includes('/') && !specFilePath.includes('.md')) {
        const specId = specPathOrId.toUpperCase();

        // Try active folder first
        try {
          const activePath = `specs/active/${specId}.md`;
          await access(activePath);
          specFilePath = activePath;
        } catch {
          // Try completed folder
          try {
            const completedPath = `specs/completed/${specId}.md`;
            await access(completedPath);
            specFilePath = completedPath;
          } catch {
            // Try as is (full path)
            specFilePath = `${specPathOrId}.md`;
          }
        }
      }

      spinner.text = 'Parsing spec...';

      // Parse spec from file (with path validation)
      const spec = await parseSpecFromFile(specFilePath);

      spinner.text = 'Generating export...';

      // Handle different export modes
      if (options.stakeholder) {
        await exportStakeholderBundles(spec, options.output);
      } else if (options.bundle) {
        spinner.stop();
        console.log(chalk.yellow('⚠️  Bundle export (zip) is not yet implemented.'));
        console.log(chalk.gray('Use --stakeholder to generate individual bundle files.'));
        console.log(chalk.gray('Or specify --format for single format export.'));
        process.exit(1);
      } else {
        await exportSingleFormat(spec, options.format, options.output, options.metadata !== false, options.includeHistory);
      }

      spinner.succeed(chalk.green('Export completed successfully!'));

    } catch (error: any) {
      spinner.fail(chalk.red(error.message));

      if (error.code === 'ENOENT') {
        console.log(chalk.gray('\n💡 Tip: Make sure the spec file exists.'));
        console.log(chalk.gray('   Example: specsafe export SPEC-20260212-001'));
        console.log(chalk.gray('   Or: specsafe export specs/active/SPEC-20260212-001.md'));
      }

      process.exit(1);
    }
  });

/**
 * Export spec in a single format
 */
async function exportSingleFormat(
  spec: ParsedSpec,
  format: ExportFormat,
  outputPath?: string,
  includeMetadata: boolean = true,
  includeHistory: boolean = false
): Promise<void> {
  const result = exportSpec(spec, format, {
    includeMetadata,
    includeHistory,
  }) as ExportResult;

  // Determine output path with validation
  let finalPath: string;
  if (!outputPath) {
    // Default to current directory with generated filename
    finalPath = result.filename;
  } else {
    // Validate and sanitize the output path
    try {
      finalPath = validateFilePath(outputPath);
    } catch (error: any) {
      throw new Error(`Invalid output path: ${error.message}`);
    }
  }

  // Write the file with error handling
  try {
    await writeFile(finalPath, result.content);
  } catch (error: any) {
    throw new Error(`Failed to write export file: ${error.message}`);
  }

  // Display result info
  console.log(chalk.blue('\n📄 Export Details:'));
  console.log(`  Format: ${chalk.cyan(format.toUpperCase())}`);
  console.log(`  File: ${chalk.cyan(finalPath)}`);
  console.log(`  Size: ${chalk.cyan(formatBytes(result.size))}`);
  console.log();
}

/**
 * Export all stakeholder bundles
 */
async function exportStakeholderBundles(spec: ParsedSpec, outputDir?: string): Promise<void> {
  const bundle = generateStakeholderBundle(spec);

  // Determine output directory with validation
  let dir: string;
  if (outputDir) {
    try {
      dir = validateOutputPath(outputDir);
    } catch (error: any) {
      throw new Error(`Invalid output directory: ${error.message}`);
    }
  } else {
    dir = join(process.cwd(), 'bundles');
  }

  // Create directory if needed with error handling
  try {
    await mkdir(dir, { recursive: true });
  } catch (error: any) {
    throw new Error(`Failed to create output directory: ${error.message}`);
  }

  // Write each bundle file with error handling
  const files = [
    { name: 'Executive Summary', result: bundle.executive },
    { name: 'Technical Specification', result: bundle.technical },
    { name: 'QA Specification', result: bundle.qa },
    { name: 'Design Specification', result: bundle.design },
  ];

  for (const file of files) {
    try {
      const sanitizedFilename = sanitizeFilename(file.result.filename);
      const filePath = join(dir, sanitizedFilename);
      await writeFile(filePath, file.result.content);
      console.log(chalk.cyan(`  ✓ ${file.name}: ${filePath}`));
    } catch (error: any) {
      throw new Error(`Failed to write ${file.name}: ${error.message}`);
    }
  }

  console.log(chalk.blue(`\n📦 Generated ${files.length} stakeholder bundles in: ${dir}`));
  console.log();
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
