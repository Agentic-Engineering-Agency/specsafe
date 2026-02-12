import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { Workflow, ProjectTracker, validateSpecId } from '@specsafe/core';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, access } from 'fs/promises';
import { join } from 'path';
import { loadConfig } from '../config.js';

const execAsync = promisify(exec);

interface TestResult {
  passed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  failures: Array<{
    name: string;
    error: string;
    file?: string;
  }>;
}

export const verifyCommand = new Command('verify')
  .description('Run tests and loop on failure (TEST → CODE loop)')
  .argument('<id>', 'Spec ID')
  .option('-w, --watch', 'Run in watch mode for continuous feedback')
  .option('-u, --update', 'Update snapshots if applicable')
  .option('--ci', 'Run in CI mode (no interactive)')
  .action(async (id: string, options: { watch?: boolean; update?: boolean; ci?: boolean }) => {
    const spinner = ora(`Verifying ${id}...`).start();
    
    try {
      // Validate spec ID format
      validateSpecId(id);

      const workflow = new Workflow();
      const tracker = new ProjectTracker(process.cwd());
      const config = await loadConfig();
      
      // Load existing specs from disk
      await tracker.loadSpecsIntoWorkflow(workflow);
      
      // Check if spec exists
      const spec = workflow.getSpec(id);
      if (!spec) {
        throw new Error(`Spec '${id}' not found. Run 'specsafe new <name>' to create it first.`);
      }

      // Check if spec is in the right stage
      if (spec.stage !== 'test' && spec.stage !== 'code' && spec.stage !== 'qa') {
        throw new Error(`Spec '${id}' is in ${spec.stage.toUpperCase()} stage. Must be in TEST, CODE, or QA stage to verify.`);
      }

      // Check for test files
      if (spec.testFiles.length === 0) {
        // Try to find test file automatically
        const testPath = join('tests', `${id.toLowerCase().replace(/-/g, '_')}.test.ts`);
        try {
          await access(testPath);
          spec.testFiles.push(testPath);
        } catch {
          throw new Error(`No test files found for ${id}. Run 'specsafe test ${id}' to generate tests first.`);
        }
      }

      spinner.text = `Running ${config.testFramework} tests...`;

      // Run tests based on framework
      let testResult: TestResult;
      try {
        testResult = await runTests(config.testFramework, spec.testFiles, options);
      } catch (error: any) {
        // Parse test output even if tests fail
        testResult = parseTestOutput(error.stdout, error.stderr, config.testFramework);
      }

      spinner.stop();

      // Display results
      console.log('\n' + chalk.bold('━'.repeat(60)));
      console.log(chalk.bold(`  Test Results for ${id}`));
      console.log(chalk.bold('━'.repeat(60)));
      
      if (testResult.passed) {
        console.log(chalk.green(`\n  ✅ All tests passed!`));
        console.log(chalk.green(`     ${testResult.passedTests}/${testResult.totalTests} tests passed`));
        console.log(chalk.gray(`     Duration: ${testResult.duration}ms`));
        
        // If in CODE stage, suggest moving to QA
        if (spec.stage === 'code') {
          console.log(chalk.blue(`\n  💡 Ready for QA! Run: specsafe qa ${id}`));
        } else if (spec.stage === 'qa') {
          console.log(chalk.green(`\n  🎉 Ready to complete! Run: specsafe done ${id}`));
        } else {
          console.log(chalk.blue(`\n  💡 Tests pass! Ready to implement. Run: specsafe code ${id}`));
        }
        
        console.log(chalk.bold('━'.repeat(60)));
        return;
      }

      // Tests failed - show detailed output
      console.log(chalk.red(`\n  ❌ Tests failed`));
      console.log(chalk.red(`     ${testResult.failedTests}/${testResult.totalTests} tests failed`));
      console.log(chalk.gray(`     ${testResult.passedTests} passed, ${testResult.skippedTests} skipped`));
      console.log(chalk.gray(`     Duration: ${testResult.duration}ms`));
      
      if (testResult.failures.length > 0) {
        console.log(chalk.yellow(`\n  Failed Tests:\n`));
        for (const failure of testResult.failures.slice(0, 5)) {
          console.log(chalk.red(`  ✗ ${failure.name}`));
          if (failure.file) {
            console.log(chalk.gray(`    File: ${failure.file}`));
          }
          console.log(chalk.gray(`    ${failure.error.split('\n')[0]}`));
          console.log();
        }
        
        if (testResult.failures.length > 5) {
          console.log(chalk.gray(`  ... and ${testResult.failures.length - 5} more failures`));
        }
      }

      console.log(chalk.bold('━'.repeat(60)));

      // Provide guidance for fixes
      console.log(chalk.yellow('\n  🔧 Suggested fixes:\n'));
      
      const suggestions = generateFixSuggestions(testResult.failures, spec);
      for (const suggestion of suggestions) {
        console.log(chalk.blue(`  • ${suggestion}`));
      }

      console.log(chalk.gray(`\n  💡 Run 'specsafe code ${id}' to continue development`));
      console.log(chalk.gray(`     Then run 'specsafe verify ${id}' again`));
      
      if (!options.ci) {
        console.log(chalk.gray(`\n     Or use --watch mode for continuous feedback:`));
        console.log(chalk.gray(`     specsafe verify ${id} --watch`));
      }

      // Exit with error code in CI mode
      if (options.ci) {
        process.exit(1);
      }

    } catch (error: any) {
      spinner.fail(chalk.red(error.message));
      if (error.message.includes('not found')) {
        console.log(chalk.gray(`💡 Tip: Run 'specsafe new <name>' to create a spec first.`));
      } else if (error.message.includes('stage')) {
        console.log(chalk.gray(`💡 Tip: Current workflow: SPEC → TEST → CODE → QA → COMPLETE`));
      }
      process.exit(1);
    }
  });

async function runTests(
  framework: string, 
  testFiles: string[], 
  options: { watch?: boolean; update?: boolean }
): Promise<TestResult> {
  const testFilePattern = testFiles.length > 0 ? testFiles.join(' ') : '';
  
  let command: string;
  
  switch (framework) {
    case 'vitest':
      command = options.watch
        ? `npx vitest ${testFilePattern}`
        : `npx vitest run ${testFilePattern}`;
      if (options.update) command += ' --update';
      break;
    case 'jest':
      command = `npx jest ${testFilePattern}`;
      if (options.watch) command += ' --watch';
      if (options.update) command += ' --updateSnapshot';
      break;
    case 'playwright':
      command = `npx playwright test ${testFilePattern}`;
      if (options.watch) command += ' --ui';
      break;
    default:
      // Try to detect from package.json
      command = `npm test -- ${testFilePattern}`;
      if (options.watch) command += ' --watch';
  }

  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout: options.watch ? undefined : 120000,
      env: { ...process.env, CI: options.watch ? 'false' : 'true' }
    });
    return parseTestOutput(stdout, stderr, framework);
  } catch (error: any) {
    // Test command failed - parse the output anyway
    if (error.stdout || error.stderr) {
      return parseTestOutput(error.stdout || '', error.stderr || '', framework);
    }
    throw error;
  }
}

function parseTestOutput(stdout: string, stderr: string, framework: string): TestResult {
  const output = stdout + stderr;
  
  const result: TestResult = {
    passed: false,
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    skippedTests: 0,
    duration: 0,
    failures: []
  };

  if (framework === 'vitest' || output.includes('vitest')) {
    // Parse Vitest output
    const passMatch = output.match(/(\d+) passed/);
    const failMatch = output.match(/(\d+) failed/);
    const skipMatch = output.match(/(\d+) skipped/);
    const totalMatch = output.match(/Test Files?\s+\d+ passed \((\d+) total\)/);
    const timeMatch = output.match(/Duration\s+(\d+)ms/);
    
    if (passMatch) result.passedTests = parseInt(passMatch[1], 10);
    if (failMatch) result.failedTests = parseInt(failMatch[1], 10);
    if (skipMatch) result.skippedTests = parseInt(skipMatch[1], 10);
    if (timeMatch) result.duration = parseInt(timeMatch[1], 10);
    
    // Parse failures
    const failureBlocks = output.match(/FAIL\s+[\s\S]+?(?=FAIL|Test Files|✓|passed|failed|$)/g) || [];
    for (const block of failureBlocks) {
      const testMatch = block.match(/FAIL\s+(.+)/);
      const errorMatch = block.match(/AssertionError:\s*(.+)/) || block.match(/Error:\s*(.+)/);
      
      if (testMatch) {
        result.failures.push({
          name: testMatch[1].trim(),
          error: errorMatch ? errorMatch[1].trim() : 'Test failed',
          file: testMatch[1].trim().split(' ')[0]
        });
      }
    }
    
    result.totalTests = result.passedTests + result.failedTests + result.skippedTests;
    result.passed = result.failedTests === 0 && result.totalTests > 0;
  } else if (framework === 'jest' || output.includes('jest')) {
    // Parse Jest output
    const passedMatch = output.match(/(\d+)\s+passed/);
    const failedMatch = output.match(/(\d+)\s+failed/);
    const skippedMatch = output.match(/(\d+)\s+skipped/);
    const totalMatch = output.match(/(\d+)\s+total/);

    if (passedMatch) result.passedTests = parseInt(passedMatch[1], 10);
    if (failedMatch) result.failedTests = parseInt(failedMatch[1], 10);
    if (skippedMatch) result.skippedTests = parseInt(skippedMatch[1], 10);
    if (totalMatch) {
      result.totalTests = parseInt(totalMatch[1], 10);
    } else {
      result.totalTests = result.passedTests + result.failedTests + result.skippedTests;
    }
    
    const timeMatch = output.match(/Time:\s+([\d.]+)\s*s/);
    if (timeMatch) result.duration = Math.round(parseFloat(timeMatch[1]) * 1000);
    
    result.passed = result.failedTests === 0 && result.totalTests > 0;
    
    // Parse Jest failures
    const failMatches = output.matchAll(/✕\s+(.+)\s+\((.+?)\)/g);
    for (const match of failMatches) {
      result.failures.push({
        name: match[1].trim(),
        error: 'Test failed',
        file: match[2].trim()
      });
    }
  } else {
    // Generic parsing
    const passed = output.match(/passed|✓|success/gi);
    const failed = output.match(/failed|✕|error/gi);
    
    result.passed = !!(!failed || (passed && !failed));
    result.passedTests = passed ? passed.length : 0;
    result.failedTests = failed ? failed.length : 0;
    result.totalTests = result.passedTests + result.failedTests;
  }

  return result;
}

function generateFixSuggestions(failures: TestResult['failures'], spec: any): string[] {
  const suggestions: string[] = [];
  
  if (failures.length === 0) {
    suggestions.push('No specific failures detected. Check test output above.');
    return suggestions;
  }

  // Analyze failure patterns
  const hasAssertionErrors = failures.some(f => 
    f.error.toLowerCase().includes('expected') || 
    f.error.toLowerCase().includes('assertion')
  );
  
  const hasMissingImports = failures.some(f => 
    f.error.toLowerCase().includes('cannot find module') ||
    f.error.toLowerCase().includes('cannot resolve')
  );
  
  const hasTypeErrors = failures.some(f => 
    f.error.toLowerCase().includes('type') ||
    f.error.toLowerCase().includes('property')
  );

  if (hasMissingImports) {
    suggestions.push('Missing imports detected. Check that all dependencies are installed: npm install');
  }
  
  if (hasTypeErrors) {
    suggestions.push('Type errors found. Run: npx tsc --noEmit to see full type errors');
  }
  
  if (hasAssertionErrors) {
    suggestions.push('Test assertions failing. Review the expected vs actual values above.');
    suggestions.push('Check if implementation matches the spec requirements in ' + spec.id);
  }
  
  if (!hasMissingImports && !hasTypeErrors && !hasAssertionErrors) {
    suggestions.push('Review the spec file: specs/active/' + spec.id + '.md');
    suggestions.push('Ensure implementation covers all acceptance criteria');
    suggestions.push('Check that test setup/teardown is correct');
  }

  suggestions.push('Run individual test: npx vitest run --reporter=verbose ' + spec.testFiles[0]);
  
  return suggestions;
}
