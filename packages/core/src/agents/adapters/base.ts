/**
 * Base Agent Adapter
 * Abstract base class with common functionality for all agents
 */

import { access } from 'fs/promises';
import { join } from 'path';
import type { AgentAdapter, AgentDefinition, GeneratedFile, GenerateOptions } from '../types.js';

/**
 * Base adapter with common functionality
 */
export abstract class BaseAgentAdapter implements AgentAdapter {
  abstract agent: AgentDefinition;

  /**
   * Detect if agent is configured by checking for detection files
   */
  async detect(projectDir: string): Promise<boolean> {
    for (const file of this.agent.detectionFiles) {
      try {
        await access(join(projectDir, file));
        return true;
      } catch {
        // File doesn't exist, continue
      }
    }
    return false;
  }

  /**
   * Generate configuration files - must be implemented by subclasses
   */
  abstract generateConfig(projectDir: string, options?: GenerateOptions): Promise<GeneratedFile[]>;

  /**
   * Generate command files - must be implemented by subclasses
   */
  abstract generateCommands(projectDir: string, options?: GenerateOptions): Promise<GeneratedFile[]>;

  /**
   * Get usage instructions - must be implemented by subclasses
   */
  abstract getInstructions(): string;

  /**
   * Helper: Generate SpecSafe workflow commands
   */
  protected getWorkflowCommands(): string[] {
    return [
      'specsafe',
      'specsafe-explore',
      'specsafe-new',
      'specsafe-spec',
      'specsafe-test-create',
      'specsafe-test-apply',
      'specsafe-verify',
      'specsafe-done',
    ];
  }

  /**
   * Helper: Get command description
   */
  protected getCommandDescription(command: string): string {
    const descriptions: Record<string, string> = {
      'specsafe': 'Show SpecSafe project status',
      'specsafe-explore': 'Pre-spec exploration and research',
      'specsafe-new': 'Initialize spec with PRD',
      'specsafe-spec': 'Generate detailed spec from PRD',
      'specsafe-test-create': 'Create tests from spec scenarios',
      'specsafe-test-apply': 'Apply tests - development mode',
      'specsafe-verify': 'Verify implementation and iterate',
      'specsafe-done': 'Complete and archive spec',
    };
    return descriptions[command] || '';
  }

  /**
   * Helper: Get command prompt
   */
  protected getCommandPrompt(command: string): string {
    const prompts: Record<string, string> = {
      'specsafe': `Read PROJECT_STATE.md and provide:
1. Summary of active specs and their current stages
2. Which specs need attention
3. Recommended next actions
4. Brief reminder of the SDD workflow`,

      'specsafe-explore': `You are in exploration mode. Guide pre-spec research:
- Define problem and identify target users
- Research existing solutions and competitors
- Evaluate technology options with pros/cons
- Estimate effort (S/M/L/XL)
- Document findings in specs/exploration/FEATURE-NAME.md

Decision Gate: Recommend proceeding to spec creation or gathering more information.`,

      'specsafe-new': `Create a new spec with Product Requirements Document:
1. Generate spec ID: SPEC-YYYYMMDD-NNN
2. Create PRD with problem statement, requirements, scenarios
3. Recommend tech stack and define rules
4. Output to specs/drafts/SPEC-ID.md
5. Update PROJECT_STATE.md (status: DRAFT)

Always confirm with user before writing files.`,

      'specsafe-spec': `Convert PRD to comprehensive specification:
- Read PRD from specs/drafts/SPEC-ID.md
- Create functional requirements (FR-XXX)
- Create technical requirements (TR-XXX)
- Define scenarios (Given/When/Then)
- Write acceptance criteria
- Add architecture notes

Move to specs/active/SPEC-ID.md and update PROJECT_STATE.md (DRAFT → SPEC).`,

      'specsafe-test-create': `Generate comprehensive test suite:
1. Read spec from specs/active/SPEC-ID.md
2. Create test files in src/__tests__/SPEC-ID/
3. Map Given/When/Then scenarios to test cases
4. Include happy path and edge cases
5. Update PROJECT_STATE.md (SPEC → TEST-CREATE)

Report test count and coverage expectations.`,

      'specsafe-test-apply': `Guide implementation for active spec:
- Read requirements and existing tests
- Implement one requirement at a time
- Follow cycle: Plan → Implement → Test → Commit
- Map every change to requirement IDs
- Never modify tests to make them pass (fix the code)
- Update PROJECT_STATE.md (TEST-CREATE → TEST-APPLY)

Ask: "Which requirement should we tackle next?"`,

      'specsafe-verify': `Verify implementation by running tests:
1. Execute test suite: npm test -- SPEC-ID
2. Analyze failures and map to requirements
3. Fix code (not tests) and re-run
4. Iterate until all tests pass
5. Check coverage meets requirements
6. Run full suite for regressions

Update PROJECT_STATE.md (TEST-APPLY → VERIFY).
Report: pass rate, coverage %, issues.`,

      'specsafe-done': `Finalize spec after all tests pass:
- Verify completion checklist
- Run final test suite
- Move specs/active/SPEC-ID.md → specs/archive/SPEC-ID.md
- Update PROJECT_STATE.md (VERIFY → COMPLETE)
- Generate completion summary
- Suggest next spec from active list

Ask for confirmation before archiving.`,
    };
    return prompts[command] || '';
  }

  /**
   * Helper: Get the main SpecSafe context
   */
  protected getMainContext(): string {
    return `You are working on a SpecSafe project using spec-driven development (SDD).

## Project Context

Always read PROJECT_STATE.md first. It contains:
- Active specs and their current stages
- Which spec is being worked on
- Overall project status

## Spec-Driven Development Workflow

EXPLORE → NEW → SPEC → TEST-CREATE → TEST-APPLY → VERIFY → DONE

## Critical Rules

ALWAYS:
- Read PROJECT_STATE.md before making changes
- Ensure implementation satisfies tests
- Use spec ID in commit messages: type(SPEC-XXX): description
- Run tests before marking work complete

NEVER:
- Skip tests to implement faster
- Modify PROJECT_STATE.md directly (use CLI commands)
- Break verify loop by ignoring test failures
- Modify tests to make them pass without discussion
- Commit code without spec reference`;
  }
}
