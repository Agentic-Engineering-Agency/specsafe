import { Command } from 'commander';
import { ProjectStateManager } from '../core/ProjectState.js';
import { logger } from '../utils/logger.js';

/**
 * Tracking and project state commands
 */
export const trackCommand = new Command('track')
  .description('Update and view project tracking');

trackCommand
  .command('update')
  .description('Manually update PROJECT_STATE.md timestamp')
  .option('--final', 'Final update before closing session')
  .action(async (options) => {
    const projectRoot = process.cwd();
    const manager = new ProjectStateManager(projectRoot);

    try {
      await manager.load();

      // Just save to update timestamp
      // @ts-ignore
      await manager.save();

      if (options.final) {
        logger.success('Final tracking update complete');
      } else {
        logger.success('Tracking updated');
      }
    } catch (error) {
      logger.error('Failed to update tracking:', (error as Error).message);
      process.exit(1);
    }
  });

trackCommand
  .command('history')
  .description('Show change history')
  .option('-n, --lines <number>', 'Number of entries to show', '20')
  .action(async (options) => {
    const projectRoot = process.cwd();
    const manager = new ProjectStateManager(projectRoot);

    try {
      const lines = parseInt(options.lines);

      // Try to read change log
      const fs = await import('fs/promises');
      const path = await import('path');
      const logPath = path.default.join(projectRoot, 'tracking', 'changes.log');

      try {
        const content = await fs.default.readFile(logPath, 'utf-8');
        const entries = content.trim().split('\n');

        // Get last N entries (excluding header)
        // @ts-ignore
        const entriesToShow = entries.slice(-lines);

        logger.header('Change History');

        for (const entry of entriesToShow) {
          console.log(entry);
        }
      } catch {
        logger.info('No change history found');
      }
    } catch (error) {
      logger.error('Failed to load history:', (error as Error).message);
    }
  });

trackCommand
  .command('metrics')
  .description('Show project metrics')
  .action(async () => {
    const projectRoot = process.cwd();
    const manager = new ProjectStateManager(projectRoot);

    try {
      const state = await manager.load();

      logger.header('Project Metrics');

      // Specs by location
      const byLocation = {
        active: state.specs.filter((s) => s.location === 'active').length,
        completed: state.specs.filter((s) => s.location === 'completed').length,
        archive: state.specs.filter((s) => s.location === 'archive').length,
      };

      // Total tests
      const totalTests = state.specs.reduce((sum, s) => sum + s.tests, 0);
      const totalPassing = state.specs.reduce((sum, s) => sum + s.passing, 0);
      const passRate = totalTests > 0 ? Math.round((totalPassing / totalTests) * 100) : 0;

      // Average coverage
      const specsWithCoverage = state.specs.filter((s) => s.coverage);
      const avgCoverage =
        specsWithCoverage.length > 0
          ? Math.round(
              specsWithCoverage.reduce((sum, s) => sum + (s.coverage || 0), 0) / specsWithCoverage.length
            )
          : 0;

      // Specs by phase (active only)
      // @ts-ignore
      const byPhase = {
        SPEC: state.specs.filter((s) => s.location === 'active' && s.phase === 'SPEC').length,
        TEST: state.specs.filter((s) => s.location === 'active' && s.phase === 'TEST').length,
        CODE: state.specs.filter((s) => s.location === 'active' && s.phase === 'CODE').length,
        QA: state.specs.filter((s) => s.location === 'active' && s.phase === 'QA').length,
      };

      console.log('📊 Spec Distribution:');
      console.log(`  Active: ${byLocation.active}`);
      console.log(`  Completed: ${byLocation.completed}`);
      console.log(`  Archived: ${byLocation.archive}`);
      console.log();

      console.log('🔄 Active Spec Phases:');
      console.log(`  SPEC: ${byPhase.SPEC}`);
      console.log(`  TEST: ${byPhase.TEST}`);
      console.log(`  CODE: ${byPhase.CODE}`);
      console.log(`  QA: ${byPhase.QA}`);
      console.log();

      console.log('📈 Test Metrics:');
      console.log(`  Total Tests: ${totalTests}`);
      console.log(`  Passing: ${totalPassing}/${totalTests} (${passRate}%)`);
      console.log(`  Avg Coverage: ${avgCoverage}%`);
      console.log();

      console.log('ℹ️ Project Info:');
      console.log(`  Current Phase: ${state.currentPhase}`);
      console.log(`  Active Spec: ${state.activeSpec || 'None'}`);
      console.log(`  Last Updated: ${state.lastUpdated}`);
    } catch (error) {
      logger.error('Failed to load metrics:', (error as Error).message);
    }
  });
