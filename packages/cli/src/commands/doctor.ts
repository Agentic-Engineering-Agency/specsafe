import { Command } from 'commander';
import chalk from 'chalk';
import { access, readFile } from 'fs/promises';
import { join } from 'path';

interface CheckResult {
  status: 'pass' | 'warn' | 'error';
  message: string;
  fix?: string;
}

export const doctorCommand = new Command('doctor')
  .description('Validate project setup and report issues')
  .action(async () => {
    console.log(chalk.bold('\nSpecSafe Doctor 🩺\n'));

    const results: CheckResult[] = [];

    // Check 1: Node.js version
    const nodeVersion = process.version;
    const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0], 10);
    if (nodeMajor >= 18) {
      results.push({
        status: 'pass',
        message: `Node.js ${nodeVersion} (>= 18 required)`
      });
    } else {
      results.push({
        status: 'error',
        message: `Node.js ${nodeVersion} (< 18 required)`,
        fix: 'Upgrade to Node.js 18 or higher'
      });
    }

    // Check 2: Project initialized (PROJECT_STATE.md exists)
    const projectStatePath = join(process.cwd(), 'PROJECT_STATE.md');
    try {
      await access(projectStatePath);
      results.push({
        status: 'pass',
        message: 'PROJECT_STATE.md found'
      });
    } catch {
      results.push({
        status: 'error',
        message: 'PROJECT_STATE.md not found',
        fix: "Run 'specsafe init' to initialize the project"
      });
    }

    // Check 3: Directory structure (specs/, tests/)
    const specsDir = join(process.cwd(), 'specs');
    const testsDir = join(process.cwd(), 'tests');
    
    try {
      await access(specsDir);
      results.push({
        status: 'pass',
        message: 'specs/ directory found'
      });
    } catch {
      results.push({
        status: 'warn',
        message: 'specs/ directory missing',
        fix: "Run 'specsafe init' to create"
      });
    }

    try {
      await access(testsDir);
      results.push({
        status: 'pass',
        message: 'tests/ directory found'
      });
    } catch {
      results.push({
        status: 'warn',
        message: 'tests/ directory missing',
        fix: "Run 'specsafe init' to create"
      });
    }

    // Check 4: Config file validation
    const configPath = join(process.cwd(), 'specsafe.config.json');
    try {
      await access(configPath);
      const configContent = await readFile(configPath, 'utf-8');
      try {
        const config = JSON.parse(configContent);
        // Validate known fields
        const knownFields = ['projectName', 'version', 'stages', 'testFramework', 'language'];
        const unknownFields = Object.keys(config).filter(key => !knownFields.includes(key));
        
        if (unknownFields.length > 0) {
          results.push({
            status: 'warn',
            message: `Config file has unknown fields: ${unknownFields.join(', ')}`
          });
        } else {
          results.push({
            status: 'pass',
            message: 'Config file valid'
          });
        }
      } catch (parseError) {
        results.push({
          status: 'error',
          message: 'Config file has invalid JSON',
          fix: 'Fix syntax errors in specsafe.config.json'
        });
      }
    } catch {
      // Config file is optional, so this is just info
      results.push({
        status: 'pass',
        message: 'No config file (using defaults)'
      });
    }

    // Check 5: Dependencies (@specsafe/core and @specsafe/test-gen)
    const nodeModulesPath = join(process.cwd(), 'node_modules');
    const corePath = join(nodeModulesPath, '@specsafe', 'core');
    const testGenPath = join(nodeModulesPath, '@specsafe', 'test-gen');

    try {
      await access(corePath);
      results.push({
        status: 'pass',
        message: '@specsafe/core installed'
      });
    } catch {
      results.push({
        status: 'error',
        message: '@specsafe/core not found',
        fix: "Run 'npm install @specsafe/core'"
      });
    }

    try {
      await access(testGenPath);
      results.push({
        status: 'pass',
        message: '@specsafe/test-gen installed'
      });
    } catch {
      results.push({
        status: 'error',
        message: '@specsafe/test-gen not found',
        fix: "Run 'npm install @specsafe/test-gen'"
      });
    }

    // Check 6: Git repo (recommended but not required)
    const gitPath = join(process.cwd(), '.git');
    try {
      await access(gitPath);
      results.push({
        status: 'pass',
        message: 'Git repository detected'
      });
    } catch {
      results.push({
        status: 'warn',
        message: 'No Git repository found',
        fix: "Run 'git init' to initialize (recommended)"
      });
    }

    // Print results
    let passed = 0;
    let warnings = 0;
    let errors = 0;

    for (const result of results) {
      let icon: string;
      let color: (text: string) => string;
      
      switch (result.status) {
        case 'pass':
          icon = '✅';
          color = chalk.green;
          passed++;
          break;
        case 'warn':
          icon = '⚠️';
          color = chalk.yellow;
          warnings++;
          break;
        case 'error':
          icon = '❌';
          color = chalk.red;
          errors++;
          break;
      }

      console.log(`  ${icon} ${color(result.message)}`);
      if (result.fix) {
        console.log(`     ${chalk.gray(result.fix)}`);
      }
    }

    // Summary
    console.log('');
    const parts: string[] = [];
    if (passed > 0) parts.push(chalk.green(`${passed} passed`));
    if (warnings > 0) parts.push(chalk.yellow(`${warnings} warning${warnings > 1 ? 's' : ''}`));
    if (errors > 0) parts.push(chalk.red(`${errors} error${errors > 1 ? 's' : ''}`));
    
    console.log(`  ${parts.join(', ')}`);
    console.log('');

    // Exit with error code if there are errors
    if (errors > 0) {
      process.exit(1);
    }
  });
