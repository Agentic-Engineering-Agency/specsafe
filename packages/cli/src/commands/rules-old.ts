import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import {
  getAllTools,
  detectTool,
  loadInstalledTools,
  saveToolConfig,
  removeToolConfig,
  isValidTool,
  getTool,
} from '../rules/index.js';
import { downloadRules, updateRules, removeRules, getRulesVersion } from '../rules/downloader.js';

/**
 * Rules command - manage AI coding assistant integrations
 */
export const rulesCommand = new Command('rules')
  .description('Manage AI coding assistant rules and integrations')
  .addCommand(
    new Command('list')
      .description('List available and installed rules')
      .action(async () => {
        const spinner = ora('Loading rules...').start();

        try {
          const allTools = getAllTools();
          const installedTools = await loadInstalledTools();
          const installedMap = new Map(installedTools.map((t) => [t.name, t]));

          spinner.stop();

          console.log(chalk.bold('\n📋 Available Rules:\n'));

          for (const tool of allTools) {
            const isInstalled = installedMap.has(tool.name);
            const isDetected = await detectTool(tool.name);
            const status = isInstalled
              ? chalk.green('[installed]')
              : isDetected
                ? chalk.yellow('[detected]')
                : chalk.gray('[available]');

            console.log(`  ${status} ${chalk.cyan(tool.name.padEnd(12))} ${tool.description}`);
            
            if (isInstalled) {
              const installed = installedMap.get(tool.name)!;
              console.log(`             ${chalk.gray(`v${installed.version}`)}`);
            }
            
            if (isDetected && !isInstalled) {
              console.log(`             ${chalk.gray(`Config files found: ${tool.files.join(', ')}`)}`);
            }
          }

          console.log(chalk.gray(`\n${allTools.length} tools available`));
          console.log(chalk.gray(`\nUse 'specsafe rules add <tool>' to install rules`));
        } catch (error: any) {
          spinner.fail(chalk.red(`Failed to list rules: ${error.message}`));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('add')
      .description('Download and install rules for a tool')
      .argument('<tool>', 'Tool name (cursor, continue, aider, zed, git-hooks)')
      .action(async (toolName: string) => {
        if (!isValidTool(toolName)) {
          console.error(chalk.red(`Error: Unknown tool "${toolName}"`));
          console.log(chalk.gray(`\nAvailable tools: ${getAllTools().map((t) => t.name).join(', ')}`));
          process.exit(1);
        }

        const tool = getTool(toolName)!;
        const spinner = ora(`Installing ${toolName} rules...`).start();

        try {
          const result = await downloadRules(toolName);

          if (result.success) {
            // Save to config
            const version = await getRulesVersion(toolName);
            await saveToolConfig(toolName, { enabled: true, version });
            spinner.succeed(chalk.green(result.message));
            
            console.log(chalk.gray(`\nCreated files:`));
            for (const file of tool.files) {
              console.log(chalk.gray(`  • ${file}`));
            }
          } else {
            spinner.fail(chalk.red(result.message));
            process.exit(1);
          }
        } catch (error: any) {
          spinner.fail(chalk.red(`Failed to install ${toolName} rules: ${error.message}`));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('remove')
      .description('Remove rules for a tool')
      .argument('<tool>', 'Tool name to remove')
      .action(async (toolName: string) => {
        if (!isValidTool(toolName)) {
          console.error(chalk.red(`Error: Unknown tool "${toolName}"`));
          process.exit(1);
        }

        const spinner = ora(`Removing ${toolName} rules...`).start();

        try {
          const result = await removeRules(toolName);

          if (result.success) {
            // Remove from config
            await removeToolConfig(toolName);
            spinner.succeed(chalk.green(result.message));
          } else {
            spinner.fail(chalk.red(result.message));
            process.exit(1);
          }
        } catch (error: any) {
          spinner.fail(chalk.red(`Failed to remove ${toolName} rules: ${error.message}`));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('update')
      .description('Update all installed rules to the latest version')
      .action(async () => {
        const spinner = ora('Checking installed rules...').start();

        try {
          const installedTools = await loadInstalledTools();

          if (installedTools.length === 0) {
            spinner.stop();
            console.log(chalk.yellow('No rules installed. Run "specsafe rules add <tool>" first.'));
            return;
          }

          spinner.text = `Updating ${installedTools.length} rule set(s)...`;

          const results = await Promise.all(
            installedTools.map(async (tool) => {
              const result = await updateRules(tool.name);
              return { ...result, toolName: tool.name };
            })
          );

          spinner.stop();

          let successCount = 0;
          let failCount = 0;

          for (const result of results) {
            if (result.success) {
              console.log(chalk.green(`✓ ${result.message}`));
              const version = await getRulesVersion(result.toolName);
              await saveToolConfig(result.toolName, { enabled: true, version });
              successCount++;
            } else {
              console.log(chalk.red(`✗ ${result.message}`));
              failCount++;
            }
          }

          console.log(chalk.gray(`\nUpdated ${successCount} tool(s)`));
          if (failCount > 0) {
            console.log(chalk.red(`${failCount} update(s) failed`));
            process.exit(1);
          }
        } catch (error: any) {
          spinner.fail(chalk.red(`Failed to update rules: ${error.message}`));
          process.exit(1);
        }
      })
  );
