import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { Workflow, ProjectTracker, validateSpecId } from '@specsafe/core';
import { readFile, writeFile } from 'fs/promises';
import { join, basename } from 'path';
import { input, editor, confirm } from '@inquirer/prompts';

export const specCommand = new Command('spec')
  .description('Validate spec and enhance with AI-assisted generation from PRD')
  .argument('<id>', 'Spec ID (or use --from-prd to generate from PRD)')
  .option('--from-prd', 'Generate detailed spec from PRD section')
  .option('--interactive', 'Use interactive mode to refine requirements', true)
  .option('--auto-generate', 'Auto-generate scenarios from PRD')
  .action(async (id: string, options: { fromPrd?: boolean; interactive?: boolean; autoGenerate?: boolean }) => {
    const spinner = ora(`Processing ${id}...`).start();
    
    try {
      // Validate spec ID format
      validateSpecId(id);

      const workflow = new Workflow();
      const tracker = new ProjectTracker(process.cwd());
      
      // Load existing specs from disk
      await tracker.loadSpecsIntoWorkflow(workflow);
      
      // Check if spec exists
      let spec = workflow.getSpec(id);
      let specContent: string;
      let specPath: string;
      
      if (!spec) {
        // Try to load from file
        try {
          specPath = join('specs/active', `${id}.md`);
          specContent = await readFile(specPath, 'utf-8');
          
          // Extract name from content (first heading)
          const nameMatch = specContent.match(/^#\s+(.+?)\s+Specification/m);
          const name = nameMatch ? nameMatch[1] : id;
          
          // Create spec in workflow
          spec = workflow.createSpec(
            id,
            name,
            `Spec loaded from ${specPath}`,
            'developer',
            basename(process.cwd())
          );
          
          await tracker.addSpec(spec);
          
          spinner.text = `Loaded spec from file...`;
        } catch (fileError) {
          throw new Error(`Spec ${id} not found. Run 'specsafe new <name>' to create it first.`);
        }
      } else {
        specPath = join('specs/active', `${id}.md`);
        try {
          specContent = await readFile(specPath, 'utf-8');
        } catch {
          throw new Error(`Spec file not found: ${specPath}`);
        }
      }

      spinner.stop();

      // Check if PRD section exists
      const hasPrd = specContent.includes('## 1. Product Requirements Document') ||
                     specContent.includes('## Problem Statement');

      if (!hasPrd) {
        console.log(chalk.yellow('\n⚠️  No PRD section found in spec.'));
        const shouldAdd = await confirm({
          message: 'Would you like to add a PRD section?',
          default: true
        });

        if (shouldAdd) {
          const problemStatement = await editor({
            message: 'Problem Statement:',
            default: 'Describe the problem this feature solves...'
          });

          const userStories = await editor({
            message: 'User Stories:',
            default: 'As a [user], I want [goal], so that [reason]'
          });

          // Insert PRD section after metadata
          const prdSection = `\n## 1. Product Requirements Document (PRD)\n\n### 1.1 Problem Statement\n${problemStatement}\n\n### 1.2 User Stories\n${userStories}\n\n### 1.3 Acceptance Criteria\n- [ ] Criterion 1\n- [ ] Criterion 2\n\n### 1.4 Technical Considerations\n\n`;

          const insertPoint = specContent.indexOf('## 2.');
          if (insertPoint > 0) {
            specContent = specContent.slice(0, insertPoint) + prdSection + specContent.slice(insertPoint);
          } else {
            specContent += '\n' + prdSection;
          }

          await writeFile(specPath, specContent);
          console.log(chalk.green('\n✅ Added PRD section to spec'));
        }
      }

      // Parse PRD and generate requirements
      if (options.fromPrd || options.autoGenerate) {
        spinner.start('Generating requirements from PRD...');
        
        const generatedRequirements = parsePrdForRequirements(specContent);
        const generatedScenarios = parsePrdForScenarios(specContent);
        
        spinner.stop();

        if (generatedRequirements.length > 0) {
          console.log(chalk.blue('\n📋 Generated Requirements from PRD:\n'));
          for (const req of generatedRequirements) {
            console.log(chalk.white(`  ${req.id}: ${req.text}`));
          }

          if (options.interactive) {
            const shouldAdd = await confirm({
              message: 'Add these requirements to the spec?',
              default: true
            });

            if (shouldAdd) {
              // Update spec with requirements
              spec.requirements = [
                ...spec.requirements,
                ...generatedRequirements.filter(r => !spec.requirements.some((er: any) => er.id === r.id))
              ];

              // Update spec content
              specContent = updateRequirementsSection(specContent, generatedRequirements);
              await writeFile(specPath, specContent);
              console.log(chalk.green(`\n✅ Added ${generatedRequirements.length} requirements`));
            }
          }
        }

        if (generatedScenarios.length > 0) {
          console.log(chalk.blue('\n🎬 Generated Scenarios:\n'));
          for (const scenario of generatedScenarios) {
            console.log(chalk.white(`  Scenario: ${scenario.name}`));
          }

          if (options.interactive) {
            const shouldAddScenarios = await confirm({
              message: 'Add these scenarios to the spec?',
              default: true
            });

            if (shouldAddScenarios) {
              specContent = updateScenariosSection(specContent, generatedScenarios);
              await writeFile(specPath, specContent);
              console.log(chalk.green(`\n✅ Added ${generatedScenarios.length} scenarios`));
            }
          }
        }
      }

      // Interactive refinement
      if (options.interactive) {
        const addMore = await confirm({
          message: 'Add additional requirements interactively?',
          default: spec.requirements.length === 0
        });

        if (addMore) {
          let adding = true;
          while (adding) {
            const reqText = await input({
              message: 'Requirement description (or press Enter to finish):'
            });

            if (!reqText) {
              adding = false;
              break;
            }

            const priority = await input({
              message: 'Priority (P0/P1/P2):',
              default: 'P1'
            }) as 'P0' | 'P1' | 'P2';

            const newReq = {
              id: `FR-${spec.requirements.length + 1}`,
              text: reqText,
              priority,
              scenarios: []
            };

            spec.requirements.push(newReq);
            
            // Update file
            specContent = updateRequirementsSection(specContent, [newReq]);
            await writeFile(specPath, specContent);
            
            console.log(chalk.green(`  Added: ${newReq.id}`));
          }
        }
      }

      // Validate requirements
      if (spec.requirements.length === 0) {
        console.log(chalk.yellow('\n⚠️  No requirements defined yet'));
        console.log(chalk.blue('Add requirements to the spec file before moving to TEST stage'));
      } else {
        spinner.succeed(chalk.green(`${id} validated: ${spec.requirements.length} requirements defined`));
      }
      
      // Persist state
      await tracker.addSpec(spec);
      
      console.log(chalk.blue('\nNext steps:'));
      console.log(chalk.gray(`  • Run: specsafe test ${id}  → Generate tests from requirements`));
      console.log(chalk.gray(`  • Run: specsafe verify ${id} → Verify implementation`));
      
    } catch (error: any) {
      spinner.fail(chalk.red(error.message));
      if (error.message.includes('not found')) {
        console.log(chalk.gray(`💡 Tip: Run 'specsafe new <name>' to create a spec first.`));
        console.log(chalk.gray(`   Expected file: specs/active/SPEC-YYYYMMDD-NNN.md`));
      }
      process.exit(1);
    }
  });

function parsePrdForRequirements(content: string): Array<{ id: string; text: string; priority: 'P0' | 'P1' | 'P2'; scenarios: any[] }> {
  const requirements: Array<{ id: string; text: string; priority: 'P0' | 'P1' | 'P2'; scenarios: any[] }> = [];
  
  // Extract user stories
  const userStoryMatch = content.match(/### 1\.2 User Stories\n([\s\S]*?)(?=###|$)/);
  if (userStoryMatch) {
    const stories = userStoryMatch[1]
      .split('\n')
      .filter(line => line.trim().match(/^As\s+a/i))
      .map(line => line.trim());
    
    stories.forEach((story, index) => {
      requirements.push({
        id: `FR-${index + 1}`,
        text: story,
        priority: 'P1',
        scenarios: []
      });
    });
  }

  // Extract acceptance criteria
  const criteriaMatch = content.match(/### 1\.3 Acceptance Criteria\n([\s\S]*?)(?=###|$)/);
  if (criteriaMatch) {
    const criteria = criteriaMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('- [ ]') || line.trim().startsWith('- '))
      .map(line => line.replace(/^- \[ \]\s*/, '').replace(/^- \[x\]\s*/i, '').replace(/^- /, '').trim());
    
    criteria.forEach((criterion, index) => {
      if (!requirements.some(r => r.text.includes(criterion))) {
        requirements.push({
          id: `FR-${requirements.length + 1}`,
          text: `Acceptance: ${criterion}`,
          priority: 'P0',
          scenarios: []
        });
      }
    });
  }

  return requirements;
}

function parsePrdForScenarios(content: string): Array<{ name: string; given: string; when: string; then: string }> {
  const scenarios: Array<{ name: string; given: string; when: string; then: string }> = [];
  
  // Try to extract from user stories
  const userStoryMatch = content.match(/### 1\.2 User Stories\n([\s\S]*?)(?=###|$)/);
  if (userStoryMatch) {
    const stories = userStoryMatch[1]
      .split('\n')
      .filter(line => line.trim().match(/^As\s+a/i));
    
    stories.forEach((story, index) => {
      // Parse "As a X, I want Y, so that Z"
      const match = story.match(/As\s+a[n]?\s+(\w+),?\s*I\s+want\s+(.+?),?\s*so\s+that\s+(.+)/i);
      if (match) {
        scenarios.push({
          name: `User ${match[1]} completes goal`,
          given: `I am a ${match[1]}`,
          when: `I want to ${match[2]}`,
          then: `I can ${match[3]}`
        });
      }
    });
  }

  return scenarios;
}

function updateRequirementsSection(content: string, newRequirements: any[]): string {
  // Find or create the requirements table
  const tableHeader = '| ID | Requirement | Priority | Acceptance Criteria |';
  const tableSeparator = '|----|-------------|----------|---------------------|';
  
  const requirementsRows = newRequirements.map(r => 
    `| ${r.id} | ${r.text} | ${r.priority} | |`
  );

  if (content.includes(tableHeader)) {
    // Append to existing table
    const tableEndMatch = content.match(/\| FR-\d+ \|[^|]+\|[^|]+\|[^|]+\|/g);
    if (tableEndMatch) {
      const lastRow = tableEndMatch[tableEndMatch.length - 1];
      const insertIndex = content.indexOf(lastRow) + lastRow.length;
      content = content.slice(0, insertIndex) + '\n' + requirementsRows.join('\n') + content.slice(insertIndex);
    }
  }

  return content;
}

function updateScenariosSection(content: string, scenarios: any[]): string {
  const scenariosText = scenarios.map((s, i) => 
    `### Scenario ${i + 1}: ${s.name}
- **Given** ${s.given}
- **When** ${s.when}
- **Then** ${s.then}
`
  ).join('\n');

  // Find "## 4. Scenarios" section
  const scenariosMatch = content.match(/## 4\. Scenarios[\s\S]*?(?=## 5\.|## 6\.|$)/);
  if (scenariosMatch) {
    // Append to existing scenarios
    const insertPoint = content.indexOf(scenariosMatch[0]) + scenariosMatch[0].length;
    content = content.slice(0, insertPoint) + '\n' + scenariosText + content.slice(insertPoint);
  }

  return content;
}
