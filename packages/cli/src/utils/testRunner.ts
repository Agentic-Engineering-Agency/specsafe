import { execSync, spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export interface TestResult {
  passed: boolean;
  passCount: number;
  failCount: number;
  failures: Array<{
    testName: string;
    error: string;
  }>;
}

export type TestFramework = 'vitest' | 'jest' | 'mocha';

interface FrameworkDetectionResult {
  framework: TestFramework;
  command: string;
  args: string[];
}

/**
 * Detects the test framework by checking:
 * 1. Package.json for test scripts
 * 2. Config files (vitest.config.*, jest.config.*, etc.)
 * 3. Installed dependencies
 * 4. Defaults to vitest
 */
export function detectTestFramework(cwd: string = process.cwd()): FrameworkDetectionResult {
  const packageJsonPath = join(cwd, 'package.json');
  let packageJson: { scripts?: Record<string, string>; dependencies?: Record<string, string>; devDependencies?: Record<string, string> } = {};
  
  if (existsSync(packageJsonPath)) {
    try {
      packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    } catch {
      // Invalid package.json, continue with detection
    }
  }

  // Check for config files first (most reliable)
  if (existsSync(join(cwd, 'vitest.config.ts')) || 
      existsSync(join(cwd, 'vitest.config.js')) ||
      existsSync(join(cwd, 'vitest.config.mjs')) ||
      existsSync(join(cwd, 'vitest.config.cjs'))) {
    return { framework: 'vitest', command: 'npx', args: ['vitest', 'run', '--reporter=json'] };
  }

  if (existsSync(join(cwd, 'jest.config.ts')) || 
      existsSync(join(cwd, 'jest.config.js')) ||
      existsSync(join(cwd, 'jest.config.mjs')) ||
      existsSync(join(cwd, 'jest.config.cjs')) ||
      existsSync(join(cwd, 'jest.config.json'))) {
    return { framework: 'jest', command: 'npx', args: ['jest', '--json'] };
  }

  if (existsSync(join(cwd, '.mocharc.js')) || 
      existsSync(join(cwd, '.mocharc.json')) ||
      existsSync(join(cwd, '.mocharc.yaml')) ||
      existsSync(join(cwd, '.mocharc.yml'))) {
    return { framework: 'mocha', command: 'npx', args: ['mocha', '--reporter=json'] };
  }

  // Check package.json scripts for clues
  const scripts = packageJson.scripts || {};
  const testScript = scripts.test || '';
  
  if (testScript.includes('vitest')) {
    return { framework: 'vitest', command: 'npx', args: ['vitest', 'run', '--reporter=json'] };
  }
  if (testScript.includes('jest')) {
    return { framework: 'jest', command: 'npx', args: ['jest', '--json'] };
  }
  if (testScript.includes('mocha')) {
    return { framework: 'mocha', command: 'npx', args: ['mocha', '--reporter=json'] };
  }

  // Check installed dependencies
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };

  if (allDeps?.vitest) {
    return { framework: 'vitest', command: 'npx', args: ['vitest', 'run', '--reporter=json'] };
  }
  if (allDeps?.jest) {
    return { framework: 'jest', command: 'npx', args: ['jest', '--json'] };
  }
  if (allDeps?.mocha) {
    return { framework: 'mocha', command: 'npx', args: ['mocha', '--reporter=json'] };
  }

  // Default to vitest
  return { framework: 'vitest', command: 'npx', args: ['vitest', 'run', '--reporter=json'] };
}

/**
 * Parses Vitest JSON output
 */
function parseVitestOutput(output: string): TestResult {
  try {
    const result = JSON.parse(output);
    const failures: Array<{ testName: string; error: string }> = [];
    let passCount = 0;
    let failCount = 0;

    // Vitest JSON format varies by version, handle common formats
    if (result.testResults) {
      // Newer vitest format
      for (const testFile of result.testResults) {
        if (testFile.assertionResults) {
          for (const assertion of testFile.assertionResults) {
            if (assertion.status === 'passed') {
              passCount++;
            } else {
              failCount++;
              failures.push({
                testName: `${testFile.name} > ${assertion.title}`,
                error: assertion.failureMessages?.join('\n') || 'Test failed'
              });
            }
          }
        }
      }
    }

    // Alternative format
    if (result.results) {
      for (const testFile of result.results) {
        if (Array.isArray(testFile)) {
          for (const test of testFile) {
            if (test.status === 'passed' || test.status === 'fulfilled') {
              passCount++;
            } else {
              failCount++;
              failures.push({
                testName: test.name || 'Unknown test',
                error: test.error?.message || test.error || 'Test failed'
              });
            }
          }
        }
      }
    }

    return {
      passed: failCount === 0 && passCount > 0,
      passCount,
      failCount,
      failures
    };
  } catch {
    // Fallback: try to parse from stdout
    return parseGenericOutput(output);
  }
}

/**
 * Parses Jest JSON output
 */
function parseJestOutput(output: string): TestResult {
  try {
    const result = JSON.parse(output);
    const failures: Array<{ testName: string; error: string }> = [];

    if (result.testResults) {
      for (const testFile of result.testResults) {
        if (testFile.message) {
          failures.push({
            testName: testFile.name,
            error: testFile.message
          });
        }
      }
    }

    return {
      passed: result.success || result.numFailedTests === 0,
      passCount: result.numPassedTests || 0,
      failCount: result.numFailedTests || 0,
      failures
    };
  } catch {
    return parseGenericOutput(output);
  }
}

/**
 * Parses Mocha JSON output
 */
function parseMochaOutput(output: string): TestResult {
  try {
    const result = JSON.parse(output);
    const failures: Array<{ testName: string; error: string }> = [];

    if (result.failures) {
      for (const failure of result.failures) {
        failures.push({
          testName: failure.fullTitle || failure.title,
          error: failure.err?.message || failure.err || 'Test failed'
        });
      }
    }

    return {
      passed: result.failures?.length === 0 && (result.passes?.length || 0) > 0,
      passCount: result.passes?.length || 0,
      failCount: result.failures?.length || 0,
      failures
    };
  } catch {
    return parseGenericOutput(output);
  }
}

/**
 * Generic output parser for when JSON parsing fails
 * Attempts to extract pass/fail counts from text output
 */
function parseGenericOutput(output: string): TestResult {
  const failures: Array<{ testName: string; error: string }> = [];
  
  // Try to extract pass/fail counts from common patterns
  const passMatch = output.match(/(\d+)\s+passing|passed\s+(\d+)|(\d+)\s+passed/i);
  const failMatch = output.match(/(\d+)\s+failing|failed\s+(\d+)|(\d+)\s+failed/i);
  
  const passCount = parseInt(passMatch?.[1] || passMatch?.[2] || passMatch?.[3] || '0', 10);
  const failCount = parseInt(failMatch?.[1] || failMatch?.[2] || failMatch?.[3] || '0', 10);

  return {
    passed: failCount === 0 && passCount > 0,
    passCount,
    failCount,
    failures
  };
}

/**
 * Runs tests using the detected framework and returns structured results
 * @param specId Optional spec ID to filter tests
 * @param cwd Working directory to run tests in
 * @returns TestResult with pass/fail counts and failure details
 */
export async function runTests(specId?: string, cwd: string = process.cwd()): Promise<TestResult> {
  const detection = detectTestFramework(cwd);
  
  // Add spec filter if provided
  const args = [...detection.args];
  if (specId) {
    if (detection.framework === 'vitest') {
      args.push('-t', specId);
    } else if (detection.framework === 'jest') {
      args.push('-t', specId);
    } else if (detection.framework === 'mocha') {
      args.push('-g', specId);
    }
  }

  return new Promise((resolve, reject) => {
    const child = spawn(detection.command, args, {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      // Combine stdout and stderr for parsing (some frameworks output to stderr)
      const output = stdout + stderr;
      
      try {
        let result: TestResult;
        
        switch (detection.framework) {
          case 'vitest':
            result = parseVitestOutput(output);
            break;
          case 'jest':
            result = parseJestOutput(output);
            break;
          case 'mocha':
            result = parseMochaOutput(output);
            break;
          default:
            result = parseGenericOutput(output);
        }

        // If no tests were found but command succeeded, treat as passed with 0 tests
        if (result.passCount === 0 && result.failCount === 0 && code === 0) {
          result.passed = true;
        }

        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to parse test output: ${error}`));
      }
    });

    child.on('error', (error) => {
      reject(new Error(`Failed to run tests: ${error.message}`));
    });
  });
}

/**
 * Runs tests synchronously (for simpler use cases)
 * @param specId Optional spec ID to filter tests
 * @param cwd Working directory to run tests in
 * @returns TestResult with pass/fail counts and failure details
 */
export function runTestsSync(specId?: string, cwd: string = process.cwd()): TestResult {
  const detection = detectTestFramework(cwd);
  
  // Add spec filter if provided
  const args = [...detection.args];
  if (specId) {
    if (detection.framework === 'vitest') {
      args.push('-t', specId);
    } else if (detection.framework === 'jest') {
      args.push('-t', specId);
    } else if (detection.framework === 'mocha') {
      args.push('-g', specId);
    }
  }

  try {
    const output = execSync(`${detection.command} ${args.join(' ')}`, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    switch (detection.framework) {
      case 'vitest':
        return parseVitestOutput(output);
      case 'jest':
        return parseJestOutput(output);
      case 'mocha':
        return parseMochaOutput(output);
      default:
        return parseGenericOutput(output);
    }
  } catch (error: any) {
    // Test command may exit with non-zero code on test failures
    // Try to parse output anyway
    const output = error.stdout || error.message || '';
    
    switch (detection.framework) {
      case 'vitest':
        return parseVitestOutput(output);
      case 'jest':
        return parseJestOutput(output);
      case 'mocha':
        return parseMochaOutput(output);
      default:
        return parseGenericOutput(output);
    }
  }
}
