import { BUILTIN_PRINCIPLES } from './builtins.js';

export interface GenerateConstitutionOptions {
  projectName?: string;
  author?: string;
  description?: string;
  includePrinciples?: string[];
  includeAllBuiltins?: boolean;
}

export function generateConstitution(options: GenerateConstitutionOptions = {}): string {
  const { projectName = 'My Project', author = 'Unknown', description = 'Project governance constitution', includePrinciples = [], includeAllBuiltins = true } = options;

  let principles = includeAllBuiltins ? BUILTIN_PRINCIPLES : BUILTIN_PRINCIPLES.filter(p => includePrinciples.includes(p.id));

  if (!includeAllBuiltins && includePrinciples.length === 0) {
    const recommended = ['tdd-mandatory', 'require-acceptance-criteria', 'require-ears-format'];
    principles = BUILTIN_PRINCIPLES.filter(p => recommended.includes(p.id));
  }

  const now = new Date().toISOString();
  
  // Helper to safely quote YAML string values
  const quoteValue = (val: string) => JSON.stringify(val);

  let content = `---
# SpecSafe Project Constitution
projectName: ${quoteValue(projectName)}
author: ${quoteValue(author)}
version: "1.0.0"
createdAt: ${now}
updatedAt: ${now}

principles:
`;

  for (const principle of principles) {
    content += `- id: ${principle.id}\n`;
    content += `  name: ${quoteValue(principle.name)}\n`;
    content += `  description: ${quoteValue(principle.description)}\n`;
    content += `  severity: ${principle.severity}\n`;
    content += `  immutable: ${principle.immutable}\n`;
    if (principle.metadata?.rationale) {
      content += `  rationale: ${quoteValue(principle.metadata.rationale)}\n`;
    }
    content += `\n`;
  }

  content += `---

# Project Constitution: ${projectName}

${description}

## Principles

`;

  for (const principle of principles) {
    const lockEmoji = principle.immutable ? '🔒' : '🔓';
    const severityEmoji = principle.severity === 'error' ? '🚫' : '⚠️';
    content += `### ${lockEmoji} ${principle.name}\n\n**ID:** \`${principle.id}\`  \n**Severity:** ${severityEmoji} ${principle.severity.toUpperCase()}  \n**Immutable:** ${principle.immutable ? 'Yes' : 'No'}  \n\n${principle.description}\n\n`;
    if (principle.metadata?.rationale) content += `**Rationale:** ${principle.metadata.rationale}\n\n`;
    content += `---\n\n`;
  }

  content += `## Usage

\`\`\`bash
specsafe constitution check <spec-id>
specsafe constitution list
\`\`\`
`;

  return content;
}

export function generateMinimalConstitution(projectName: string = 'My Project'): string {
  return generateConstitution({ projectName, includeAllBuiltins: false, includePrinciples: ['tdd-mandatory', 'require-acceptance-criteria'] });
}

export function generateStrictConstitution(projectName: string = 'My Project'): string {
  return generateConstitution({ projectName, includeAllBuiltins: true });
}

export function generateConstitutionReadme(): string {
  return `# Constitutional Governance

SpecSafe uses Constitutional Governance to enforce immutable project principles through quality gates.

## Features

- 🔒 Immutable principles that cannot be removed
- 🚦 Quality gates at workflow transitions
- ⚖️ Error/Warning severity levels

## Getting Started

\`\`\`bash
specsafe constitution init
specsafe constitution check <spec-id>
\`\`\`
`;
}
