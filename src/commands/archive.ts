import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import { ProjectStateManager } from '../core/ProjectState.js';
import { logger } from '../utils/logger.js';

/**
 * Archive command - move deprecated specs to archive/
 */
export const archiveCommand = new Command('archive')
  .description('Archive deprecated specifications (trashcan)')
  .argument('<name>', 'Name of specification')
  .option('-r, --reason <reason>', 'Reason for archival')
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

      logger.header(`Archiving: ${name}`);

      // Show current location
      logger.info(`Current location: specs/${spec.location}/${name}/`);

      console.log();

      // Ask for reason if not provided
      if (!options.reason) {
        logger.warning('Archiving a spec moves it to the trashcan');
        logger.info('Use --reason to document why this spec is being archived');
      }

      // Generate archive folder name with date
      const date = new Date().toISOString().split('T')[0];
      const archiveFolderName = `${date}-${name}`;

      // Determine source path (active or completed)
      const sourcePath = path.join(projectRoot, 'specs', spec.location, name);
      const archivePath = path.join(
        projectRoot,
        'specs',
        'archive',
        archiveFolderName
      );

      // Ensure archive directory exists
      await fs.mkdir(path.join(projectRoot, 'specs', 'archive'), { recursive: true });

      // Move the spec directory
      await fs.rename(sourcePath, archivePath);

      // Create deprecation.md if reason provided
      if (options.reason) {
        const deprecationPath = path.join(archivePath, 'deprecation.md');
        const deprecationContent = `# Deprecation: ${name}

**Archived Date:** ${date}
**Reason:** ${options.reason}

## Notes

This specification has been archived and is no longer active.

---

*Archived by SpecSafe*
`;
        await fs.writeFile(deprecationPath, deprecationContent, 'utf-8');
      }

      // Update PROJECT_STATE.md
      await manager.moveSpec(name, 'archive');
      await manager.addChangeLog({
        date: date,
        time: new Date().toTimeString().split(' ')[0],
        action: 'ARCHIVED',
        spec: name,
        files: 'specs/archive/' + archiveFolderName,
        agent: 'human',
        notes: options.reason || 'Archived without reason',
      });

      logger.success(`Spec archived: ${name}`);
      logger.info(`Moved to: specs/archive/${archiveFolderName}/`);

      if (options.reason) {
        logger.info(`Reason: ${options.reason}`);
      }

      logger.info('');
      logger.info('To restore, manually move from archive/ back to active/');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        logger.error(`Spec not found: ${name}`);
      } else {
        logger.error('Failed to archive spec:', (error as Error).message);
      }
      process.exit(1);
    }
  });

export const archiveListCommand = new Command('archive list')
  .description('List archived specifications')
  .action(async () => {
    const projectRoot = process.cwd();
    const archivePath = path.join(projectRoot, 'specs', 'archive');

    try {
      const entries = await fs.readdir(archivePath);
      const specs = entries.filter((e) => !e.startsWith('.')).sort().reverse();

      if (specs.length === 0) {
        logger.info('No archived specs');
        return;
      }

      logger.header(`Archived Specs (${specs.length})`);

      for (const spec of specs) {
        // Extract name from date-name format
        const match = spec.match(/^\d{4}-\d{2}-\d{2}-(.+)$/);
        const name = match ? match[1] : spec;
        logger.spec(name, spec);
      }
    } catch {
      logger.info('No archived specs');
    }
  });

export const archiveRestoreCommand = new Command('archive restore')
  .description('Restore an archived specification')
  .argument('<name>', 'Name of specification (date-name format or just name)')
  .action(async (name) => {
    const projectRoot = process.cwd();
    const archivePath = path.join(projectRoot, 'specs', 'archive');

    try {
      const entries = await fs.readdir(archivePath);

      // Find matching entry
      let foundEntry: string | null = null;
      for (const entry of entries) {
        if (entry === name) {
          foundEntry = entry;
          break;
        }
        // Also match by just the name part
        const match = entry.match(/^\d{4}-\d{2}-\d{2}-(.+)$/);
        if (match && match[1] === name) {
          foundEntry = entry;
          break;
        }
      }

      if (!foundEntry) {
        logger.error(`Archived spec not found: ${name}`);
        logger.info('List archived specs: specsafe archive list');
        process.exit(1);
      }

      const sourcePath = path.join(archivePath, foundEntry);
      const targetPath = path.join(projectRoot, 'specs', 'active', name);

      // Move back to active
      await fs.rename(sourcePath, targetPath);

      // Update PROJECT_STATE.md
      const manager = new ProjectStateManager(projectRoot);
      await manager.load();
      await manager.moveSpec(name, 'active');
      await manager.addChangeLog({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
        action: 'RESTORED',
        spec: name,
        files: 'specs/active/' + name,
        agent: 'human',
        notes: 'Restored from archive',
      });

      logger.success(`Spec restored: ${name}`);
      logger.info(`Moved to: specs/active/${name}/`);
    } catch (error) {
      logger.error('Failed to restore spec:', (error as Error).message);
      process.exit(1);
    }
  });
