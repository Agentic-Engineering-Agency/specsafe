import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { Workflow, ProjectTracker, validateSpecId } from '@specsafe/core';
import { rename, readFile, access, mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import type { QAReport } from '@specsafe/core';
import { confirm } from '@inquirer/prompts';

export const doneCommand = new Command('done')
  .description('Complete spec and archive (QA → COMPLETE → ARCHIVE)')
  .argument('<id>', 'Spec ID')
  .option('-r, --report <path>', 'Path to QA report')
  .option('-n, --dry-run', 'Preview changes without writing files')
  .option('--skip-archive', 'Keep in completed folder (do not archive)')
  .action(async (id: string, options: { report?: string; dryRun?: boolean; skipArchive?: boolean }) => {
    const spinner = ora(`Completing ${id}...`).start();
    
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

      // Load QA report from file if provided
      let qaReport: QAReport;
      if (options.report) {
        const reportContent = await readFile(options.report, 'utf-8');
        const parsedReport = JSON.parse(reportContent);
        
        // Validate required fields
        const requiredFields = ['id', 'specId', 'timestamp', 'recommendation', 'testResults', 'coverage', 'issues'];
        const missingFields = requiredFields.filter(field => !(field in parsedReport));
        if (missingFields.length > 0) {
          throw new Error(`Invalid QA report: missing required fields: ${missingFields.join(', ')}`);
        }
        
        // Validate recommendation value
        if (parsedReport.recommendation !== 'GO' && parsedReport.recommendation !== 'NO-GO') {
          throw new Error(`Invalid QA report: recommendation must be 'GO' or 'NO-GO', got '${parsedReport.recommendation}'`);
        }
        
        qaReport = parsedReport as QAReport;
        // Convert timestamp from ISO string to Date object (JSON.parse produces strings)
        if (typeof qaReport.timestamp === 'string') {
          qaReport.timestamp = new Date(qaReport.timestamp);
        }
      } else {
        // Default QA report
        qaReport = {
          id: `QA-${id}`,
          specId: id,
          timestamp: new Date(),
          testResults: [],
          coverage: { statements: 100, branches: 100, functions: 100, lines: 100 },
          recommendation: 'GO' as const,
          issues: [],
          notes: 'All tests passing'
        };
      }

      // Validate QA report
      if (qaReport.specId !== id) {
        throw new Error(`QA report spec ID (${qaReport.specId}) does not match target spec (${id})`);
      }
      if (qaReport.recommendation !== 'GO') {
        throw new Error('Cannot complete: QA report recommends NO-GO. Address issues first.');
      }

      // Validate required fields are present
      const requiredFields = ['id', 'specId', 'timestamp', 'recommendation', 'testResults', 'coverage', 'issues', 'notes'];
      const missingFields = requiredFields.filter(field => !(field in qaReport));
      if (missingFields.length > 0) {
        throw new Error(`QA report is missing required fields: ${missingFields.join(', ')}`);
      }

      // Check current stage
      if (spec.stage !== 'qa') {
        throw new Error(`Spec '${id}' is in ${spec.stage.toUpperCase()} stage. Must be in QA stage to complete.`);
      }

      const sourcePath = join('specs', 'active', `${id}.md`);
      const completedPath = join('specs', 'completed', `${id}.md`);
      const archivePath = join('specs', 'archive', `${id}.md`);

      // Handle dry-run mode
      if (options.dryRun) {
        spinner.stop();
        console.log(chalk.cyan('[DRY RUN] Would perform the following actions:\n'));
        console.log(chalk.cyan('  State transition:'));
        console.log(chalk.gray(`    QA → COMPLETE`));
        if (!options.skipArchive) {
          console.log(chalk.gray(`    COMPLETE → ARCHIVE`));
        }
        console.log(chalk.cyan(`\n  File operations:`));
        console.log(chalk.gray(`    ${sourcePath} → ${completedPath}`));
        if (!options.skipArchive) {
          console.log(chalk.gray(`    ${completedPath} → ${archivePath}`));
        }
        console.log(chalk.cyan(`\n  QA Report:`));
        console.log(chalk.gray(`    ID: ${qaReport.id}`));
        console.log(chalk.gray(`    Recommendation: ${qaReport.recommendation}`));
        console.log(chalk.gray(`    Coverage: ${JSON.stringify(qaReport.coverage)}`));
        console.log(chalk.cyan(`\n  Would update PROJECT_STATE.md for spec: ${id}`));
        process.exit(0);
      }

      // Confirmation if not using default QA report
      if (!options.report) {
        spinner.stop();
        const confirmed = await confirm({
          message: `No QA report provided. Mark ${id} as complete anyway?`,
          default: false
        });
        if (!confirmed) {
          console.log(chalk.gray('Run specsafe qa first to generate a proper QA report.'));
          process.exit(0);
        }
        spinner.start('Completing spec...');
      }

      // Move file to completed FIRST
      try {
        await access(sourcePath);
        await mkdir('specs/completed', { recursive: true });
        await rename(sourcePath, completedPath);
      } catch (renameError: any) {
        if (renameError.code === 'ENOENT') {
          spinner.text = `Source file not found at ${sourcePath}, checking completed folder...`;
          // Check if already in completed
          try {
            await access(completedPath);
            spinner.text = `Spec already in completed folder.`;
          } catch {
            throw new Error(`Spec file not found in active or completed folders.`);
          }
        } else {
          throw new Error(`Failed to move spec file: ${renameError.message}`);
        }
      }

      // Now update workflow state and persist
      try {
        workflow.moveToComplete(id, qaReport);
      } catch (moveError: any) {
        if (moveError.message.includes('not found')) {
          throw new Error(`Spec '${id}' not found. Run 'specsafe spec ${id}' to create it first.`);
        }
        if (moveError.message.includes('Must be in QA stage')) {
          throw new Error(`Spec '${id}' is not in QA stage. Run 'specsafe qa ${id}' first.`);
        }
        if (moveError.message.includes('NO-GO')) {
          throw new Error(`Cannot complete: QA report recommends NO-GO. Fix issues and re-run 'specsafe qa ${id}' first.`);
        }
        throw moveError;
      }
      
      // Persist state
      await tracker.addSpec(workflow.getSpec(id)!);

      spinner.succeed(chalk.green(`✅ Completed ${id}`));
      console.log(chalk.blue(`  Moved to: specs/completed/`));
      console.log(chalk.green(`  Ready for production!`));

      // Optionally archive
      if (!options.skipArchive) {
        try {
          await mkdir('specs/archive', { recursive: true });
          await rename(completedPath, archivePath);
          
          // Update state to archived
          workflow.archiveSpec(id);
          await tracker.addSpec(workflow.getSpec(id)!);
          
          console.log(chalk.blue(`  Archived to: specs/archive/`));
        } catch (archiveError: any) {
          console.log(chalk.yellow(`  ⚠️  Could not archive: ${archiveError.message}`));
        }
      }

      // Generate completion summary
      const summary = generateCompletionSummary(id, qaReport, spec);
      console.log(chalk.blue('\n  Completion Summary:'));
      console.log(chalk.gray(`    Duration: ${calculateDuration(spec)}`));
      console.log(chalk.gray(`    Test Coverage: ${qaReport.coverage.statements}% statements`));
      console.log(chalk.gray(`    Issues Found: ${qaReport.issues.length}`));

      console.log(chalk.blue('\n  Next:'));
      console.log(chalk.gray(`    • Consider updating documentation`));
      console.log(chalk.gray(`    • Announce completion to team`));
      console.log(chalk.gray(`    • Create a new spec: specsafe new <feature>`));

    } catch (error: any) {
      spinner.fail(chalk.red(error.message));
      if (error.message.includes('not in QA stage') || error.message.includes('Run \'specsafe qa\'')) {
        console.log(chalk.gray(`💡 Tip: Run 'specsafe qa ${id}' to run QA validation first.`));
      } else if (error.message.includes('NO-GO')) {
        console.log(chalk.gray(`💡 Tip: Fix the failing tests and re-run 'specsafe qa ${id}' before completing.`));
      } else if (error.message.includes('not found')) {
        console.log(chalk.gray(`💡 Tip: Run 'specsafe new <name>' to create a spec first.`));
      } else if (error.message.includes('QA report')) {
        console.log(chalk.gray(`💡 Tip: Run 'specsafe qa ${id}' to generate a QA report first.`));
      }
      process.exit(1);
    }
  });

function generateCompletionSummary(id: string, qaReport: QAReport, spec: any): string {
  const lines = [
    `# Completion Summary: ${id}`,
    '',
    `**Completed:** ${new Date().toISOString()}`,
    `**QA Report:** ${qaReport.id}`,
    `**Recommendation:** ${qaReport.recommendation}`,
    '',
    '## Coverage',
    `- Statements: ${qaReport.coverage.statements}%`,
    `- Branches: ${qaReport.coverage.branches}%`,
    `- Functions: ${qaReport.coverage.functions}%`,
    `- Lines: ${qaReport.coverage.lines}%`,
    '',
    '## Issues',
    qaReport.issues.length > 0 
      ? qaReport.issues.map((i: any) => `- ${i.severity}: ${i.description}`).join('\n')
      : '- No issues found',
    '',
    '## Notes',
    qaReport.notes
  ];
  
  return lines.join('\n');
}

function calculateDuration(spec: any): string {
  if (!spec.createdAt) return 'Unknown';
  
  const start = new Date(spec.createdAt).getTime();
  const end = Date.now();
  const diff = end - start;
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  return `${hours}h`;
}
