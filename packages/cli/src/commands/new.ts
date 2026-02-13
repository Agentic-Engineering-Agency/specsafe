import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { writeFile, mkdir, readdir } from 'fs/promises';
import { join, basename } from 'path';
import { Workflow, ProjectTracker, generateEARSTemplate, SteeringEngine, ProjectMemoryManager } from '@specsafe/core';
import { input, editor, select, confirm } from '@inquirer/prompts';

export const newCommand = new Command('new')
  .alias('create')
  .description('Create a new spec with interactive PRD creation')
  .argument('[name]', 'Spec name (kebab-case)')
  .option('-d, --description <desc>', 'Spec description')
  .option('-a, --author <author>', 'Author name', 'developer')
  .option('-n, --dry-run', 'Preview changes without writing files')
  .option('--skip-interactive', 'Skip interactive prompts and use defaults')
  .option('--ears', 'Use EARS (Easy Approach to Requirements Syntax) template')
  .action(async (name: string | undefined, options: { description?: string; author: string; dryRun?: boolean; skipInteractive?: boolean; ears?: boolean }) => {
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

      // Load project memory for context
      let steeringEngine: SteeringEngine | null = null;
      let memoryContext: {
        patterns: { name: string; usageCount: number; description: string }[];
        warnings: { type: string; message: string; severity: string }[];
        recommendations: { type: string; message: string; confidence: string }[];
      } | null = null;

      try {
        steeringEngine = new SteeringEngine(process.cwd());
        await steeringEngine.initialize(basename(process.cwd()));
        
        const analysis = steeringEngine.analyze({ currentSpec: id });
        
        // Get top patterns
        const patterns = steeringEngine.recommendPatterns(id, 3).map(p => ({
          name: p.name,
          usageCount: p.usageCount,
          description: p.description
        }));

        memoryContext = {
          patterns,
          warnings: analysis.warnings,
          recommendations: analysis.recommendations
        };
      } catch {
        // Memory not available yet, that's fine
      }

      // Interactive mode or defaults
      spinner.stop();

      // Get feature name if not provided
      let featureName = name;
      if (!featureName && !options.skipInteractive) {
        featureName = await input({
          message: 'Feature name (kebab-case):',
          validate: (value) => value.length > 0 || 'Feature name is required'
        });
      } else if (!featureName) {
        featureName = 'untitled-feature';
      }

      // Display project memory context if available
      if (memoryContext && (memoryContext.patterns.length > 0 || memoryContext.recommendations.length > 0)) {
        console.log(chalk.blue('\n🧠 Project Memory Context\n'));
        
        if (memoryContext.patterns.length > 0) {
          console.log(chalk.cyan('Reusable patterns from project:'));
          for (const pattern of memoryContext.patterns) {
            const color = pattern.usageCount >= 3 ? chalk.green : chalk.yellow;
            console.log(color(`  • ${pattern.name} ${chalk.gray(`(${pattern.usageCount} specs)`)}`));
            console.log(chalk.gray(`    ${pattern.description}`));
          }
          console.log();
        }

        if (memoryContext.recommendations.length > 0) {
          console.log(chalk.cyan('Recommendations:'));
          for (const rec of memoryContext.recommendations.slice(0, 3)) {
            const icon = rec.confidence === 'high' ? '✓' : rec.confidence === 'medium' ? '~' : '?';
            console.log(chalk.gray(`  ${icon} ${rec.message}`));
          }
          console.log();
        }

        if (memoryContext.warnings.length > 0) {
          const highSeverity = memoryContext.warnings.filter(w => w.severity === 'high');
          if (highSeverity.length > 0) {
            console.log(chalk.yellow('⚠️  Warnings:'));
            for (const warning of highSeverity.slice(0, 2)) {
              console.log(chalk.yellow(`  • ${warning.message}`));
            }
            console.log();
          }
        }

        console.log(chalk.gray('─'.repeat(63)));
      }

      // Interactive PRD + BRD creation
      let problemStatement = '';
      let userStories = '';
      let acceptanceCriteria = '';
      let technicalConsiderations = '';
      let businessJustification = '';
      let successMetrics = '';
      let stakeholders = '';
      let timeline = '';
      let priority: 'P0' | 'P1' | 'P2' = 'P1';

      if (!options.skipInteractive && !options.dryRun && !options.ears) {
        console.log(chalk.blue('\n📋 Let\'s create a Product Requirements Document (PRD)\n'));

        problemStatement = await editor({
          message: 'Problem Statement (what problem does this solve?):',
          default: '<!-- Describe the problem this feature solves -->'
        });

        userStories = await editor({
          message: 'User Stories (who benefits and how?):',
          default: `As a [type of user]
I want [some goal]
So that [some reason]

<!-- Add more user stories as needed -->`
        });

        acceptanceCriteria = await editor({
          message: 'Acceptance Criteria (how do we know it\'s done?):',
          default: `- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3`
        });

        technicalConsiderations = await editor({
          message: 'Technical Requirements (dependencies, constraints, stack):',
          default: `<!-- Technical constraints, dependencies, integrations needed -->
- Required APIs:
- Data storage:
- Security requirements:`
        });

        console.log(chalk.blue('\n💼 Now let\'s create a Business Requirements Document (BRD)\n'));

        businessJustification = await editor({
          message: 'Business Justification (why invest in this?):',
          default: `<!-- Why should we build this? Business value, market need, strategic alignment -->`
        });

        successMetrics = await editor({
          message: 'Success Metrics (how do we measure success?):',
          default: `- Metric 1: [e.g., "Reduce processing time by 50%"]
- Metric 2: [e.g., "Increase user engagement by 20%"]
- Metric 3: [e.g., "Zero critical bugs in production"]`
        });

        stakeholders = await editor({
          message: 'Stakeholders (who cares about this?):',
          default: `| Role | Name/Team | Responsibility |
|------|-----------|----------------|
| Product Owner | | Decision maker |
| Engineering Lead | | Technical oversight |
| QA Lead | | Quality assurance |`
        });

        timeline = await editor({
          message: 'Timeline (key milestones):',
          default: `| Phase | Milestone | Target Date |
|-------|-----------|-------------|
| 1 | Requirements final | |
| 2 | Development complete | |
| 3 | QA complete | |
| 4 | Release | |`
        });

        priority = await select({
          message: 'Priority:',
          choices: [
            { name: 'P0 - Critical (blocks release)', value: 'P0' },
            { name: 'P1 - High (should have)', value: 'P1' },
            { name: 'P2 - Medium (nice to have)', value: 'P2' },
          ],
          default: 'P1'
        });
      }

      spinner.start('Creating spec files...');

      // Create spec
      const spec = workflow.createSpec(
        id,
        featureName,
        options.description || `Spec for ${featureName}`,
        options.author,
        basename(process.cwd())
      );

      // Use EARS template if requested
      let specContent: string;
      if (options.ears) {
        specContent = generateEARSTemplate(id, featureName, options.author, priority);
      } else {
        // Create PRD + BRD-enhanced spec content
        specContent = `# ${featureName} Specification

**ID:** ${id}
**Status:** SPEC
**Created:** ${new Date().toISOString().split('T')[0]}
**Author:** ${options.author}
**Priority:** ${priority}

---

## PRD (Product Requirements Document)

### Problem Statement
${problemStatement || '<!-- Describe the problem this feature solves -->'}

### User Stories
${userStories || `As a [type of user]
I want [some goal]
So that [some reason]

<!-- Add more user stories as needed -->`}

### Acceptance Criteria
${acceptanceCriteria || `- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3`}

### Technical Requirements
${technicalConsiderations || `<!-- Technical constraints, dependencies, integrations needed -->
- Required APIs:
- Data storage:
- Security requirements:`}

---

## BRD (Business Requirements Document)

### Business Justification
${businessJustification || '<!-- Why should we build this? Business value, market need, strategic alignment -->'}

### Success Metrics
${successMetrics || `- Metric 1: [e.g., "Reduce processing time by 50%"]
- Metric 2: [e.g., "Increase user engagement by 20%"]
- Metric 3: [e.g., "Zero critical bugs in production"]`}

### Stakeholders
${stakeholders || `| Role | Name/Team | Responsibility |
|------|-----------|----------------|
| Product Owner | | Decision maker |
| Engineering Lead | | Technical oversight |
| QA Lead | | Quality assurance |`}

### Timeline
${timeline || `| Phase | Milestone | Target Date |
|-------|-----------|-------------|
| 1 | Requirements final | |
| 2 | Development complete | |
| 3 | QA complete | |
| 4 | Release | |`}

---

## Scope (WHAT)

### In Scope
-

### Out of Scope
-

## Requirements

### Functional Requirements
| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-1 | | P0 | |

### Non-Functional Requirements
| ID | Requirement | Metric |
|----|-------------|--------|
| NFR-1 | | |

## Scenarios (Given/When/Then)

### Scenario 1: [Name]
- **Given** [initial context]
- **When** [action/event occurs]
- **Then** [expected outcome]

## Technical Approach (HOW)

### Tech Stack
<!-- Refer to .specsafe/tech-stack.md -->

### Architecture

### Dependencies

## Test Strategy (TDD)

### Unit Tests
-

### Integration Tests
-

## Implementation Plan

| Phase | Task | Est. Time | Dependencies |
|-------|------|-----------|--------------|
| 1 | | | |

## Success Criteria
- [ ] All P0 requirements met
- [ ] All tests passing
- [ ] Documentation complete

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| | | | |

## Notes & References
-

---

*Generated by SpecSafe v0.4.0 - OpenSpec Workflow*
`;
      }

      const specPath = join('specs/active', `${id}.md`);

      // Handle dry-run mode
      if (options.dryRun) {
        spinner.stop();
        console.log(chalk.cyan('[DRY RUN] Would create the following files:\n'));
        console.log(chalk.cyan(`  ${specPath}`));
        console.log(chalk.cyan(`\nContent preview (first 30 lines):\n`));
        const previewLines = specContent.split('\n').slice(0, 30).join('\n');
        console.log(chalk.gray(previewLines));
        if (specContent.split('\n').length > 30) {
          console.log(chalk.gray('  ... (truncated)'));
        }
        console.log(chalk.cyan(`\nWould update PROJECT_STATE.md with spec: ${id}`));
        process.exit(0);
      }

      // Create .specsafe directory and supporting files
      await mkdir('.specsafe', { recursive: true });

      // Create tech-stack.md if it doesn't exist
      const techStackPath = join('.specsafe', 'tech-stack.md');

      const techStackContent = `# Tech Stack

**Project:** ${basename(process.cwd())}
**Last Updated:** ${new Date().toISOString().split('T')[0]}

## Core Technologies

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Language | TypeScript | ^5.0 | Primary language |
| Testing | Vitest | ^1.0 | Unit testing |
| Linting | ESLint | ^8.0 | Code quality |

## Project Structure

\`\`\`
src/
├── components/     # UI components
├── utils/          # Utility functions
└── index.ts        # Entry point

tests/
└── *.test.ts       # Test files

specs/
├── active/         # Active specs
├── completed/      # Completed specs
└── archive/        # Archived specs
\`\`\`

## Dependencies

### Production
- None yet

### Development
- @specsafe/core
- @specsafe/cli
- @specsafe/test-gen

## Guidelines

1. Follow existing code patterns
2. Write tests before implementation
3. Update specs as requirements change
4. Use TypeScript strict mode

---

*Auto-generated by specsafe new*
`;

      // Create rules.md if it doesn't exist
      const rulesContent = `# Project Rules

**Project:** ${basename(process.cwd())}
**Last Updated:** ${new Date().toISOString().split('T')[0]}

## Coding Standards

1. **TypeScript First**: All code must be TypeScript with strict mode enabled
2. **Test-Driven**: Write tests before implementation
3. **Documentation**: Document all public APIs
4. **Error Handling**: Always handle errors gracefully

## SpecSafe Workflow Rules

1. **SPEC Stage**: Requirements must be clear and testable
2. **TEST Stage**: All tests must be written before code
3. **CODE Stage**: Implementation follows tests exactly
4. **QA Stage**: All tests must pass before completion
5. **COMPLETE Stage**: Archive spec after completion

## AI Assistant Guidelines

When assisting with this project:

1. Always read the relevant spec before making changes
2. Follow the acceptance criteria in the PRD
3. Update spec status as work progresses
4. Suggest running \`specsafe verify\` after changes
5. Respect the out-of-scope section

## Communication Style

- Be concise but thorough
- Provide code examples when helpful
- Explain the "why" behind suggestions
- Flag any spec violations immediately

---

*Auto-generated by specsafe new*
`;

      // Create spec file
      await mkdir('specs/active', { recursive: true });
      await writeFile(specPath, specContent);

      // Create supporting files (only if they don't exist)
      try {
        await writeFile(techStackPath, techStackContent, { flag: 'wx' });
      } catch {
        // File already exists, skip
      }

      try {
        await writeFile(join('.specsafe', 'rules.md'), rulesContent, { flag: 'wx' });
      } catch {
        // File already exists, skip
      }

      // Update project state
      await tracker.addSpec(spec);

      // Update project memory
      try {
        const memoryManager = new ProjectMemoryManager(process.cwd());
        await memoryManager.load(basename(process.cwd()));
        memoryManager.addSpec(id);
        await memoryManager.save();
      } catch {
        // Memory update failed, but spec was created - don't fail
      }

      spinner.succeed(chalk.green(`Created spec: ${id}${options.ears ? ' (EARS format)' : ''}`));
      console.log(chalk.blue(`  Location: ${specPath}`));
      console.log(chalk.blue(`  Tech Stack: .specsafe/tech-stack.md`));
      console.log(chalk.blue(`  Rules: .specsafe/rules.md`));
      if (options.ears) {
        console.log(chalk.green('\n  ✨ Using EARS (Easy Approach to Requirements Syntax)'));
        console.log(chalk.gray('  EARS patterns make requirements testable by construction'));
      }
      console.log(chalk.gray('\n  Next steps:'));
      console.log(chalk.gray(`    1. Edit ${specPath} to refine requirements`));
      if (options.ears) {
        console.log(chalk.gray(`    2. Follow EARS patterns in the template`));
        console.log(chalk.gray(`    3. Run: specsafe qa ${id} --ears (to validate EARS compliance)`));
      } else {
        console.log(chalk.gray(`    2. Run: specsafe spec ${id}`));
        console.log(chalk.gray(`    3. Or explore: specsafe explore`));
      }
    } catch (error: any) {
      spinner.fail(chalk.red(`Failed to create spec: ${error.message}`));
      if (error.message.includes('specs/active/')) {
        console.log(chalk.gray('💡 Tip: Run "specsafe init" to initialize the project first.'));
      } else if (error.message.includes('already exists')) {
        console.log(chalk.gray('💡 Tip: Use a different spec name or delete the existing spec first.'));
      } else if (error.message.includes('User force closed')) {
        console.log(chalk.gray('💡 Tip: Creation was cancelled.'));
        process.exit(0);
      }
      process.exit(1);
    }
  });
