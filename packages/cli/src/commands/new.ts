import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { Workflow } from '@specsafe/core';
import { ProjectTracker } from '@specsafe/core';

export const newCommand = new Command('new')
  .description('Create a new spec')
  .argument('<name>', 'Spec name (kebab-case)')
  .option('-d, --description <desc>', 'Spec description')
  .option('-a, --author <author>', 'Author name', 'developer')
  .action(async (name: string, options: { description?: string; author: string }) => {
    const spinner = ora('Creating new spec...').start();

    try {
      const workflow = new Workflow();
      const tracker = new ProjectTracker(process.cwd());

      // Generate spec ID
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const id = `SPEC-${date}-001`; // TODO: Auto-increment

      // Create spec
      const spec = workflow.createSpec(
        id,
        name,
        options.description || `Spec for ${name}`,
        options.author,
        process.cwd().split('/').pop() || 'project'
      );

      // Create spec file
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
      await mkdir('specs/active', { recursive: true });
      await writeFile(specPath, specContent);

      // Update project state
      await tracker.addSpec(spec);

      spinner.succeed(chalk.green(`Created spec: ${id}`));
      console.log(chalk.blue(`  Location: ${specPath}`));
      console.log(chalk.gray('  Edit the spec to add requirements, then run: specsafe spec <id>'));
    } catch (error: any) {
      spinner.fail(chalk.red(`Failed to create spec: ${error.message}`));
      process.exit(1);
    }
  });