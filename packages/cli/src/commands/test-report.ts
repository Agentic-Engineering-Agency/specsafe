import { Command } from 'commander';
import chalk from 'chalk';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import type { TestReport } from '@specsafe/core';

function validateSpecId(specId: string): string {
  if (!/^[A-Za-z0-9_-]+$/.test(specId)) {
    throw new Error('Invalid spec ID. Use only letters, numbers, dash, and underscore.');
  }
  return specId;
}

export const testReportCommand = new Command('test-report')
  .description('View E2E test report for a spec')
  .argument('<spec>', 'Spec ID')
  .option('-l, --latest', 'Show only the latest report', true)
  .option('--json', 'Output as JSON')
  .option('--all', 'Show all reports for this spec')
  .action(async (specId: string, options: { 
    latest?: boolean;
    json?: boolean;
    all?: boolean;
  }) => {
    try {
      specId = validateSpecId(specId);
      const reportsDir = join('.specsafe', 'e2e', 'reports');

      if (!existsSync(reportsDir)) {
        console.log(chalk.yellow('\n⚠️  No reports directory found.'));
        console.log(chalk.gray('   Run tests first: specsafe test-submit ' + specId + ' --screenshots ./screenshots/'));
        return;
      }

      // Find reports for this spec
      const files = await readdir(reportsDir);
      const reportFiles = files.filter(f => 
        f.startsWith(specId) && f.endsWith('.json')
      );

      if (reportFiles.length === 0) {
        console.log(chalk.yellow(`\n⚠️  No reports found for spec: ${specId}`));
        console.log(chalk.gray('   Run tests first: specsafe test-submit ' + specId + ' --screenshots ./screenshots/'));
        return;
      }

      // Sort by modification time (latest first)
      const reportsWithStats = await Promise.all(
        reportFiles.map(async (filename) => {
          const path = join(reportsDir, filename);
          const content = await readFile(path, 'utf-8');
          const report: TestReport = JSON.parse(content);
          return { filename, report, path };
        })
      );

      reportsWithStats.sort((a, b) => 
        new Date(b.report.createdAt).getTime() - new Date(a.report.createdAt).getTime()
      );

      if (options.all) {
        // Show list of all reports
        console.log(chalk.blue(`\n📊 Test Reports for ${specId}\n`));
        console.log(`Found ${reportsWithStats.length} report(s):\n`);

        for (let i = 0; i < reportsWithStats.length; i++) {
          const { report, filename } = reportsWithStats[i];
          const date = new Date(report.createdAt).toLocaleString();
          const passRate = (report.summary.passRate * 100).toFixed(1);
          
          const statusColor = report.summary.passRate === 1 ? chalk.green :
                             report.summary.passRate >= 0.8 ? chalk.yellow :
                             chalk.red;
          
          console.log(`${i + 1}. ${filename}`);
          console.log(`   Date: ${date}`);
          console.log(`   Pass Rate: ${statusColor(passRate + '%')}`);
          console.log(`   Steps: ${report.summary.passed}/${report.summary.totalSteps} passed`);
          if (report.summary.failed > 0) {
            console.log(chalk.red(`   Failed: ${report.summary.failed}`));
          }
          console.log();
        }

        console.log(chalk.gray('Use --latest to see the most recent report in detail.'));
        return;
      }

      // Show latest report
      const { report } = reportsWithStats[0];

      if (options.json) {
        console.log(JSON.stringify(report, null, 2));
        return;
      }

      // Display formatted report
      displayReport(report);

    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

/**
 * Display a formatted test report
 */
function displayReport(report: TestReport): void {
  const { summary } = report;

  // Header
  console.log(chalk.blue('\n┌─────────────────────────────────────────────────────────────┐'));
  console.log(chalk.blue('│                    E2E Test Report                          │'));
  console.log(chalk.blue('└─────────────────────────────────────────────────────────────┘\n'));

  console.log(chalk.bold(`Spec ID: ${report.specId}`));
  console.log(chalk.gray(`Report ID: ${report.reportId}`));
  console.log(chalk.gray(`Submitted By: ${report.submittedBy}`));
  console.log(chalk.gray(`Generated: ${new Date(report.createdAt).toLocaleString()}`));
  console.log();

  // Summary Box
  const passRatePercent = (summary.passRate * 100).toFixed(1);
  const passRateColor = summary.passRate === 1 ? chalk.green :
                       summary.passRate >= 0.8 ? chalk.yellow :
                       chalk.red;

  console.log(chalk.bold('📊 Summary\n'));
  console.log(`  Total Scenarios: ${summary.totalScenarios}`);
  console.log(`  Total Steps: ${summary.totalSteps}`);
  console.log();
  console.log(`  ${chalk.green('✅ Passed:')}    ${summary.passed.toString().padStart(3)}`);
  console.log(`  ${chalk.red('❌ Failed:')}    ${summary.failed.toString().padStart(3)}`);
  console.log(`  ${chalk.yellow('⚠️  Partial:')}  ${summary.partial.toString().padStart(3)}`);
  console.log(`  ${chalk.gray('⏭️  Skipped:')}  ${summary.skipped.toString().padStart(3)}`);
  console.log();
  console.log(`  Pass Rate: ${passRateColor(passRatePercent + '%')}`);
  console.log();

  // Issues
  if (summary.criticalIssues > 0 || summary.highIssues > 0 || 
      summary.mediumIssues > 0 || summary.lowIssues > 0) {
    console.log(chalk.bold('🚨 Issues Found\n'));
    
    if (summary.criticalIssues > 0) {
      console.log(chalk.red(`  🔴 Critical: ${summary.criticalIssues}`));
    }
    if (summary.highIssues > 0) {
      console.log(chalk.red(`  🟠 High: ${summary.highIssues}`));
    }
    if (summary.mediumIssues > 0) {
      console.log(chalk.yellow(`  🟡 Medium: ${summary.mediumIssues}`));
    }
    if (summary.lowIssues > 0) {
      console.log(chalk.gray(`  🟢 Low: ${summary.lowIssues}`));
    }
    console.log();
  }

  // Recommendations
  if (report.recommendations && report.recommendations.length > 0) {
    console.log(chalk.bold('💡 Recommendations\n'));
    for (const rec of report.recommendations) {
      console.log(`  ${rec}`);
    }
    console.log();
  }

  // Detailed Results
  console.log(chalk.bold('📝 Detailed Results\n'));

  // Group results by scenario
  const resultsByScenario = new Map<string, typeof report.results>();
  for (const result of report.results) {
    if (!resultsByScenario.has(result.scenarioId)) {
      resultsByScenario.set(result.scenarioId, []);
    }
    resultsByScenario.get(result.scenarioId)!.push(result);
  }

  for (const [scenarioId, results] of resultsByScenario) {
    console.log(chalk.cyan(`  Scenario: ${scenarioId}`));
    
    for (const result of results) {
      const icon = result.status === 'pass' ? chalk.green('✅') :
                   result.status === 'fail' ? chalk.red('❌') :
                   result.status === 'partial' ? chalk.yellow('⚠️') : chalk.gray('⏭️');
      
      console.log(`    ${icon} Step ${result.stepId}: ${result.analysis.substring(0, 60)}${result.analysis.length > 60 ? '...' : ''}`);
      
      if (result.issues.length > 0) {
        for (const issue of result.issues) {
          const severityColor = issue.severity === 'critical' ? chalk.red :
                               issue.severity === 'high' ? chalk.red :
                               issue.severity === 'medium' ? chalk.yellow : chalk.gray;
          console.log(severityColor(`      • ${issue.severity.toUpperCase()}: ${issue.description}`));
        }
      }
    }
    console.log();
  }

  // Fix Suggestions
  if (report.fixSuggestions && report.fixSuggestions.length > 0) {
    console.log(chalk.bold('🔧 Suggested Fixes\n'));
    
    for (const fix of report.fixSuggestions.slice(0, 5)) { // Show first 5
      const priorityColor = fix.priority === 'P0' ? chalk.red :
                           fix.priority === 'P1' ? chalk.yellow : chalk.gray;
      
      console.log(`  ${priorityColor(`[${fix.priority}]`)} ${fix.scenarioId} - ${fix.stepId}`);
      console.log(`    Issue: ${fix.issue}`);
      console.log(`    Fix: ${fix.suggestion}`);
      console.log();
    }

    if (report.fixSuggestions.length > 5) {
      console.log(chalk.gray(`  ... and ${report.fixSuggestions.length - 5} more suggestions`));
      console.log();
    }
  }

  // Footer
  console.log(chalk.gray('─'.repeat(60)));
  
  if (summary.passRate === 1) {
    console.log(chalk.green('\n  🎉 All tests passed!'));
  } else if (summary.passRate >= 0.8) {
    console.log(chalk.yellow('\n  ⚠️  Most tests passed. Review the failures above.'));
  } else {
    console.log(chalk.red('\n  ❌ Significant issues found. Please fix and re-test.'));
  }

  // Location of full report
  const markdownPath = join('.specsafe', 'e2e', 'reports', `${report.specId}-report.md`);
  console.log(chalk.gray(`\n  Full report: ${markdownPath}`));
  console.log();
}
