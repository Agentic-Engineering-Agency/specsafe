import { describe, it, expect } from 'vitest';
import { parseChecklists, evaluateChecklists } from '../checklist.js';

describe('Checklist', () => {
  it('should parse checklists', () => {
    const template = '<!-- @checklist: acceptance-criteria-testable -->';
    const checklists = parseChecklists(template);
    expect(checklists).toHaveLength(1);
    expect(checklists[0].id).toBe('acceptance-criteria-testable');
  });

  it('should evaluate checklists', () => {
    const spec = 'Given user\nWhen action\nThen result';
    const checklists = parseChecklists('<!-- @checklist: acceptance-criteria-testable -->');
    const results = evaluateChecklists(spec, checklists);
    expect(results[0].valid).toBe(true);
  });
});
