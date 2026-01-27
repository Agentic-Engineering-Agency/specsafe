import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import { ProjectStateManager } from '../core/ProjectState.js';
import { logger } from '../utils/logger.js';

/**
 * Complete workflow - human approval and move to production
 */
export const completeCommand = new Command('complete')
  .description('Complete a spec - human approval and move to completed/')
  .argument('<name>', 'Name of specification')
  .option('-r, --reject', 'Reject and return to CODE phase')
  .action(async (name, options) => {
    const projectRoot = process.cwd();
    const manager = new ProjectStateManager(projectRoot);

    try {
      const state = await manager.load();
      const spec = state.specs.find((s) => s.name === name);

      if (!spec) {
        logger.error(`Spec not found: ${name}`);
        process.exit(1);
      }

      logger.header(`Completion: ${name}`);

      // Show spec status
      const passRate = spec.tests > 0 ? Math.round((spec.passing / spec.tests) * 100) : 0;
      logger.info(`Tests: ${spec.passing}/${spec.tests} passing (${passRate}%)`);
      logger.info(`QA Status: ${spec.qaStatus || 'Not run'}`);
      logger.info(`Phase: ${spec.phase}`);

      console.log();

      // Load QA report if exists
      const qaReportPath = path.join(projectRoot, 'specs', 'active', name, 'qa-report.md');
      let qaExists = false;
      try {
        await fs.access(qaReportPath);
        qaExists = true;
        const qaContent = await fs.readFile(qaReportPath, 'utf-8');
        const recommendationMatch = qaContent.match(/# (GO|NO-GO)/);
        if (recommendationMatch) {
          logger.info(`QA Recommendation: ${recommendationMatch[1]}`);
        }
      } catch {
        logger.warning('No QA report found');
        logger.info('Run QA first: specsafe qa run ' + name);
      }

      console.log();

      // Show approval checklist
      logger.info('Approval Checklist:');
      console.log('  [ ] QA report reviewed');
      console.log('  [ ] Test pass rate acceptable');
      console.log('  [ ] Coverage meets requirements');
      console.log('  [ ] Corner cases documented');
      console.log('  [ ] No critical failures');
      console.log('  [ ] Implementation matches spec');
      console.log();

      if (options.reject) {
        // Reject - return to CODE phase
        logger.warning('Rejecting and returning to CODE phase');

        // Ask for feedback
        console.log('Document rejection reason:');
        console.log('(Add to .specsafe/tasks/rejected-feedback.md)');

        await manager.updateSpec(name, {
          phase: 'CODE',
          qaStatus: 'NO-GO',
        });

        await manager.addChangeLog({
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().split(' ')[0],
          action: 'REJECTED',
          spec: name,
          files: '-',
          agent: 'human',
          notes: 'Returned to CODE phase',
        });

        logger.error('Spec rejected and returned to CODE phase');
        logger.info('Fix issues and run QA again');
        return;
      }

      // Approve - move to completed/
      if (!qaExists) {
        logger.error('Cannot complete without QA report');
        logger.info('Run QA first: specsafe qa run ' + name);
        process.exit(1);
      }

      logger.success('Approving spec and moving to completed/');

      // Move spec from active to completed
      const activePath = path.join(projectRoot, 'specs', 'active', name);
      const completedPath = path.join(projectRoot, 'specs', 'completed', name);

      // Ensure completed directory exists
      await fs.mkdir(path.join(projectRoot, 'specs', 'completed'), { recursive: true });

      // Move the spec directory
      await fs.rename(activePath, completedPath);

      // Update PROJECT_STATE.md
      await manager.moveSpec(name, 'completed');
      await manager.addChangeLog({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
        action: 'COMPLETED',
        spec: name,
        files: 'specs/completed/' + name,
        agent: 'human',
        notes: 'Approved by human',
      });

      logger.success(`Spec completed: ${name}`);
      logger.info(`Moved to: specs/completed/${name}/`);
      logger.info('');
      logger.info('The spec is now production-ready!');
    } catch (error) {
      logger.error('Failed to complete spec:', (error as Error).message);
      process.exit(1);
    }
  });

export const completeListCommand = new Command('complete list')
  .description('List specs pending completion')
  .action(async () => {
    const projectRoot = process.cwd();
    const manager = new ProjectStateManager(projectRoot);

    try {
      const state = await manager.load();
      const pendingSpecs = state.specs.filter(
        (s) => s.location === 'active' && s.phase === 'QA'
      );

      if (pendingSpecs.length === 0) {
        logger.info('No specs pending completion');
        return;
      }

      logger.header('Specs Pending Completion');

      for (const spec of pendingSpecs) {
        const passRate = spec.tests > 0 ? Math.round((spec.passing / spec.tests) * 100) : 0;
        logger.spec(
          spec.name,
          `${spec.passing}/${spec.tests} (${passRate}%) | QA: ${spec.qaStatus || '-'}`
        );
      }
    } catch (error) {
      logger.error('Failed to load pending specs');
    }
  });
