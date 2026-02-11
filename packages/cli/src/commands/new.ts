import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { writeFile, mkdir, readdir } from 'fs/promises';
import { join, basename } from 'path';
import { Workflow, ProjectTracker } from '@specsafe/core';

export const newCommand = new Command('new')
  .description('Create a new spec')
  .argument('<name>', 'Spec name (kebab-case)')
  .option('-d, --description <desc>', 'Spec description')
  .option('-a, --author <author>', 'Author name', 'developer')
  .option('-n, --dry-run', 'Preview changes without writing files')
  .action(async (name: string, options: { description?: string; author: string; dryRun?: boolean }) => {
    const spinner = ora('Creating new spec...').start();

    try {
      const workflow = new Workflow();
      const tracker = new ProjectTracker(process.cwd());

      // Generate spec ID with auto-increment to avoid collisions
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
      
      // Check if specs/active directory exists
      try {
        await readdir('specs/active');
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          throw new Error('specs/active/ directory not found. Run "specsafe init" first to initialize the project.');
        }
        throw err;
      }
      
      // List existing specs for today and find max suffix
      let maxSuffix = 0;
      try {
        const files = await readdir('specs/active');
        const todayPrefix = `SPEC-${date}-`;
        for (const file of files) {
          if (file.startsWith(todayPrefix) && file.endsWith('.md')) {
            const suffix = parseInt(file.replace(todayPrefix, '').replace('.md', ''), 10);
            if (!isNaN(suffix) && suffix > maxSuffix) {
              maxSuffix = suffix;
            }
          }
        }
      } catch {
        // Directory doesn't exist yet, that's fine
      }
      
      const id = `SPEC-${date}-${String(maxSuffix + 1).padStart(3, '0')}`;

      // Create spec
      const spec = workflow.createSpec(
        id,
        name,
        options.description || `Spec for ${name}`,
        options.author,
        basename(process.cwd())
      );

      // Create spec content
      const specContent = `# ${name} Specification

**ID:** ${id}  
**Status:** SPEC  
**Created:** ${new Date().toISOString().split('T')[0]}  
**Author:** ${options.author}

## 1. Purpose (WHY)
<!-- Why are we building this? -->

## 2. Scope (WHAT)
### In Scope
- 

### Out of Scope
- 

## 3. Requirements
### Functional Requirements
| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-1 | | P0 | |

### Non-Functional Requirements
| ID | Requirement | Metric |
|----|-------------|--------|
| NFR-1 | | |

## 4. Technical Approach (HOW)

## 5. Test Strategy (TDD)
### Unit Tests
- 

### Integration Tests
- 

## 6. Implementation Plan
| Phase | Task | Est. Time | Dependencies |
|-------|------|-----------|--------------|
| 1 | | | |

## 7. Success Criteria
- [ ] All P0 requirements met
- [ ] All tests passing
- [ ] Documentation complete

## 8. Risks & Mitigations
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| | | | |

## 9. Notes & References
- 
`;

      const specPath = join('specs/active', `${id}.md`);

      // Handle dry-run mode
      if (options.dryRun) {
        spinner.stop();
        console.log(chalk.cyan('[DRY RUN] Would create the following files:\n'));
        console.log(chalk.cyan(`  ${specPath}`));
        console.log(chalk.cyan(`\nContent preview (first 20 lines):\n`));
        const previewLines = specContent.split('\n').slice(0, 20).join('\n');
        console.log(chalk.gray(previewLines));
        if (specContent.split('\n').length > 20) {
          console.log(chalk.gray('  ... (truncated)'));
        }
        console.log(chalk.cyan(`\nWould update PROJECT_STATE.md with spec: ${id}`));
        process.exit(0);
      }

      // Create spec file
      await mkdir('specs/active', { recursive: true });
      await writeFile(specPath, specContent);

      // Update project state
      await tracker.addSpec(spec);

      spinner.succeed(chalk.green(`Created spec: ${id}`));
      console.log(chalk.blue(`  Location: ${specPath}`));
      console.log(chalk.gray('  Edit the spec to add requirements, then run: specsafe spec <id>'));
    } catch (error: any) {
      spinner.fail(chalk.red(`Failed to create spec: ${error.message}`));
      if (error.message.includes('specs/active/')) {
        console.log(chalk.gray('💡 Tip: Run "specsafe init" to initialize the project first.'));
      } else if (error.message.includes('already exists')) {
        console.log(chalk.gray('💡 Tip: Use a different spec name or delete the existing spec first.'));
      }
      process.exit(1);
    }
  });
