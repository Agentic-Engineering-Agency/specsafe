import { describe, it, expect } from 'vitest';
import { TemplateEngine } from '../engine.js';

describe('TemplateEngine', () => {
  const engine = new TemplateEngine();

  it('should replace variables', () => {
    const result = engine.renderTemplate('Hello {{NAME}}!', { variables: { NAME: 'World' } });
    expect(result).toBe('Hello World!');
  });

  it('should handle conditionals', () => {
    const result = engine.renderTemplate('{{#if SHOW}}visible{{/if}}', { variables: { SHOW: true } });
    expect(result).toBe('visible');
  });

  it('should parse constraints', () => {
    const template = '<!-- @constraint: max-requirements 20 -->';
    const constraints = engine.parseConstraints(template);
    expect(constraints).toHaveLength(1);
    expect(constraints[0].type).toBe('max-requirements');
  });

  it('should validate constraints', () => {
    const spec = '### FR-001\n### FR-002';
    const result = engine.validateAgainstConstraints(spec, [{ type: 'max-requirements', param: 5 }]);
    expect(result.valid).toBe(true);
  });
});
