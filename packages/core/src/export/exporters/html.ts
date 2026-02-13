/**
 * HTML Exporter
 * Self-contained HTML with CSS
 */

import type { ParsedSpec, ExportResult } from '../types.js';

/**
 * Generate CSS styles for the HTML export
 */
function generateStyles(): string {
  return `
    :root {
      --color-bg: #ffffff;
      --color-text: #1a1a2e;
      --color-primary: #3b82f6;
      --color-secondary: #64748b;
      --color-accent: #8b5cf6;
      --color-success: #10b981;
      --color-warning: #f59e0b;
      --color-danger: #ef4444;
      --color-border: #e2e8f0;
      --color-muted: #f1f5f9;
      --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-mono: 'SF Mono', Monaco, monospace;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: var(--font-sans);
      line-height: 1.6;
      color: var(--color-text);
      background: var(--color-bg);
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    header {
      border-bottom: 2px solid var(--color-primary);
      padding-bottom: 1.5rem;
      margin-bottom: 2rem;
    }

    h1 {
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-primary);
      margin-bottom: 0.5rem;
    }

    h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--color-text);
      margin: 2rem 0 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--color-border);
    }

    h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-secondary);
      margin: 1.5rem 0 0.75rem;
    }

    h4 {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--color-text);
      margin: 1rem 0 0.5rem;
    }

    p {
      margin-bottom: 1rem;
    }

    .spec-meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      background: var(--color-muted);
      padding: 1.5rem;
      border-radius: 8px;
      margin: 1.5rem 0;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
    }

    .meta-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      color: var(--color-secondary);
      font-weight: 600;
      letter-spacing: 0.05em;
    }

    .meta-value {
      font-size: 1rem;
      font-weight: 500;
      color: var(--color-text);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }

    th, td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--color-border);
    }

    th {
      font-weight: 600;
      color: var(--color-secondary);
      background: var(--color-muted);
    }

    tr:hover {
      background: var(--color-muted);
    }

    ul, ol {
      margin: 1rem 0;
      padding-left: 1.5rem;
    }

    li {
      margin-bottom: 0.5rem;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .badge-p0 {
      background: var(--color-danger);
      color: white;
    }

    .badge-p1 {
      background: var(--color-warning);
      color: white;
    }

    .badge-p2 {
      background: var(--color-secondary);
      color: white;
    }

    .stage-spec { color: var(--color-primary); }
    .stage-test { color: var(--color-accent); }
    .stage-code { color: var(--color-warning); }
    .stage-qa { color: var(--color-success); }
    .stage-complete { color: var(--color-success); font-weight: 600; }

    .scenario {
      background: var(--color-muted);
      padding: 1rem;
      border-radius: 8px;
      margin: 1rem 0;
    }

    .scenario-step {
      margin: 0.5rem 0;
      padding-left: 1rem;
    }

    .scenario-step strong {
      color: var(--color-primary);
    }

    .risk-item {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 0.75rem;
      background: #fef3c7;
      border-radius: 6px;
      margin: 0.5rem 0;
    }

    .risk-icon {
      color: var(--color-warning);
      font-weight: bold;
    }

    .test-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin: 1rem 0;
    }

    .stat-box {
      text-align: center;
      padding: 1rem;
      border-radius: 8px;
      background: var(--color-muted);
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--color-secondary);
    }

    .stat-passed { color: var(--color-success); }
    .stat-failed { color: var(--color-danger); }
    .stat-skipped { color: var(--color-warning); }

    footer {
      margin-top: 3rem;
      padding-top: 1rem;
      border-top: 1px solid var(--color-border);
      text-align: center;
      color: var(--color-secondary);
      font-size: 0.875rem;
    }

    @media print {
      body {
        padding: 0;
        max-width: none;
      }

      .no-print {
        display: none;
      }
    }

    @media (max-width: 768px) {
      body {
        padding: 1rem;
      }

      .spec-meta {
        grid-template-columns: 1fr;
      }

      .test-stats {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `;
}

/**
 * Export a parsed spec to self-contained HTML format
 */
export function exportToHTML(spec: ParsedSpec, includeMetadata: boolean = true): ExportResult {
  const styles = generateStyles();

  const htmlParts: string[] = [];

  htmlParts.push('<!DOCTYPE html>');
  htmlParts.push('<html lang="en">');
  htmlParts.push('<head>');
  htmlParts.push(`  <meta charset="UTF-8">`);
  htmlParts.push(`  <meta name="viewport" content="width=device-width, initial-scale=1.0">`);
  htmlParts.push(`  <title>${escapeHtml(spec.name)} - ${spec.id}</title>`);
  htmlParts.push(`  <style>${styles}</style>`);
  htmlParts.push('</head>');
  htmlParts.push('<body>');

  // Header
  htmlParts.push('<header>');
  htmlParts.push(`  <h1>${escapeHtml(spec.name)}</h1>`);
  htmlParts.push(`  <p>Spec ID: <strong>${spec.id}</strong></p>`);

  if (spec.description) {
    htmlParts.push(`  <p>${escapeHtml(spec.description)}</p>`);
  }
  htmlParts.push('</header>');

  // Metadata
  if (includeMetadata) {
    htmlParts.push('<section>');
    htmlParts.push('  <h2>Metadata</h2>');
    htmlParts.push('  <div class="spec-meta">');

    htmlParts.push('    <div class="meta-item">');
    htmlParts.push('      <span class="meta-label">Stage</span>');
    htmlParts.push(`      <span class="meta-value stage-${spec.stage}">${spec.stage.toUpperCase()}</span>`);
    htmlParts.push('    </div>');

    htmlParts.push('    <div class="meta-item">');
    htmlParts.push('      <span class="meta-label">Created</span>');
    htmlParts.push(`      <span class="meta-value">${spec.createdAt.toISOString().split('T')[0]}</span>`);
    htmlParts.push('    </div>');

    htmlParts.push('    <div class="meta-item">');
    htmlParts.push('      <span class="meta-label">Updated</span>');
    htmlParts.push(`      <span class="meta-value">${spec.updatedAt.toISOString().split('T')[0]}</span>`);
    htmlParts.push('    </div>');

    if (spec.completedAt) {
      htmlParts.push('    <div class="meta-item">');
      htmlParts.push('      <span class="meta-label">Completed</span>');
      htmlParts.push(`      <span class="meta-value">${spec.completedAt.toISOString().split('T')[0]}</span>`);
      htmlParts.push('    </div>');
    }

    htmlParts.push('    <div class="meta-item">');
    htmlParts.push('      <span class="meta-label">Author</span>');
    htmlParts.push(`      <span class="meta-value">${escapeHtml(spec.metadata.author || 'Unknown')}</span>`);
    htmlParts.push('    </div>');

    htmlParts.push('    <div class="meta-item">');
    htmlParts.push('      <span class="meta-label">Project</span>');
    htmlParts.push(`      <span class="meta-value">${escapeHtml(spec.metadata.project || 'Unknown')}</span>`);
    htmlParts.push('    </div>');

    if (spec.metadata.tags?.length) {
      htmlParts.push('    <div class="meta-item">');
      htmlParts.push('      <span class="meta-label">Tags</span>');
      htmlParts.push(`      <span class="meta-value">${spec.metadata.tags.join(', ')}</span>`);
      htmlParts.push('    </div>');
    }

    htmlParts.push('  </div>');
    htmlParts.push('</section>');
  }

  // PRD Section
  if (spec.prd) {
    htmlParts.push('<section>');
    htmlParts.push('  <h2>Product Requirements Document (PRD)</h2>');

    if (spec.prd.problemStatement) {
      htmlParts.push('  <h3>Problem Statement</h3>');
      htmlParts.push(`  <p>${escapeHtml(spec.prd.problemStatement)}</p>`);
    }

    if (spec.prd.userStories?.length) {
      htmlParts.push('  <h3>User Stories</h3>');
      htmlParts.push('  <ul>');
      spec.prd.userStories.forEach(story => {
        htmlParts.push(`    <li>${escapeHtml(story)}</li>`);
      });
      htmlParts.push('  </ul>');
    }

    if (spec.prd.acceptanceCriteria?.length) {
      htmlParts.push('  <h3>Acceptance Criteria</h3>');
      htmlParts.push('  <ul>');
      spec.prd.acceptanceCriteria.forEach(criterion => {
        htmlParts.push(`    <li>☐ ${escapeHtml(criterion)}</li>`);
      });
      htmlParts.push('  </ul>');
    }

    if (spec.prd.technicalConsiderations) {
      htmlParts.push('  <h3>Technical Considerations</h3>');
      htmlParts.push(`  <p>${escapeHtml(spec.prd.technicalConsiderations)}</p>`);
    }

    htmlParts.push('</section>');
  }

  // Requirements Section
  if (spec.requirements?.length) {
    htmlParts.push('<section>');
    htmlParts.push('  <h2>Requirements</h2>');

    // Summary table
    htmlParts.push('  <table>');
    htmlParts.push('    <thead>');
    htmlParts.push('      <tr><th>ID</th><th>Requirement</th><th>Priority</th></tr>');
    htmlParts.push('    </thead>');
    htmlParts.push('    <tbody>');
    spec.requirements.forEach(req => {
      htmlParts.push(`      <tr><td>${req.id}</td><td>${escapeHtml(req.text)}</td><td><span class="badge badge-${req.priority.toLowerCase()}">${req.priority}</span></td></tr>`);
    });
    htmlParts.push('    </tbody>');
    htmlParts.push('  </table>');

    // Detailed requirements
    spec.requirements.forEach(req => {
      htmlParts.push(`  <h3>${req.id}: ${escapeHtml(req.text)}</h3>`);
      htmlParts.push(`  <p><strong>Priority:</strong> <span class="badge badge-${req.priority.toLowerCase()}">${req.priority}</span></p>`);

      if (req.scenarios?.length) {
        htmlParts.push('  <h4>Scenarios:</h4>');
        req.scenarios.forEach(scenario => {
          htmlParts.push('  <div class="scenario">');
          htmlParts.push('    <div class="scenario-step"><strong>Given</strong> ' + escapeHtml(scenario.given) + '</div>');
          htmlParts.push('    <div class="scenario-step"><strong>When</strong> ' + escapeHtml(scenario.when) + '</div>');
          htmlParts.push('    <div class="scenario-step"><strong>Then</strong> ' + escapeHtml(scenario.thenOutcome) + '</div>');
          htmlParts.push('  </div>');
        });
      }
    });

    htmlParts.push('</section>');
  }

  // Architecture Section
  if (spec.architecture) {
    htmlParts.push('<section>');
    htmlParts.push('  <h2>Architecture</h2>');

    if (spec.architecture.overview) {
      htmlParts.push('  <h3>Overview</h3>');
      htmlParts.push(`  <p>${escapeHtml(spec.architecture.overview)}</p>`);
    }

    if (spec.architecture.components?.length) {
      htmlParts.push('  <h3>Components</h3>');
      htmlParts.push('  <ul>');
      spec.architecture.components.forEach(component => {
        htmlParts.push(`    <li>${escapeHtml(component)}</li>`);
      });
      htmlParts.push('  </ul>');
    }

    if (spec.architecture.apis?.length) {
      htmlParts.push('  <h3>APIs</h3>');
      htmlParts.push('  <table>');
      htmlParts.push('    <thead><tr><th>Name</th><th>Method</th><th>Endpoint</th><th>Description</th></tr></thead>');
      htmlParts.push('    <tbody>');
      spec.architecture.apis.forEach(api => {
        htmlParts.push(`      <tr><td>${escapeHtml(api.name)}</td><td>${api.method || '-'}</td><td><code>${escapeHtml(api.endpoint || '-')}</code></td><td>${escapeHtml(api.description || '-')}</td></tr>`);
      });
      htmlParts.push('    </tbody>');
      htmlParts.push('  </table>');
    }

    if (spec.architecture.dataModels?.length) {
      htmlParts.push('  <h3>Data Models</h3>');
      htmlParts.push('  <ul>');
      spec.architecture.dataModels.forEach(model => {
        htmlParts.push(`    <li><code>${escapeHtml(model)}</code></li>`);
      });
      htmlParts.push('  </ul>');
    }

    htmlParts.push('</section>');
  }

  // Scenarios Section
  if (spec.scenarios?.length) {
    htmlParts.push('<section>');
    htmlParts.push('  <h2>Scenarios</h2>');

    spec.scenarios.forEach(scenario => {
      htmlParts.push(`  <h3>${scenario.id}: ${escapeHtml(scenario.name)}</h3>`);
      htmlParts.push('  <div class="scenario">');
      htmlParts.push('    <div class="scenario-step"><strong>Given</strong> ' + escapeHtml(scenario.given) + '</div>');
      htmlParts.push('    <div class="scenario-step"><strong>When</strong> ' + escapeHtml(scenario.when) + '</div>');
      htmlParts.push('    <div class="scenario-step"><strong>Then</strong> ' + escapeHtml(scenario.thenOutcome) + '</div>');
      htmlParts.push('  </div>');
    });

    htmlParts.push('</section>');
  }

  // Design Section
  if (spec.design) {
    htmlParts.push('<section>');
    htmlParts.push('  <h2>Design</h2>');

    if (spec.design.uxFlows?.length) {
      htmlParts.push('  <h3>UX Flows</h3>');
      htmlParts.push('  <ul>');
      spec.design.uxFlows.forEach(flow => {
        htmlParts.push(`    <li>${escapeHtml(flow)}</li>`);
      });
      htmlParts.push('  </ul>');
    }

    if (spec.design.uiRequirements?.length) {
      htmlParts.push('  <h3>UI Requirements</h3>');
      htmlParts.push('  <ul>');
      spec.design.uiRequirements.forEach(req => {
        htmlParts.push(`    <li>${escapeHtml(req)}</li>`);
      });
      htmlParts.push('  </ul>');
    }

    if (spec.design.accessibility?.length) {
      htmlParts.push('  <h3>Accessibility</h3>');
      htmlParts.push('  <ul>');
      spec.design.accessibility.forEach(item => {
        htmlParts.push(`    <li>${escapeHtml(item)}</li>`);
      });
      htmlParts.push('  </ul>');
    }

    htmlParts.push('</section>');
  }

  // Test Results Section
  if (spec.testResults) {
    htmlParts.push('<section>');
    htmlParts.push('  <h2>Test Results</h2>');

    htmlParts.push('  <div class="test-stats">');
    htmlParts.push('    <div class="stat-box">');
    htmlParts.push(`      <div class="stat-value stat-passed">${spec.testResults.passed}</div>`);
    htmlParts.push('      <div class="stat-label">Passed</div>');
    htmlParts.push('    </div>');
    htmlParts.push('    <div class="stat-box">');
    htmlParts.push(`      <div class="stat-value stat-failed">${spec.testResults.failed}</div>`);
    htmlParts.push('      <div class="stat-label">Failed</div>');
    htmlParts.push('    </div>');
    htmlParts.push('    <div class="stat-box">');
    htmlParts.push(`      <div class="stat-value stat-skipped">${spec.testResults.skipped}</div>`);
    htmlParts.push('      <div class="stat-label">Skipped</div>');
    htmlParts.push('    </div>');
    const total = spec.testResults.passed + spec.testResults.failed + spec.testResults.skipped;
    htmlParts.push('    <div class="stat-box">');
    htmlParts.push(`      <div class="stat-value">${total}</div>`);
    htmlParts.push('      <div class="stat-label">Total</div>');
    htmlParts.push('    </div>');
    htmlParts.push('  </div>');

    if (spec.testResults.coverage) {
      htmlParts.push('  <h3>Coverage</h3>');
      htmlParts.push('  <table>');
      htmlParts.push('    <thead><tr><th>Type</th><th>Percentage</th></tr></thead>');
      htmlParts.push('    <tbody>');
      htmlParts.push(`      <tr><td>Statements</td><td>${spec.testResults.coverage.statements}%</td></tr>`);
      htmlParts.push(`      <tr><td>Branches</td><td>${spec.testResults.coverage.branches}%</td></tr>`);
      htmlParts.push(`      <tr><td>Functions</td><td>${spec.testResults.coverage.functions}%</td></tr>`);
      htmlParts.push(`      <tr><td>Lines</td><td>${spec.testResults.coverage.lines}%</td></tr>`);
      htmlParts.push('    </tbody>');
      htmlParts.push('  </table>');
    }

    htmlParts.push('</section>');
  }

  // Risks Section
  if (spec.risks?.length) {
    htmlParts.push('<section>');
    htmlParts.push('  <h2>Risks</h2>');

    spec.risks.forEach(risk => {
      htmlParts.push('  <div class="risk-item">');
      htmlParts.push('    <span class="risk-icon">⚠️</span>');
      htmlParts.push(`    <span>${escapeHtml(risk)}</span>`);
      htmlParts.push('  </div>');
    });

    htmlParts.push('</section>');
  }

  // Timeline Section
  if (spec.timeline) {
    htmlParts.push('<section>');
    htmlParts.push('  <h2>Timeline</h2>');

    if (spec.timeline.estimatedDuration) {
      htmlParts.push(`  <p><strong>Estimated Duration:</strong> ${escapeHtml(spec.timeline.estimatedDuration)}</p>`);
    }

    if (spec.timeline.milestones?.length) {
      htmlParts.push('  <h3>Milestones</h3>');
      htmlParts.push('  <ol>');
      spec.timeline.milestones.forEach(milestone => {
        htmlParts.push(`    <li>${escapeHtml(milestone)}</li>`);
      });
      htmlParts.push('  </ol>');
    }

    htmlParts.push('</section>');
  }

  // Footer
  htmlParts.push('<footer>');
  htmlParts.push(`  <p>Generated by SpecSafe on ${new Date().toISOString()}</p>`);
  htmlParts.push('</footer>');

  htmlParts.push('</body>');
  htmlParts.push('</html>');

  const content = htmlParts.join('\n');

  return {
    content,
    filename: `${spec.id.toLowerCase()}.html`,
    mimeType: 'text/html',
    size: Buffer.byteLength(content, 'utf-8'),
  };
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
