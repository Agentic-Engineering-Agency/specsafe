import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { writeFile, mkdir, access, chmod } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';
import { 
  ProjectTracker, 
  getSupportedAgents, 
  getAgent, 
  AGENT_DEFINITIONS 
} from '@specsafe/core';
import { checkbox, select, confirm, input } from '@inquirer/prompts';

/**
 * Detect which agents are already configured in the project
 */
async function detectConfiguredAgents(projectDir: string): Promise<string[]> {
  const detected: string[] = [];
  
  for (const agentDef of AGENT_DEFINITIONS) {
    for (const file of agentDef.detectionFiles) {
      const filePath = join(projectDir, file);
      try {
        await access(filePath);
        detected.push(agentDef.id);
        break; // Found one file, that's enough
      } catch {
        // File doesn't exist, continue
      }
    }
  }
  
  return detected;
}

/**
 * Generate configurations for selected agents
 */
async function generateAgentConfigs(
  agents: string[],
  projectDir: string,
  projectName: string
): Promise<void> {
  for (const agentId of agents) {
    const agentEntry = getAgent(agentId);
    if (!agentEntry) {
      console.warn(chalk.yellow(`Warning: Agent ${agentId} not found in registry`));
      continue;
    }

    try {
      // Generate main config files
      const configFiles = await agentEntry.adapter.generateConfig(projectDir, {
        projectName,
      });

      // Generate command files
      const commandFiles = await agentEntry.adapter.generateCommands(projectDir, {
        projectName,
      });

      const allFiles = [...configFiles, ...commandFiles];

      // Write files
      for (const file of allFiles) {
        const filePath = join(projectDir, file.path);
        const fileDir = dirname(filePath);

        // Create directory if needed (mkdir recursive is idempotent, no need to check existsSync)
        await mkdir(fileDir, { recursive: true });

        // Skip if file exists
        if (existsSync(filePath)) {
          console.log(chalk.yellow(`  ⚠ ${file.path} already exists, skipping`));
          continue;
        }

        // Write file
        await writeFile(filePath, file.content);
        console.log(chalk.green(`  ✓ Created ${file.path}`));
      }
    } catch (error: any) {
      console.error(chalk.red(`  ✗ Failed to generate ${agentId} config: ${error.message}`));
    }
  }
}

export const initCommand = new Command('init')
  .description('Initialize a new SpecSafe project')
  .argument('[name]', 'Project name', 'my-project')
  .option('--agent <agents...>', 'AI coding agents to configure (can be repeated)')
  .action(async (defaultName: string, options: { agent?: string[] }) => {
    const spinner = ora('Initializing SpecSafe project...').start();

    try {
      // Interactive prompts for project name
      spinner.stop();
      const name = await input({
        message: 'Project name:',
        default: defaultName,
      });

      const projectDir = process.cwd();

      // 1. Determine which agents to configure
      let selectedAgents: string[] = [];

      if (options.agent && options.agent.length > 0) {
        // Agents specified via CLI flag - validate each one
        const supportedAgents = getSupportedAgents();
        const invalidAgents = options.agent.filter(id => !supportedAgents.includes(id));
        
        if (invalidAgents.length > 0) {
          console.error(chalk.red(`Error: Invalid agent(s): ${invalidAgents.join(', ')}`));
          console.log(chalk.gray(`\nSupported agents: ${supportedAgents.join(', ')}`));
          process.exit(1);
        }
        
        selectedAgents = options.agent;
        console.log(chalk.blue(`Using agents from CLI: ${selectedAgents.join(', ')}`));
      } else {
        // Auto-detect or prompt
        const detectedAgents = await detectConfiguredAgents(projectDir);

        if (detectedAgents.length > 0) {
          console.log(chalk.green(`Detected agents: ${detectedAgents.join(', ')}`));
          
          const useDetected = await confirm({
            message: 'Use detected agents?',
            default: true,
          });

          if (useDetected) {
            selectedAgents = detectedAgents;
          }
        }

        if (selectedAgents.length === 0) {
          // Prompt user to select
          const agentChoices = AGENT_DEFINITIONS.map((agent) => ({
            name: agent.name,
            value: agent.id,
            checked: detectedAgents.includes(agent.id),
          }));

          selectedAgents = await checkbox({
            message: 'Which AI coding agents do you use?',
            choices: agentChoices,
            required: false,
          });

          // Default to all if none selected
          if (selectedAgents.length === 0) {
            const useAll = await confirm({
              message: 'No agents selected. Generate configs for all supported agents?',
              default: false,
            });

            if (useAll) {
              // Filter to only agents that have registered adapters
              selectedAgents = getSupportedAgents().filter(id => getAgent(id) !== undefined);
            }
          }
        }
      }

      // 2. Prompt for test framework
      spinner.stop();
      const testFramework = await select({
        message: 'Select testing framework:',
        choices: [
          { name: 'Vitest (recommended)', value: 'vitest' },
          { name: 'Jest', value: 'jest' },
          { name: 'Playwright (E2E)', value: 'playwright' },
        ],
        default: 'vitest',
      });

      // 3. Prompt for git hooks
      const useGitHooks = await confirm({
        message: 'Enable git hooks for spec validation?',
        default: true,
      });

      spinner.start('Creating project structure...');

      // Create directory structure (relative to projectDir)
      await mkdir(join(projectDir, 'specs/active'), { recursive: true });
      await mkdir(join(projectDir, 'specs/completed'), { recursive: true });
      await mkdir(join(projectDir, 'specs/archive'), { recursive: true });
      await mkdir(join(projectDir, 'specs/drafts'), { recursive: true });
      await mkdir(join(projectDir, 'specs/exploration'), { recursive: true });
      await mkdir(join(projectDir, 'src'), { recursive: true });
      await mkdir(join(projectDir, 'tests'), { recursive: true });

      // Create PROJECT_STATE.md
      const tracker = new ProjectTracker(projectDir);
      await tracker.initialize(name);

      // Create spec template
      const template = `# Spec Template

## Metadata
- **ID**: SPEC-{YYYYMMDD}-{NNN}
- **Status**: draft
- **Priority**: P1

## 1. Purpose (WHY)

## 2. Scope (WHAT)
### In Scope
- 

### Out of Scope
- 

## 3. Requirements
| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
|    |             |          |                     |

## 4. Technical Approach (HOW)

## 5. Test Strategy

## 6. Implementation Plan

## 7. Success Criteria
- [ ] 

## 8. Risks & Mitigations

## 9. Notes & References
`;
      await writeFile(join(projectDir, 'specs/template.md'), template);

      // Create config file with selected agents
      const agentsConfig: Record<string, { enabled: boolean }> = {};
      for (const agentId of selectedAgents) {
        agentsConfig[agentId] = { enabled: true };
      }

      const config = {
        project: name,
        version: '1.0.0',
        stages: ['explore', 'draft', 'spec', 'test-create', 'test-apply', 'verify', 'complete'],
        testFramework,
        language: 'typescript',
        agents: agentsConfig,
        gitHooks: {
          enabled: useGitHooks,
        },
      };
      await writeFile(join(projectDir, 'specsafe.config.json'), JSON.stringify(config, null, 2));

      spinner.text = 'Generating agent configurations...';

      // Generate configs for selected agents
      await generateAgentConfigs(selectedAgents, projectDir, name);

      // Generate git hooks if enabled
      if (useGitHooks) {
        const hooksDir = join(projectDir, '.githooks');
        await mkdir(hooksDir, { recursive: true });
        
        const preCommitPath = join(hooksDir, 'pre-commit');
        if (!existsSync(preCommitPath)) {
          const preCommitContent = `#!/bin/bash
# SpecSafe pre-commit hook v1.0
set -e

echo "Running SpecSafe pre-commit checks..."

# Check PROJECT_STATE.md exists
if [ ! -f "PROJECT_STATE.md" ]; then
    echo "PROJECT_STATE.md not found."
    exit 1
fi

# Run specsafe doctor if available
if command -v specsafe >/dev/null 2>&1; then
    specsafe doctor --silent || true
fi

echo "Pre-commit checks passed"
exit 0
`;
          await writeFile(preCommitPath, preCommitContent);
          // Make the hook executable
          await chmod(preCommitPath, 0o755);
          // Configure git to use .githooks directory
          try {
            execSync('git config --local core.hooksPath .githooks', { cwd: projectDir });
            console.log(chalk.green('  ✓ Created .githooks/pre-commit'));
          } catch (err) {
            console.log(chalk.yellow('  ⚠ Created .githooks/pre-commit (run: git config --local core.hooksPath .githooks)'));
          }
        }
      }

      spinner.succeed(chalk.green(`Initialized SpecSafe project: ${name}`));

      console.log('\n' + chalk.blue('Generated configurations:'));
      for (const agentId of selectedAgents) {
        const agentDef = AGENT_DEFINITIONS.find((a) => a.id === agentId);
        console.log(chalk.green(`  ✓ ${agentDef?.name || agentId}`));
      }
      if (useGitHooks) {
        console.log(chalk.green('  ✓ Git hooks enabled'));
      }
      console.log(chalk.green(`  ✓ ${testFramework} configuration`));

      console.log('\n' + chalk.blue('Next steps:'));
      console.log('  1. specsafe new <spec-name>  - Create a new spec');
      console.log('  2. specsafe status             - View project status');
      console.log('  3. Edit specs/active/ to define requirements');
      
      if (selectedAgents.length > 0) {
        console.log('\n' + chalk.blue('Agent commands:'));
        for (const agentId of selectedAgents.slice(0, 3)) {
          const agentEntry = getAgent(agentId);
          if (agentEntry) {
            // Use regex for whole-word replacement
            const cmdFormat = agentEntry.commandFormat.replace(/\bcommand\b/, 'specsafe');
            console.log(`  ${agentEntry.name}: ${cmdFormat}`);
          }
        }
      }
    } catch (error: any) {
      spinner.fail(chalk.red(`Failed to initialize: ${error.message}`));
      if (error.message.includes('EEXIST')) {
        console.log(chalk.gray("💡 Tip: Directory already exists."));
      }
      if (error.message.includes('User force closed')) {
        console.log(chalk.gray('💡 Tip: Init was cancelled by user.'));
        process.exit(0);
      }
      process.exit(1);
    }
  });
