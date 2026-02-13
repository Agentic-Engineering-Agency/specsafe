/**
 * Tests for spec output path behavior and generateSpec integration
 */

import { describe, it, expect } from 'vitest';
import { ElicitationEngine } from '../engine.js';
import { quickFlow } from '../flows.js';
import { generateSpec } from '../generator.js';
import { defaultOutputPath } from '../paths.js';

describe('generateSpec output', () => {
  it('generates valid markdown from quick flow result', () => {
    const engine = new ElicitationEngine(quickFlow);
    let step = engine.start();

    // Answer all required steps with test data
    const testAnswers: Record<string, any> = {
      name: 'Test Feature',
      type: 'feature',
      priority: 'high',
      description: 'A test feature description',
      requirements: 'Requirement one\nRequirement two\nRequirement three',
    };

    while (step) {
      const answer = testAnswers[step.id] ?? step.default ?? 'test';
      step = engine.answer(step.id, answer);
    }

    const result = engine.getResult();
    const spec = generateSpec(result);

    expect(spec).toContain('# Test Feature');
    expect(spec).toContain('**Status**: draft');
    expect(spec).toContain('- Requirement one');
    expect(spec).toContain('- Requirement two');
    expect(spec).toContain('- Requirement three');
  });

  it('spec content is a string suitable for writing to any path', () => {
    const engine = new ElicitationEngine(quickFlow);
    let step = engine.start();

    const testAnswers: Record<string, any> = {
      name: 'Output Test',
      type: 'bugfix',
      priority: 'medium',
      description: 'Testing output',
      requirements: 'Must work',
    };

    while (step) {
      const answer = testAnswers[step.id] ?? step.default ?? 'test';
      step = engine.answer(step.id, answer);
    }

    const result = engine.getResult();
    const spec = generateSpec(result);

    // Spec is a plain string — can be written to any -o path
    expect(typeof spec).toBe('string');
    expect(spec.length).toBeGreaterThan(0);
    expect(spec).toMatch(/^# /); // Starts with markdown heading
  });

  it('default output path pattern uses timestamp', () => {
    const ts = 1707700000000;
    const result = defaultOutputPath(ts);

    expect(result).toBe(`specs/active/SPEC-${ts}.md`);
    expect(result).toMatch(/^specs\/active\/SPEC-\d+\.md$/);
    expect(result.endsWith('.md')).toBe(true);
  });

  it('defaultOutputPath uses Date.now when no timestamp provided', () => {
    const before = Date.now();
    const result = defaultOutputPath();
    const after = Date.now();

    const match = result.match(/SPEC-(\d+)\.md$/);
    expect(match).not.toBeNull();
    const ts = Number(match![1]);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });
});
