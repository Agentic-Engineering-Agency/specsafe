/**
 * Exporters Tests
 */

import { describe, it, expect } from 'vitest';
import { exportToMarkdown } from '../exporters/markdown.js';
import { exportToHTML } from '../exporters/html.js';
import { exportToJSON as exportToJSONModule, exportSpecsToJSON } from '../exporters/json.js';
import type { ParsedSpec } from '../types.js';

describe('Markdown Exporter', () => {
  const mockSpec: ParsedSpec = {
    id: 'SPEC-20260212-001',
    name: 'User Authentication',
    description: 'Secure authentication system for users',
    stage: 'spec',
    createdAt: new Date('2026-02-10'),
    updatedAt: new Date('2026-02-12'),
    metadata: {
      author: 'John Doe',
      project: 'MyApp',
      tags: ['auth', 'security'],
    },
    requirements: [
      {
        id: 'FR-1',
        text: 'User can login with email and password',
        priority: 'P0',
        scenarios: [
          {
            id: 'SCENARIO-001',
            given: 'User is on login page',
            when: 'User enters valid credentials',
            thenOutcome: 'User is authenticated',
          },
        ],
      },
    ],
    prd: {
      problemStatement: 'Users need secure access',
      userStories: ['As a user, I want to login'],
      acceptanceCriteria: ['Login works', 'Error handling'],
    },
  };

  it('should export to markdown format', () => {
    const result = exportToMarkdown(mockSpec);
    expect(result.content).toBeDefined();
    expect(result.filename).toBe('spec-20260212-001.md');
    expect(result.mimeType).toBe('text/markdown');
    expect(result.size).toBeGreaterThan(0);
  });

  it('should include spec header in markdown', () => {
    const result = exportToMarkdown(mockSpec);
    const content = result.content as string;
    expect(content).toContain('# User Authentication');
    expect(content).toContain('**Spec ID:** SPEC-20260212-001');
  });

  it('should include metadata when includeMetadata is true', () => {
    const result = exportToMarkdown(mockSpec, true);
    const content = result.content as string;
    expect(content).toContain('## Metadata');
    expect(content).toContain('John Doe');
    expect(content).toContain('MyApp');
  });

  it('should exclude metadata when includeMetadata is false', () => {
    const result = exportToMarkdown(mockSpec, false);
    const content = result.content as string;
    expect(content).not.toContain('## Metadata');
  });

  it('should include PRD section', () => {
    const result = exportToMarkdown(mockSpec);
    const content = result.content as string;
    expect(content).toContain('## Product Requirements Document (PRD)');
    expect(content).toContain('### Problem Statement');
  });

  it('should include requirements table', () => {
    const result = exportToMarkdown(mockSpec);
    const content = result.content as string;
    expect(content).toContain('## Requirements');
    expect(content).toContain('| ID | Requirement | Priority |');
  });

  it('should include scenarios', () => {
    const result = exportToMarkdown(mockSpec);
    const content = result.content as string;
    expect(content).toContain('- **Given** User is on login page');
    expect(content).toContain('**When** User enters valid credentials');
  });
});

describe('JSON Exporter', () => {
  const mockSpec: ParsedSpec = {
    id: 'SPEC-20260212-001',
    name: 'User Authentication',
    description: 'Secure authentication system',
    stage: 'qa',
    createdAt: new Date('2026-02-10'),
    updatedAt: new Date('2026-02-12'),
    completedAt: new Date('2026-02-15'),
    metadata: {
      author: 'Jane Doe',
      project: 'MyApp',
      tags: ['auth'],
    },
    requirements: [
      {
        id: 'FR-1',
        text: 'Login feature',
        priority: 'P0',
      },
    ],
    testResults: {
      passed: 10,
      failed: 1,
      skipped: 0,
      coverage: {
        statements: 90,
        branches: 85,
        functions: 88,
        lines: 89,
      },
    },
  };

  it('should export to JSON format', () => {
    const result = exportToJSONModule(mockSpec);
    expect(result.content).toBeDefined();
    expect(result.filename).toBe('spec-20260212-001.json');
    expect(result.mimeType).toBe('application/json');
  });

  it('should produce valid JSON', () => {
    const result = exportToJSONModule(mockSpec);
    const parsed = JSON.parse(result.content as string);
    expect(parsed).toBeDefined();
    expect(parsed.id).toBe('SPEC-20260212-001');
  });

  it('should include metadata when includeMetadata is true', () => {
    const result = exportToJSONModule(mockSpec, true);
    const parsed = JSON.parse(result.content as string);
    expect(parsed.metadata).toBeDefined();
    expect(parsed.metadata.author).toBe('Jane Doe');
  });

  it('should exclude metadata when includeMetadata is false', () => {
    const result = exportToJSONModule(mockSpec, false);
    const parsed = JSON.parse(result.content as string);
    expect(parsed.metadata).toBeUndefined();
  });

  it('should include history when includeHistory is true', () => {
    const result = exportToJSONModule(mockSpec, true, true);
    const parsed = JSON.parse(result.content as string);
    expect(parsed.history).toBeDefined();
    expect(parsed.history.createdAt).toBe('2026-02-10T00:00:00.000Z');
  });

  it('should not include history when includeHistory is false', () => {
    const result = exportToJSONModule(mockSpec, true, false);
    const parsed = JSON.parse(result.content as string);
    expect(parsed.history).toBeUndefined();
  });

  it('should include test results', () => {
    const result = exportToJSONModule(mockSpec);
    const parsed = JSON.parse(result.content as string);
    expect(parsed.testResults).toBeDefined();
    expect(parsed.testResults.passed).toBe(10);
    expect(parsed.testResults.coverage).toBeDefined();
  });

  it('should export multiple specs to JSON array', () => {
    const specs = [mockSpec, { ...mockSpec, id: 'SPEC-20260212-002', name: 'Another Spec' }];
    const result = exportSpecsToJSON(specs);
    const parsed = JSON.parse(result.content as string);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(2);
  });

  it('should include coverage data in JSON', () => {
    const result = exportToJSONModule(mockSpec);
    const parsed = JSON.parse(result.content as string);
    expect(parsed.testResults?.coverage?.statements).toBe(90);
    expect(parsed.testResults?.coverage?.branches).toBe(85);
  });
});

describe('HTML Exporter', () => {
  const mockSpec: ParsedSpec = {
    id: 'SPEC-20260212-001',
    name: 'User Authentication',
    description: 'Secure authentication system',
    stage: 'complete',
    createdAt: new Date('2026-02-10'),
    updatedAt: new Date('2026-02-12'),
    completedAt: new Date('2026-02-15'),
    metadata: {
      author: 'John Smith',
      project: 'SecureApp',
      tags: ['auth', 'security'],
    },
    requirements: [
      {
        id: 'FR-1',
        text: 'Login feature',
        priority: 'P0',
      },
      {
        id: 'FR-2',
        text: 'Password reset',
        priority: 'P1',
      },
    ],
    testResults: {
      passed: 20,
      failed: 0,
      skipped: 2,
      coverage: {
        statements: 95,
        branches: 90,
        functions: 92,
        lines: 94,
      },
    },
    risks: [
      'Authentication attacks',
      'Session hijacking',
    ],
  };

  it('should export to HTML format', () => {
    const result = exportToHTML(mockSpec);
    expect(result.content).toBeDefined();
    expect(result.filename).toBe('spec-20260212-001.html');
    expect(result.mimeType).toBe('text/html');
    expect(result.size).toBeGreaterThan(0);
  });

  it('should include DOCTYPE declaration', () => {
    const result = exportToHTML(mockSpec);
    const content = result.content as string;
    expect(content).toContain('<!DOCTYPE html>');
  });

  it('should include embedded CSS styles', () => {
    const result = exportToHTML(mockSpec);
    const content = result.content as string;
    expect(content).toContain('<style>');
    expect(content).toContain(':root');
    expect(content).toContain('body');
  });

  it('should include spec header', () => {
    const result = exportToHTML(mockSpec);
    const content = result.content as string;
    expect(content).toContain('<h1>User Authentication</h1>');
    expect(content).toContain('Spec ID: <strong>SPEC-20260212-001</strong>');
  });

  it('should include metadata section when includeMetadata is true', () => {
    const result = exportToHTML(mockSpec, true);
    const content = result.content as string;
    expect(content).toContain('<h2>Metadata</h2>');
    expect(content).toContain('John Smith');
    expect(content).toContain('SecureApp');
  });

  it('should exclude metadata when includeMetadata is false', () => {
    const result = exportToHTML(mockSpec, false);
    const content = result.content as string;
    expect(content).not.toContain('<h2>Metadata</h2>');
  });

  it('should include requirements table', () => {
    const result = exportToHTML(mockSpec);
    const content = result.content as string;
    expect(content).toContain('<h2>Requirements</h2>');
    expect(content).toContain('<table>');
    expect(content).toContain('FR-1');
  });

  it('should include priority badges', () => {
    const result = exportToHTML(mockSpec);
    const content = result.content as string;
    expect(content).toContain('badge-p0');
    expect(content).toContain('badge-p1');
  });

  it('should include test results section', () => {
    const result = exportToHTML(mockSpec);
    const content = result.content as string;
    expect(content).toContain('<h2>Test Results</h2>');
    expect(content).toContain('stat-passed');
    expect(content).toContain('stat-failed');
    expect(content).toContain('stat-skipped');
  });

  it('should include risks section', () => {
    const result = exportToHTML(mockSpec);
    const content = result.content as string;
    expect(content).toContain('<h2>Risks</h2>');
    expect(content).toContain('⚠️');
    expect(content).toContain('Authentication attacks');
  });

  it('should include coverage table', () => {
    const result = exportToHTML(mockSpec);
    const content = result.content as string;
    expect(content).toContain('Coverage');
    expect(content).toContain('Statements');
    expect(content).toContain('95%');
  });

  it('should escape HTML in content', () => {
    const specWithSpecialChars: ParsedSpec = {
      ...mockSpec,
      name: 'Test <script>alert("xss")</script>',
      description: 'A & B < C',
    };
    const result = exportToHTML(specWithSpecialChars);
    const content = result.content as string;
    expect(content).toContain('&lt;script&gt;');
    expect(content).toContain('&amp;');
    expect(content).toContain('&lt;');
  });

  it('should prevent XSS attacks in spec name', () => {
    const xssSpec: ParsedSpec = {
      ...mockSpec,
      name: '<script>alert("XSS")</script>',
      metadata: {
        ...mockSpec.metadata,
        author: '<img src=x onerror=alert(1)>',
      },
      requirements: [
        {
          id: 'XSS-1',
          text: '<script>document.cookie="stolen"</script>',
          priority: 'P0',
        },
      ],
    };
    const result = exportToHTML(xssSpec);
    const content = result.content as string;
    expect(content).not.toContain('<script>');
    expect(content).toContain('&lt;script&gt;');
    expect(content).toContain('&lt;img');
    // Note: onerror appears in escaped form within the img tag text
    expect(content).toContain('onerror=alert(1)');
    // But it should be inside an escaped tag, not executable
    expect(content).toContain('&lt;img');
  });

  it('should handle various XSS payloads', () => {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert(1)>',
      '<svg onload=alert(1)>',
      '<iframe src=javascript:alert(1)>',
      '<body onload=alert(1)>',
      '&lt;script&gt;alert(1)&lt;/script&gt;', // Double-encoded
    ];

    xssPayloads.forEach(payload => {
      const spec: ParsedSpec = {
        ...mockSpec,
        name: payload,
        description: payload,
      };
      const result = exportToHTML(spec);
      const content = result.content as string;
      expect(content).not.toContain(payload);
      expect(content).toMatch(/&lt;|&amp;lt;/);
    });

    // Test javascript: URI separately (it doesn't contain <)
    const javascriptPayload = 'javascript:alert("XSS")';
    const specWithJS: ParsedSpec = {
      ...mockSpec,
      name: javascriptPayload,
      description: javascriptPayload,
    };
    const result = exportToHTML(specWithJS);
    const content = result.content as string;
    // The javascript: text is in the title which is escaped in HTML context
    expect(content).toContain('javascript:alert(&quot;XSS&quot;)');
  });

  it('should include footer with timestamp', () => {
    const result = exportToHTML(mockSpec);
    const content = result.content as string;
    expect(content).toContain('<footer>');
    expect(content).toContain('Generated by SpecSafe');
  });
});

describe('Exporter Edge Cases', () => {
  it('should handle spec with minimal data', () => {
    const minimalSpec: ParsedSpec = {
      id: 'SPEC-001',
      name: 'Minimal Spec',
      description: '',
      stage: 'spec',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: { author: '', project: '', tags: [] },
    };

    const mdResult = exportToMarkdown(minimalSpec);
    expect(mdResult.content).toBeDefined();

    const jsonResult = exportToJSONModule(minimalSpec);
    const parsed = JSON.parse(jsonResult.content as string);
    expect(parsed.id).toBe('SPEC-001');

    const htmlResult = exportToHTML(minimalSpec);
    expect(htmlResult.content).toContain('<!DOCTYPE html>');
  });

  it('should handle empty arrays correctly', () => {
    const specWithEmptyArrays: ParsedSpec = {
      id: 'SPEC-001',
      name: 'Test',
      description: 'Test',
      stage: 'spec',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: { author: '', project: '', tags: [] },
      requirements: [],
      scenarios: [],
      risks: [],
    };

    const mdResult = exportToMarkdown(specWithEmptyArrays);
    expect(mdResult.content).toBeDefined();

    const jsonResult = exportToJSONModule(specWithEmptyArrays);
    const parsed = JSON.parse(jsonResult.content as string);
    expect(parsed.requirements).toBeUndefined();
  });
});
