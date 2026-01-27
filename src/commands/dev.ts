import { Command } from 'commander';
import { ProjectStateManager } from '../core/ProjectState.js';
import { logger } from '../utils/logger.js';

/**
 * TDD development mode
 */
export const devCommand = new Command('dev')
  .description('Start TDD development session')
  .argument('<name>', 'Name of specification')
  .option('-w, --watch', 'Run in watch mode', false)
  .action(async (name, options) => {
    const projectRoot = process.cwd();
    const manager = new ProjectStateManager(projectRoot);

    try {
      const state = await manager.load();
      const spec = state.specs.find((s) => s.name === name);

      if (!spec) {
        logger.error(`Spec not found: ${name}`);
        logger.info('Create a spec first: specsafe spec create ' + name);
        process.exit(1);
      }

      if (spec.phase === 'SPEC') {
        logger.error('Tests not yet generated for this spec');
        logger.info('Generate tests first: specsafe test create ' + name);
        process.exit(1);
      }

      logger.header(`TDD Development: ${name}`);

      // Show current status
      const passRate = spec.tests > 0 ? Math.round((spec.passing / spec.tests) * 100) : 0;
      logger.info(`Tests: ${spec.passing}/${spec.tests} passing (${passRate}%)`);
      logger.info(`Phase: ${spec.phase}`);

      console.log();
      logger.info('TDD Workflow:');
      console.log('  1. Run tests (RED - find first failing)');
      console.log('  2. Write MINIMUM code to pass (GREEN)');
      console.log('  3. Refactor if needed');
      console.log('  4. Repeat until all tests pass');
      console.log();

      if (options.watch) {
        logger.info('Starting watch mode...');
        logger.info('Your test framework will handle watch mode automatically');
        logger.info('Example: npm test -- --watch');
      } else {
        logger.info('Run tests: npm test -- ' + name);
        logger.info('After each passing test, run: specsafe track update');
      }

      // Update state to CODE phase
      await manager.updateSpec(name, { phase: 'CODE' });

      logger.success('Entered CODE phase');
    } catch (error) {
      logger.error('Failed to start dev session:', (error as Error).message);
      process.exit(1);
    }
  });
