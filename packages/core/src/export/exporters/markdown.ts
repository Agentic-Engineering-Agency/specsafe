/**
 * Markdown Exporter
 * Renders spec to polished markdown format
 */

import type { ParsedSpec, ExportResult } from '../types.js';

/**
 * Export a parsed spec to polished markdown format
 */
export function exportToMarkdown(spec: ParsedSpec, includeMetadata: boolean = true): ExportResult {
  const lines: string[] = [];

  // Header
  lines.push(`# ${spec.name}`);
  lines.push('');
  lines.push(`**Spec ID:** ${spec.id}`);
  lines.push('');

  if (spec.description) {
    lines.push(spec.description);
    lines.push('');
  }

  // Metadata section
  if (includeMetadata) {
    lines.push('---');
    lines.push('');
    lines.push('## Metadata');
    lines.push('');
    lines.push(`| Field | Value |`);
    lines.push(`|-------|-------|`);
    lines.push(`| Stage | ${spec.stage.toUpperCase()} |`);
    lines.push(`| Created | ${spec.createdAt.toISOString().split('T')[0]} |`);
    lines.push(`| Updated | ${spec.updatedAt.toISOString().split('T')[0]} |`);
    if (spec.completedAt) {
      lines.push(`| Completed | ${spec.completedAt.toISOString().split('T')[0]} |`);
    }
    lines.push(`| Author | ${spec.metadata.author || 'Unknown'} |`);
    lines.push(`| Project | ${spec.metadata.project || 'Unknown'} |`);
    if (spec.metadata.tags?.length) {
      lines.push(`| Tags | ${spec.metadata.tags.join(', ')} |`);
    }
    lines.push('');
  }

  // PRD Section
  if (spec.prd) {
    lines.push('---');
    lines.push('');
    lines.push('## Product Requirements Document (PRD)');
    lines.push('');

    if (spec.prd.problemStatement) {
      lines.push('### Problem Statement');
      lines.push('');
      lines.push(spec.prd.problemStatement);
      lines.push('');
    }

    if (spec.prd.userStories?.length) {
      lines.push('### User Stories');
      lines.push('');
      spec.prd.userStories.forEach(story => {
        lines.push(`- ${story}`);
      });
      lines.push('');
    }

    if (spec.prd.acceptanceCriteria?.length) {
      lines.push('### Acceptance Criteria');
      lines.push('');
      spec.prd.acceptanceCriteria.forEach(criterion => {
        lines.push(`- [ ] ${criterion}`);
      });
      lines.push('');
    }

    if (spec.prd.technicalConsiderations) {
      lines.push('### Technical Considerations');
      lines.push('');
      lines.push(spec.prd.technicalConsiderations);
      lines.push('');
    }
  }

  // Requirements Section
  if (spec.requirements?.length) {
    lines.push('---');
    lines.push('');
    lines.push('## Requirements');
    lines.push('');
    lines.push('| ID | Requirement | Priority |');
    lines.push('|----|-------------|----------|');
    spec.requirements.forEach(req => {
      lines.push(`| ${req.id} | ${req.text} | ${req.priority} |`);
    });
    lines.push('');

    // Detailed requirements with scenarios
    spec.requirements.forEach(req => {
      lines.push(`### ${req.id}: ${req.text}`);
      lines.push('');
      lines.push(`**Priority:** ${req.priority}`);
      lines.push('');

      if (req.scenarios?.length) {
        lines.push('**Scenarios:**');
        lines.push('');
        req.scenarios.forEach(scenario => {
          lines.push(`- **Given** ${scenario.given}`);
          lines.push(`  **When** ${scenario.when}`);
          lines.push(`  **Then** ${scenario.thenOutcome}`);
          lines.push('');
        });
      }
    });
  }

  // Architecture Section
  if (spec.architecture) {
    lines.push('---');
    lines.push('');
    lines.push('## Architecture');
    lines.push('');

    if (spec.architecture.overview) {
      lines.push('### Overview');
      lines.push('');
      lines.push(spec.architecture.overview);
      lines.push('');
    }

    if (spec.architecture.components?.length) {
      lines.push('### Components');
      lines.push('');
      spec.architecture.components.forEach(component => {
        lines.push(`- ${component}`);
      });
      lines.push('');
    }

    if (spec.architecture.apis?.length) {
      lines.push('### APIs');
      lines.push('');
      lines.push('| Name | Method | Endpoint | Description |');
      lines.push('|------|--------|----------|-------------|');
      spec.architecture.apis.forEach(api => {
        lines.push(`| ${api.name} | ${api.method || '-'} | ${api.endpoint || '-'} | ${api.description || '-'} |`);
      });
      lines.push('');
    }

    if (spec.architecture.dataModels?.length) {
      lines.push('### Data Models');
      lines.push('');
      spec.architecture.dataModels.forEach(model => {
        lines.push(`- ${model}`);
      });
      lines.push('');
    }
  }

  // Scenarios Section
  if (spec.scenarios?.length) {
    lines.push('---');
    lines.push('');
    lines.push('## Scenarios');
    lines.push('');
    spec.scenarios.forEach(scenario => {
      lines.push(`### ${scenario.id}: ${scenario.name}`);
      lines.push('');
      lines.push(`- **Given** ${scenario.given}`);
      lines.push(`- **When** ${scenario.when}`);
      lines.push(`- **Then** ${scenario.thenOutcome}`);
      lines.push('');
    });
  }

  // Design Section
  if (spec.design) {
    lines.push('---');
    lines.push('');
    lines.push('## Design');
    lines.push('');

    if (spec.design.uxFlows?.length) {
      lines.push('### UX Flows');
      lines.push('');
      spec.design.uxFlows.forEach(flow => {
        lines.push(`- ${flow}`);
      });
      lines.push('');
    }

    if (spec.design.uiRequirements?.length) {
      lines.push('### UI Requirements');
      lines.push('');
      spec.design.uiRequirements.forEach(req => {
        lines.push(`- ${req}`);
      });
      lines.push('');
    }

    if (spec.design.accessibility?.length) {
      lines.push('### Accessibility');
      lines.push('');
      spec.design.accessibility.forEach(item => {
        lines.push(`- ${item}`);
      });
      lines.push('');
    }
  }

  // Test Results Section
  if (spec.testResults) {
    lines.push('---');
    lines.push('');
    lines.push('## Test Results');
    lines.push('');
    lines.push(`| Status | Count |`);
    lines.push(`|--------|-------|`);
    lines.push(`| ✅ Passed | ${spec.testResults.passed} |`);
    lines.push(`| ❌ Failed | ${spec.testResults.failed} |`);
    lines.push(`| ⏭️ Skipped | ${spec.testResults.skipped} |`);
    lines.push('');

    if (spec.testResults.coverage) {
      lines.push('### Coverage');
      lines.push('');
      lines.push(`| Type | Percentage |`);
      lines.push(`|------|------------|`);
      lines.push(`| Statements | ${spec.testResults.coverage.statements}% |`);
      lines.push(`| Branches | ${spec.testResults.coverage.branches}% |`);
      lines.push(`| Functions | ${spec.testResults.coverage.functions}% |`);
      lines.push(`| Lines | ${spec.testResults.coverage.lines}% |`);
      lines.push('');
    }
  }

  // Risks Section
  if (spec.risks?.length) {
    lines.push('---');
    lines.push('');
    lines.push('## Risks');
    lines.push('');
    spec.risks.forEach(risk => {
      lines.push(`- ⚠️ ${risk}`);
    });
    lines.push('');
  }

  // Timeline Section
  if (spec.timeline) {
    lines.push('---');
    lines.push('');
    lines.push('## Timeline');
    lines.push('');

    if (spec.timeline.estimatedDuration) {
      lines.push(`**Estimated Duration:** ${spec.timeline.estimatedDuration}`);
      lines.push('');
    }

    if (spec.timeline.milestones?.length) {
      lines.push('### Milestones');
      lines.push('');
      spec.timeline.milestones.forEach((milestone, index) => {
        lines.push(`${index + 1}. ${milestone}`);
      });
      lines.push('');
    }
  }

  // Footer
  lines.push('---');
  lines.push('');
  lines.push(`*Generated by SpecSafe on ${new Date().toISOString()}*`);
  lines.push('');

  const content = lines.join('\n');

  return {
    content,
    filename: `${spec.id.toLowerCase()}.md`,
    mimeType: 'text/markdown',
    size: Buffer.byteLength(content, 'utf-8')
  };
}
