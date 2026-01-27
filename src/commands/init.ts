import { Command } from 'commander';
import { ProjectInitializer } from '../core/Initializer.js';
import path from 'path';

/**
 * Initialize a SpecSafe project
 */
export const initCommand = new Command('init')
  .description('Initialize SpecSafe in a new or existing project')
  .argument('[path]', 'Path to initialize (default: current directory)', process.cwd())
  .option('-n, --name <name>', 'Project name')
  .option('-f, --force', 'Reinitialize even if already initialized')
  .action(async (projectPath, options) => {
    const initializer = new ProjectInitializer(path.resolve(projectPath));

    try {
      await initializer.initialize({
        projectName: options.name,
        force: options.force,
      });
    } catch (error) {
      console.error('Failed to initialize SpecSafe:', (error as Error).message);
      process.exit(1);
    }
  });
