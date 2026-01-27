import { Command } from 'commander';
import { ProjectStateManager } from '../core/ProjectState.js';
import { logger } from '../utils/logger.js';

/**
 * Show current SpecSafe status
 */
export const statusCommand = new Command('status')
  .description('Show current SpecSafe project state and progress')
  .action(async () => {
    const projectRoot = process.cwd();
    const manager = new ProjectStateManager(projectRoot);

    try {
      const state = await manager.load();

      logger.header(`SpecSafe Status - ${state.specs.length} specs tracked`);

      console.log();
      logger.info(`Current Phase: ${state.currentPhase}`);
      logger.info(`Active Spec: ${state.activeSpec || 'None'}`);
      logger.info(`Last Updated: ${state.lastUpdated}`);

      console.log();
      console.log('📊 Spec Status:');
      console.log();

      if (state.specs.length === 0) {
        logger.info('No specs tracked yet.');
        console.log();
        logger.info('Get started with:');
        logger.info('  specsafe spec create <name>');
        console.log();
        return;
      }

      // Group by location
      const byLocation = {
        active: state.specs.filter((s) => s.location === 'active'),
        completed: state.specs.filter((s) => s.location === 'completed'),
        archive: state.specs.filter((s) => s.location === 'archive'),
      };

      for (const [location, specs] of Object.entries(byLocation)) {
        if (specs.length === 0) continue;

        const icon = location === 'active' ? '🔄' : location === 'completed' ? '✅' : '🗑️';
        console.log(`${icon} ${location.toUpperCase()} (${specs.length}):`);

        for (const spec of specs) {
          const passRate = spec.tests > 0 ? `${Math.round((spec.passing / spec.tests) * 100)}%` : '-';
          const coverage = spec.coverage ? `${spec.coverage}%` : '-';

          logger.spec(
            spec.name,
            `${spec.passing}/${spec.tests} tests | ${passRate} | ${coverage} | ${spec.qaStatus || '-'}`
          );
        }
        console.log();
      }

      // Metrics
      const totalTests = state.specs.reduce((sum, s) => sum + s.tests, 0);
      const totalPassing = state.specs.reduce((sum, s) => sum + s.passing, 0);
      const avgCoverage =
        state.specs.filter((s) => s.coverage).length > 0
          ? Math.round(state.specs.reduce((sum, s) => sum + (s.coverage || 0), 0) / state.specs.length)
          : 0;

      console.log('📈 Metrics:');
      console.log(`  Total Tests: ${totalTests}`);
      console.log(`  Passing: ${totalPassing}/${totalTests} (${totalTests > 0 ? Math.round((totalPassing / totalTests) * 100) : 0}%)`);
      console.log(`  Avg Coverage: ${avgCoverage}%`);
      console.log();

    } catch (error) {
      logger.error('Failed to load project state');
      logger.info('Make sure you are in a SpecSafe-initialized directory');
      logger.info('Run: specsafe init');
    }
  });
