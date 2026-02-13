/**
 * Spec Parser
 * Parses markdown spec files into ParsedSpec format for export
 */

import { readFile } from 'fs/promises';
import type { ParsedSpec } from './types.js';
import { validateFilePath } from './path-utils.js';

/**
 * Parse a markdown spec file into ParsedSpec format
 */
export async function parseSpecFromFile(filePath: string): Promise<ParsedSpec> {
  // Validate and sanitize file path to prevent path traversal
  const safePath = validateFilePath(filePath);
  const content = await readFile(safePath, 'utf-8');
  return parseSpec(content);
}

/**
 * Parse markdown spec content into ParsedSpec format
 */
export function parseSpec(content: string): ParsedSpec {
  const spec: Partial<ParsedSpec> = {};

  // Extract ID from first heading or from metadata table
  const idMatch = content.match(/\*\*Spec ID:\*\*\s*([A-Z]+-\d+-\d+)/) ||
                  content.match(/^#\s+.+?\s+([A-Z]+-\d+-\d+)/m);
  spec.id = idMatch ? idMatch[1] : 'SPEC-UNKNOWN';

  // Extract name from first heading
  const nameMatch = content.match(/^#\s+(.+?)(?:\s+\(|\s+Specification|$)/m);
  spec.name = nameMatch ? nameMatch[1].trim() : 'Untitled Spec';

  // Extract description (first paragraph after header)
  const descMatch = content.match(/^#\s+.+\n+([^\n#]+)/m);
  spec.description = descMatch ? descMatch[1].trim() : '';

  // Extract stage from metadata table
  const stageMatch = content.match(/\|\s*Stage\s*\|\s*(spec|test|code|qa|complete|archived)\s*\|/i);
  spec.stage = stageMatch ? stageMatch[1].toLowerCase() : 'spec';

  // Extract dates from metadata table
  const createdMatch = content.match(/\|\s*Created\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|/i);
  spec.createdAt = createdMatch ? new Date(createdMatch[1]) : new Date();

  const updatedMatch = content.match(/\|\s*Updated\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|/i);
  spec.updatedAt = updatedMatch ? new Date(updatedMatch[1]) : new Date();

  const completedMatch = content.match(/\|\s*Completed\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|/i);
  spec.completedAt = completedMatch ? new Date(completedMatch[1]) : undefined;

  // Extract author
  const authorMatch = content.match(/\|\s*Author\s*\|\s*([^|]+)\s*\|/i);
  spec.metadata = {
    author: authorMatch ? authorMatch[1].trim() : '',
    project: '',
    tags: [],
  };

  // Extract project
  const projectMatch = content.match(/\|\s*Project\s*\|\s*([^|]+)\s*\|/i);
  if (projectMatch) {
    spec.metadata.project = projectMatch[1].trim();
  }

  // Extract tags
  const tagsMatch = content.match(/\|\s*Tags\s*\|\s*([^|]+)\s*\|/i);
  if (tagsMatch) {
    spec.metadata.tags = tagsMatch[1].split(',').map(t => t.trim()).filter(t => t);
  }

  // Parse PRD section
  spec.prd = parsePRDSection(content);

  // Parse requirements
  spec.requirements = parseRequirements(content);

  // Parse architecture
  spec.architecture = parseArchitecture(content);

  // Parse scenarios
  spec.scenarios = parseScenarios(content);

  // Parse design
  spec.design = parseDesign(content);

  // Parse test results
  spec.testResults = parseTestResults(content);

  // Parse risks
  spec.risks = parseRisks(content);

  // Parse timeline
  spec.timeline = parseTimeline(content);

  return spec as ParsedSpec;
}

/**
 * Parse PRD section from content
 */
function parsePRDSection(content: string): ParsedSpec['prd'] {
  const prd: ParsedSpec['prd'] = {};

  const prdMatch = content.match(/##\s+Product\s+Requirements\s+Document[\s\S]*?(?=\n##\s+|$)/i);
  if (!prdMatch) return undefined;

  const prdContent = prdMatch[0];

  // Problem statement
  const problemMatch = prdContent.match(/###?\s*Problem\s+Statement\n+([^\n#]+)/i);
  if (problemMatch) {
    prd.problemStatement = problemMatch[1].trim();
  }

  // User stories
  const storiesMatch = prdContent.match(/###?\s*User\s+Stories\n+([\s\S]*?)(?=###|$)/i);
  if (storiesMatch) {
    const stories = storiesMatch[1]
      .split('\n')
      .map(line => line.replace(/^[-*]\s*/, '').trim())
      .filter(line => line.length > 0 && !line.startsWith('###'));
    prd.userStories = stories;
  }

  // Acceptance criteria
  const criteriaMatch = prdContent.match(/###?\s*Acceptance\s+Criteria\n+([\s\S]*?)(?=###|$)/i);
  if (criteriaMatch) {
    const criteria = criteriaMatch[1]
      .split('\n')
      .map(line => line.replace(/^[-*]\s*\[?\s*[xX\s]?\s*\]?\s*/, '').trim())
      .filter(line => line.length > 0 && !line.startsWith('###'));
    prd.acceptanceCriteria = criteria;
  }

  // Technical considerations
  const techMatch = prdContent.match(/###?\s*Technical\s+Considerations\n+([^\n#]+)/i);
  if (techMatch) {
    prd.technicalConsiderations = techMatch[1].trim();
  }

  return Object.keys(prd).length > 0 ? prd : undefined;
}

/**
 * Parse requirements from content
 */
function parseRequirements(content: string): ParsedSpec['requirements'] {
  const requirements: ParsedSpec['requirements'] = [];

  // Look for requirements table
  const tableMatch = content.match(/\|\s*ID\s*\|\s*Requirement\s*\|\s*Priority[\s\S]*?(\|[^\n]+\n)+/i);
  if (tableMatch) {
    const rows = tableMatch[0].split('\n').filter(row => row.startsWith('|') && !row.includes('---'));
    rows.forEach(row => {
      const cols = row.split('|').map(col => col.trim()).filter(col => col);
      if (cols.length >= 3) {
        const id = cols[0];
        const text = cols[1];
        const priority = cols[2].toUpperCase();

        if (id.match(/^[A-Z]+-\d+$/) && ['P0', 'P1', 'P2'].includes(priority)) {
          requirements.push({
            id,
            text,
            priority: priority as 'P0' | 'P1' | 'P2',
            scenarios: [],
          });
        }
      }
    });
  }

  return requirements.length > 0 ? requirements : undefined;
}

/**
 * Parse architecture from content
 */
function parseArchitecture(content: string): ParsedSpec['architecture'] {
  const architecture: ParsedSpec['architecture'] = {};

  const archMatch = content.match(/##\s+Architecture[\s\S]*?(?=\n##\s+|$)/i);
  if (!archMatch) return undefined;

  const archContent = archMatch[0];

  // Overview
  const overviewMatch = archContent.match(/###?\s*Overview\n+([^\n#]+)/i);
  if (overviewMatch) {
    architecture.overview = overviewMatch[1].trim();
  }

  // Components
  const componentsMatch = archContent.match(/###?\s*Components\n+([\s\S]*?)(?=###|$)/i);
  if (componentsMatch) {
    const components = componentsMatch[1]
      .split('\n')
      .map(line => line.replace(/^[-*]?\s*\d+\.?\s*/, '').trim())
      .filter(line => line.length > 0 && !line.startsWith('###'));
    architecture.components = components;
  }

  // APIs
  const apisMatch = archContent.match(/###?\s*APIs\n+([\s\S]*?)(?=###|$)/i);
  if (apisMatch) {
    const apis: NonNullable<ParsedSpec['architecture']>['apis'] = [];
    const apiRows = apisMatch[1].split('\n').filter(row => row.startsWith('|') && !row.includes('---'));
    apiRows.forEach(row => {
      const cols = row.split('|').map(col => col.trim()).filter(col => col);
      if (cols.length >= 2 && !cols[0].toLowerCase().includes('name')) {
        apis.push({
          name: cols[0],
          method: cols[1] || undefined,
          endpoint: cols[2] || undefined,
          description: cols[3] || undefined,
        });
      }
    });
    if (apis.length > 0) architecture.apis = apis;
  }

  // Data models
  const modelsMatch = archContent.match(/###?\s*Data\s+Models\n+([\s\S]*?)(?=###|$)/i);
  if (modelsMatch) {
    const models = modelsMatch[1]
      .split('\n')
      .map(line => line.replace(/^[-*]?\s*/, '').replace(/`/g, '').trim())
      .filter(line => line.length > 0 && !line.startsWith('###'));
    architecture.dataModels = models;
  }

  return Object.keys(architecture).length > 0 ? architecture : undefined;
}

/**
 * Parse scenarios from content
 */
function parseScenarios(content: string): ParsedSpec['scenarios'] {
  const scenarios: ParsedSpec['scenarios'] = [];

  // Look for scenarios section
  const scenarioMatch = content.match(/##\s+Scenarios[\s\S]*?(?=\n##\s+|$)/i);
  if (!scenarioMatch) return undefined;

  const scenarioContent = scenarioMatch[0];

  // Parse each scenario block defined by ### heading
  const scenarioRegex = /###\s+([^\n]+)\n([\s\S]*?)(?=\n###\s+|$)/g;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = scenarioRegex.exec(scenarioContent)) !== null) {
    index += 1;
    const name = match[1].trim();
    const block = match[2];
    const givenMatch = block.match(/\*\*Given\*\*\s+(.+?)(?=\n-?\s*\*\*When|$)/i);
    const whenMatch = block.match(/\*\*When\*\*\s+(.+?)(?=\n-?\s*\*\*Then|$)/i);
    const thenMatch = block.match(/\*\*Then\*\*\s+(.+?)(?=$|\n)/i);

    scenarios.push({
      id: `SCENARIO-${String(index).padStart(3, '0')}`,
      name,
      given: givenMatch ? givenMatch[1].trim() : '',
      when: whenMatch ? whenMatch[1].trim() : '',
      thenOutcome: thenMatch ? thenMatch[1].trim() : '',
    });
  }

  return scenarios.length > 0 ? scenarios : undefined;
}

/**
 * Parse design from content
 */
function parseDesign(content: string): ParsedSpec['design'] {
  const design: ParsedSpec['design'] = {};

  const designMatch = content.match(/##\s+Design[\s\S]*?(?=\n##\s+|$)/i);
  if (!designMatch) return undefined;

  const designContent = designMatch[0];

  // UX Flows
  const uxMatch = designContent.match(/###?\s*UX\s+Flows\n+([\s\S]*?)(?=###|$)/i);
  if (uxMatch) {
    const flows = uxMatch[1]
      .split('\n')
      .map(line => line.replace(/^[-*]?\s*\d+\.?\s*/, '').trim())
      .filter(line => line.length > 0 && !line.startsWith('###'));
    design.uxFlows = flows;
  }

  // UI Requirements
  const uiMatch = designContent.match(/###?\s*UI\s+Requirements\n+([\s\S]*?)(?=###|$)/i);
  if (uiMatch) {
    const requirements = uiMatch[1]
      .split('\n')
      .map(line => line.replace(/^[-*]?\s*\d+\.?\s*/, '').trim())
      .filter(line => line.length > 0 && !line.startsWith('###'));
    design.uiRequirements = requirements;
  }

  // Accessibility
  const a11yMatch = designContent.match(/###?\s*Accessibility\n+([\s\S]*?)(?=###|$)/i);
  if (a11yMatch) {
    const items = a11yMatch[1]
      .split('\n')
      .map(line => line.replace(/^[-*]?\s*\d+\.?\s*/, '').trim())
      .filter(line => line.length > 0 && !line.startsWith('###'));
    design.accessibility = items;
  }

  return Object.keys(design).length > 0 ? design : undefined;
}

/**
 * Parse test results from content
 */
function parseTestResults(content: string): ParsedSpec['testResults'] {
  const resultsMatch = content.match(/##\s+Test\s+Results[\s\S]*?(?=\n##\s+|$)/i);
  if (!resultsMatch) return undefined;

  const resultsContent = resultsMatch[0];
  const results: ParsedSpec['testResults'] = { passed: 0, failed: 0, skipped: 0 };

  // Parse status counts
  const passedMatch = resultsContent.match(/✅\s*Passed\s*\|\s*(\d+)/i);
  if (passedMatch) results.passed = parseInt(passedMatch[1], 10);

  const failedMatch = resultsContent.match(/❌\s*Failed\s*\|\s*(\d+)/i);
  if (failedMatch) results.failed = parseInt(failedMatch[1], 10);

  const skippedMatch = resultsContent.match(/⏭️\s*Skipped\s*\|\s*(\d+)/i);
  if (skippedMatch) results.skipped = parseInt(skippedMatch[1], 10);

  // Parse coverage
  const coverageMatch = resultsContent.match(/###?\s*Coverage\n+([\s\S]*?)(?=###|$)/i);
  if (coverageMatch) {
    const coverage: NonNullable<NonNullable<ParsedSpec['testResults']>['coverage']> = {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0,
    };

    const statementsMatch = coverageMatch[1].match(/\|\s*Statements\s*\|\s*(\d+)%/i);
    if (statementsMatch) coverage.statements = parseInt(statementsMatch[1], 10);

    const branchesMatch = coverageMatch[1].match(/\|\s*Branches\s*\|\s*(\d+)%/i);
    if (branchesMatch) coverage.branches = parseInt(branchesMatch[1], 10);

    const functionsMatch = coverageMatch[1].match(/\|\s*Functions\s*\|\s*(\d+)%/i);
    if (functionsMatch) coverage.functions = parseInt(functionsMatch[1], 10);

    const linesMatch = coverageMatch[1].match(/\|\s*Lines\s*\|\s*(\d+)%/i);
    if (linesMatch) coverage.lines = parseInt(linesMatch[1], 10);

    results.coverage = coverage;
  }

  return results.passed > 0 || results.failed > 0 || results.skipped > 0 ? results : undefined;
}

/**
 * Parse risks from content
 */
function parseRisks(content: string): ParsedSpec['risks'] {
  const risks: string[] = [];

  const risksMatch = content.match(/##\s+Risks[\s\S]*?(?=\n##\s+|$)/i);
  if (!risksMatch) return undefined;

  const risksContent = risksMatch[0];

  // Extract risk items (lines starting with ⚠️ or -)
  const riskItems = risksContent.split('\n')
    .map(line => line.replace(/^[-*]?\s*[⚠️]\s*/, '').trim())
    .filter(line => line.length > 0 && !line.startsWith('##') && !line.startsWith('###'));

  return riskItems.length > 0 ? riskItems : undefined;
}

/**
 * Parse timeline from content
 */
function parseTimeline(content: string): ParsedSpec['timeline'] {
  const timeline: ParsedSpec['timeline'] = {};

  const timelineMatch = content.match(/##\s+Timeline[\s\S]*?(?=\n##\s+|$)/i);
  if (!timelineMatch) return undefined;

  const timelineContent = timelineMatch[0];

  // Estimated duration
  const durationMatch = timelineContent.match(/\*\*Estimated\s+Duration:\*\*\s*(.+?)(?:\n|$)/i);
  if (durationMatch) {
    timeline.estimatedDuration = durationMatch[1].trim();
  }

  // Milestones
  const milestonesMatch = timelineContent.match(/###?\s*Milestones\n+([\s\S]*?)(?=###|$)/i);
  if (milestonesMatch) {
    const milestones = milestonesMatch[1]
      .split('\n')
      .map(line => line.replace(/^\d+\.?\s*/, '').trim())
      .filter(line => line.length > 0 && !line.startsWith('###'));
    if (milestones.length > 0) timeline.milestones = milestones;
  }

  return Object.keys(timeline).length > 0 ? timeline : undefined;
}
