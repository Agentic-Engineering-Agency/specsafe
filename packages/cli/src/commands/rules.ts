import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import {
  getSupportedAgents,
  getAgent,
  AGENT_DEFINITIONS,
  type AgentDefinition,
} from '@specsafe/core';

/**
 * Load installed agents from config
 */
async function loadInstalledAgents(cwd: string = process.cwd()): Promise<Map<string, { enabled: boolean }>> {
  const configPath = join(cwd, 'specsafe.config.json');
  try {
    const content = await readFile(configPath, 'utf-8');
    const config = JSON.parse(content);
    return new Map(Object.entries(config.agents || {}));
  } catch {
    return new Map();
  }
}

/**
 * Save agent configuration
 */
async function saveAgentConfig(
  agentId: string,
  config: { enabled: boolean },
  cwd: string = process.cwd()
): Promise<void> {
  const configPath = join(cwd, 'specsafe.config.json');
  let existingConfig: Record<string, unknown> = {};

  try {
    const content = await readFile(configPath, 'utf-8');
    existingConfig = JSON.parse(content);
  } catch {
    // Config doesn't exist yet
  }

  existingConfig.agents = {
    ...((existingConfig.agents as Record<string, unknown> | undefined) || {}),
    [agentId]: config,
  };

  await writeFile(configPath, JSON.stringify(existingConfig, null, 2));
}

/**
 * Remove agent configuration
 */
async function removeAgentConfig(
  agentId: string,
  cwd: string = process.cwd()
): Promise<void> {
  const configPath = join(cwd, 'specsafe.config.json');
  try {
    const content = await readFile(configPath, 'utf-8');
    const config = JSON.parse(content);
    
    if (config.agents && config.agents[agentId]) {
      delete config.agents[agentId];
      await writeFile(configPath, JSON.stringify(config, null, 2));
    }
  } catch {
    // Config doesn't exist or is malformed
  }
}

/**
 * Rules command - manage AI coding assistant integrations
 */
export const rulesCommand = new Command('rules')
  .description('Manage AI coding assistant rules and integrations')
  .addCommand(
    new Command('list')
      .description('List available and installed agents')
      .action(async () => {
        const spinner = ora('Loading agents...').start();

        try {
          const installedAgents = await loadInstalledAgents();
          
          spinner.stop();

          console.log(chalk.bold('\n📋 Available Agents:\n'));

          for (const agentDef of AGENT_DEFINITIONS) {
            const agentEntry = getAgent(agentDef.id);
            const isInstalled = installedAgents.has(agentDef.id);
            const isDetected = agentEntry ? await agentEntry.adapter.detect(process.cwd()) : false;
            
            const status = isInstalled
              ? chalk.green('[installed]')
              : isDetected
                ? chalk.yellow('[detected]')
                : chalk.gray('[available]');

            console.log(`  ${status} ${chalk.cyan(agentDef.id.padEnd(15))} ${agentDef.name}`);
            
            if (isDetected && !isInstalled && agentDef.detectionFiles.length > 0) {
              console.log(`             ${chalk.gray(`Detected: ${agentDef.detectionFiles[0]}`)}`);
            }
          }

          console.log(chalk.gray(`\n${AGENT_DEFINITIONS.length} agents available`));
          console.log(chalk.gray(`\nUse 'specsafe rules add <agent>' to install agent configs`));
        } catch (error: any) {
          spinner.fail(chalk.red(`Failed to list agents: ${error.message}`));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('add')
      .description('Install configuration for an agent')
      .argument('<agent>', 'Agent ID (claude-code, cursor, copilot, etc.)')
      .option('--force', 'Overwrite existing files')
      .action(async (agentId: string, options: { force?: boolean }) => {
        const supportedAgents = getSupportedAgents();
        
        if (!supportedAgents.includes(agentId)) {
          console.error(chalk.red(`Error: Unknown agent "${agentId}"`));
          console.log(chalk.gray(`\nAvailable agents: ${supportedAgents.join(', ')}`));
          process.exit(1);
        }

        const agentEntry = getAgent(agentId);
        if (!agentEntry) {
          console.error(chalk.red(`Error: Agent "${agentId}" has no adapter registered.`));
          console.log(chalk.gray('This agent is defined but not yet implemented.'));
          process.exit(1);
        }

        const spinner = ora(`Installing ${agentEntry.name} configuration...`).start();

        try {
          const projectDir = process.cwd();
          
          // Generate config files
          const configFiles = await agentEntry.adapter.generateConfig(projectDir, {
            force: options.force,
          });

          // Generate command files
          const commandFiles = await agentEntry.adapter.generateCommands(projectDir, {
            force: options.force,
          });

          const allFiles = [...configFiles, ...commandFiles];
          let created = 0;
          let skipped = 0;

          // Write files
          for (const file of allFiles) {
            const filePath = join(projectDir, file.path);
            const fileDir = dirname(filePath);

            // Create directory (mkdir recursive is idempotent)
            await mkdir(fileDir, { recursive: true });

            // Check if file exists
            if (existsSync(filePath) && !options.force) {
              skipped++;
              continue;
            }

            // Write file
            await writeFile(filePath, file.content);
            created++;
          }

          // Save to config
          await saveAgentConfig(agentId, { enabled: true });

          spinner.succeed(chalk.green(`Installed ${agentEntry.name} configuration`));
          
          console.log(chalk.gray(`\nFiles: ${created} created, ${skipped} skipped`));
          
          // Show instructions
          console.log('\n' + chalk.blue('Usage Instructions:'));
          console.log(agentEntry.adapter.getInstructions());
          
        } catch (error: any) {
          spinner.fail(chalk.red(`Failed to install ${agentId}: ${error.message}`));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('remove')
      .description('Remove configuration for an agent')
      .argument('<agent>', 'Agent ID to remove')
      .action(async (agentId: string) => {
        const supportedAgents = getSupportedAgents();
        
        if (!supportedAgents.includes(agentId)) {
          console.error(chalk.red(`Error: Unknown agent "${agentId}"`));
          process.exit(1);
        }

        // Check if agent is actually installed
        const installedAgents = await loadInstalledAgents();
        if (!installedAgents.has(agentId)) {
          console.warn(chalk.yellow(`Warning: Agent "${agentId}" is not configured in this project.`));
          console.log(chalk.gray('Nothing to remove.'));
          process.exit(0);
        }

        const spinner = ora(`Removing ${agentId} configuration...`).start();

        try {
          // Remove from config
          await removeAgentConfig(agentId);
          
          spinner.succeed(chalk.green(`Removed ${agentId} from configuration`));
          console.log(chalk.gray('\nNote: Config files were not deleted. Remove them manually if needed.'));
          
        } catch (error: any) {
          spinner.fail(chalk.red(`Failed to remove ${agentId}: ${error.message}`));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('info')
      .description('Show information about an agent')
      .argument('<agent>', 'Agent ID')
      .action(async (agentId: string) => {
        const agentEntry = getAgent(agentId);
        
        if (!agentEntry) {
          console.error(chalk.red(`Error: Unknown agent "${agentId}"`));
          const supported = getSupportedAgents();
          console.log(chalk.gray(`\nAvailable agents: ${supported.join(', ')}`));
          process.exit(1);
        }

        console.log(chalk.bold(`\n${agentEntry.name}\n`));
        console.log(chalk.gray(`ID: ${agentEntry.id}`));
        console.log(chalk.gray(`Config Directory: ${agentEntry.configDir || 'N/A'}`));
        console.log(chalk.gray(`Command Directory: ${agentEntry.commandDir || 'N/A'}`));
        console.log(chalk.gray(`File Extension: ${agentEntry.fileExtension}`));
        console.log(chalk.gray(`Command Format: ${agentEntry.commandFormat}`));
        
        console.log('\n' + chalk.blue('Detection Files:'));
        for (const file of agentEntry.detectionFiles) {
          const exists = existsSync(join(process.cwd(), file));
          const status = exists ? chalk.green('✓') : chalk.gray('✗');
          console.log(`  ${status} ${file}`);
        }

        console.log('\n' + chalk.blue('Instructions:'));
        console.log(agentEntry.adapter.getInstructions());
      })
  );
