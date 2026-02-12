/**
 * Specification Generator
 * Converts elicitation results into SpecSafe-formatted markdown specs
 */

import type { ElicitationResult } from './types.js';

/**
 * Generate a SpecSafe-formatted specification from elicitation results
 * 
 * @param result The completed elicitation result
 * @returns Markdown-formatted specification
 * 
 * @example
 * ```typescript
 * const result = engine.getResult();
 * const spec = generateSpec(result);
 * await writeFile('specs/SPEC-001.md', spec);
 * ```
 */
export function generateSpec(result: ElicitationResult): string {
  const { flowId, answers } = result;

  switch (flowId) {
    case 'quick':
      return generateQuickSpec(answers);
    case 'full':
      return generateFullSpec(answers);
    case 'ears':
      return generateEARSSpec(answers);
    default:
      throw new Error(`Unknown flow ID: ${flowId}`);
  }
}

/**
 * Generate spec from quick flow
 */
function generateQuickSpec(answers: Record<string, any>): string {
  const specId = generateSpecId();
  const date = new Date().toISOString().split('T')[0];

  const requirements = (answers.requirements as string)
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(req => `- ${req.trim()}`)
    .join('\n');

  return `# ${answers.name}

## Metadata
- **Spec ID**: ${specId}
- **Created**: ${date}
- **Type**: ${answers.type}
- **Priority**: ${answers.priority}
- **Status**: draft

## Description

${answers.description}

## Requirements

${requirements}

## Testing Strategy

- [ ] Unit tests for core functionality
- [ ] Integration tests for workflows
- [ ] End-to-end tests for user scenarios

## Acceptance Criteria

- All requirements implemented
- All tests passing
- Code reviewed and approved

## Notes

Created via SpecSafe quick flow elicitation.
`;
}

/**
 * Generate spec from full flow
 */
function generateFullSpec(answers: Record<string, any>): string {
  const specId = generateSpecId();
  const date = new Date().toISOString().split('T')[0];

  const requirements = (answers.requirements as string)
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(req => `- ${req.trim()}`)
    .join('\n');

  let spec = `# ${answers.name}

## Metadata
- **Spec ID**: ${specId}
- **Created**: ${date}
- **Type**: ${answers.type}
- **Priority**: ${answers.priority}
- **Status**: draft

## Description

${answers.description}
`;

  if (answers.scope) {
    spec += `\n## Scope

${answers.scope}
`;
  }

  if (answers.stakeholders) {
    const stakeholderList = (answers.stakeholders as string)
      .split(',')
      .map(s => `- ${s.trim()}`)
      .join('\n');
    spec += `\n## Stakeholders

${stakeholderList}
`;
  }

  spec += `\n## Requirements

${requirements}
`;

  if (answers.has_security && answers.security_considerations) {
    spec += `\n## Security Considerations

${answers.security_considerations}
`;
  }

  spec += `\n## Testing Strategy

${answers.testing_strategy}
`;

  if (answers.has_performance && answers.performance_requirements) {
    spec += `\n## Performance Requirements

${answers.performance_requirements}
`;
  }

  if (answers.dependencies) {
    const depList = (answers.dependencies as string)
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(dep => `- ${dep.trim()}`)
      .join('\n');
    spec += `\n## Dependencies

${depList}
`;
  }

  if (answers.timeline) {
    spec += `\n## Timeline

${answers.timeline}
`;
  }

  if (answers.risks) {
    const riskList = (answers.risks as string)
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(risk => `- ${risk.trim()}`)
      .join('\n');
    spec += `\n## Risks

${riskList}
`;
  }

  spec += `\n## Acceptance Criteria

${answers.acceptance_criteria}
`;

  if (answers.notes) {
    spec += `\n## Notes

${answers.notes}
`;
  }

  spec += `\n---

Created via SpecSafe full flow elicitation.
`;

  return spec;
}

/**
 * Generate spec from EARS flow
 */
function generateEARSSpec(answers: Record<string, any>): string {
  const specId = generateSpecId();
  const date = new Date().toISOString().split('T')[0];
  const reqCount = parseInt(answers.req_count, 10);

  let spec = `# ${answers.name}

## Metadata
- **Spec ID**: ${specId}
- **Created**: ${date}
- **Type**: feature
- **Format**: EARS
- **Status**: draft

## Description

${answers.description}

## Requirements (EARS Format)

`;

  for (let i = 1; i <= reqCount; i++) {
    const typeKey = `req_${i}_type`;
    const triggerKey = `req_${i}_trigger`;
    const preconditionKey = `req_${i}_precondition`;
    const responseKey = `req_${i}_response`;

    const type = answers[typeKey];
    const response = answers[responseKey];

    if (!response) continue;

    spec += `### REQ-${i.toString().padStart(3, '0')}\n\n`;

    switch (type) {
      case 'ubiquitous':
        spec += `**Type**: Ubiquitous\n\n`;
        spec += `The system shall ${response}\n\n`;
        break;

      case 'event':
        const trigger = answers[triggerKey];
        spec += `**Type**: Event-driven\n\n`;
        spec += `WHEN ${trigger}, the system shall ${response}\n\n`;
        break;

      case 'state':
        const statePrecondition = answers[preconditionKey];
        spec += `**Type**: State-driven\n\n`;
        spec += `WHILE ${statePrecondition}, the system shall ${response}\n\n`;
        break;

      case 'optional':
        const optionalPrecondition = answers[preconditionKey];
        spec += `**Type**: Optional\n\n`;
        spec += `WHERE ${optionalPrecondition}, the system shall ${response}\n\n`;
        break;

      case 'unwanted':
        spec += `**Type**: Unwanted behavior\n\n`;
        spec += `IF [unwanted condition], then the system shall ${response}\n\n`;
        break;
    }
  }

  spec += `## Testing Strategy

- [ ] Validate each EARS requirement with specific test cases
- [ ] Test trigger conditions for event-driven requirements
- [ ] Test state conditions for state-driven requirements
- [ ] Verify optional requirements under specified conditions

## Acceptance Criteria

- All EARS requirements implemented and tested
- Requirements follow EARS syntax properly
- All tests passing with >80% coverage

---

Created via SpecSafe EARS flow elicitation.
`;

  return spec;
}

/**
 * Generate a unique spec ID
 */
function generateSpecId(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `SPEC-${year}${month}${day}-${random}`;
}
