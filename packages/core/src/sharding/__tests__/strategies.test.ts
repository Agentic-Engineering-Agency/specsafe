/**
 * Sharding Strategies Tests
 */

import { describe, it, expect } from 'vitest';
import { shardBySection } from '../strategies/by-section.js';
import { shardByRequirement } from '../strategies/by-requirement.js';
import { shardByScenario } from '../strategies/by-scenario.js';
import { shardAuto } from '../strategies/auto.js';
import type { ShardOptions, ShardAnalysis } from '../types.js';

const defaultOptions: ShardOptions = {
  strategy: 'auto',
  maxTokensPerShard: 2000,
  preserveContext: true,
  includeMetadata: true,
};

describe('shardBySection', () => {
  it('splits by ## headers', () => {
    const spec = `# Title

## Requirements
- REQ-001: A

## Security
- REQ-002: B`;
    const shards = shardBySection(spec, defaultOptions);
    expect(shards.length).toBeGreaterThanOrEqual(2);
    expect(shards.some(s => s.sectionName === 'Requirements')).toBe(true);
    expect(shards.some(s => s.sectionName === 'Security')).toBe(true);
  });

  it('returns single shard when no sections exist', () => {
    const spec = `# Title\nNo section headers`;
    const shards = shardBySection(spec, defaultOptions);
    expect(shards.length).toBe(1);
  });

  it('splits oversized sections by token limit', () => {
    const spec = `# Title\n\n## Requirements\n${'line\n\n'.repeat(400)}`;
    const shards = shardBySection(spec, { ...defaultOptions, maxTokensPerShard: 100 });
    expect(shards.length).toBeGreaterThan(1);
    expect(shards.some(s => s.id.includes('chunk'))).toBe(true);
  });

  it('adds header as dependency for section shards', () => {
    const spec = `# Title\nIntro\n\n## Requirements\n- REQ-001: A`;
    const shards = shardBySection(spec, defaultOptions);
    const header = shards.find(s => s.type === 'metadata');
    const section = shards.find(s => s.sectionName === 'Requirements');
    expect(header).toBeDefined();
    expect(section?.dependencies).toContain(header!.id);
  });

  it('sanitizes section names in IDs', () => {
    const spec = `## Requirements & Security!\n- item`;
    const shards = shardBySection(spec, defaultOptions);
    expect(shards[0].id).toContain('requirements-security');
  });
});

describe('shardByRequirement', () => {
  it('creates one shard per requirement', () => {
    const spec = `## Requirements
- REQ-001: Must do A
- REQ-002: Must do B`;
    const shards = shardByRequirement(spec, defaultOptions);
    expect(shards.filter(s => s.type === 'requirement').length).toBe(2);
  });

  it('extracts keyword-based requirements', () => {
    const spec = `## Requirements
- MUST support login
- SHOULD support remember-me`;
    const shards = shardByRequirement(spec, defaultOptions);
    const req = shards.filter(s => s.type === 'requirement');
    expect(req.length).toBe(2);
    expect(req[0].content).toContain('Priority');
  });

  it('includes pre-requirement context in metadata/header shard', () => {
    const spec = `# Header
Some context
- REQ-001: Must do A`;
    const shards = shardByRequirement(spec, { ...defaultOptions, preserveContext: true });
    const metadata = shards.find(s => s.type === 'metadata');
    expect(metadata?.content).toContain('Some context');
  });

  it('falls back to single shard when no requirements', () => {
    const shards = shardByRequirement('No requirements here', defaultOptions);
    expect(shards.length).toBe(1);
    expect(shards[0].id).toContain('full');
  });

  it('captures scenarios under requirement', () => {
    const spec = `- REQ-001: must login
Scenario: valid login
Given user exists
When user logs in
Then success`;
    const shards = shardByRequirement(spec, defaultOptions);
    const req = shards.find(s => s.type === 'requirement');
    expect(req?.content).toContain('## Scenarios');
  });
});

describe('shardByScenario', () => {
  it('creates one shard per scenario', () => {
    const spec = `Scenario: A
Given x
When y
Then z

Scenario: B
Given x
When y
Then z`;
    const shards = shardByScenario(spec, defaultOptions);
    expect(shards.filter(s => s.type === 'scenario').length).toBe(2);
  });

  it('includes Gherkin in shard content', () => {
    const spec = `Scenario: Login
Given user exists
When user logs in
Then success`;
    const shards = shardByScenario(spec, defaultOptions);
    const s = shards.find(x => x.type === 'scenario');
    expect(s?.content).toContain('Given user exists');
    expect(s?.content).toContain('When user logs in');
    expect(s?.content).toContain('Then success');
  });

  it('creates context shard for preamble', () => {
    const spec = `# Preamble
Some intro

Scenario: Login
Given user exists
When login
Then success`;
    const shards = shardByScenario(spec, defaultOptions);
    expect(shards[0].type).toBe('metadata');
  });

  it('falls back to full shard when no scenarios', () => {
    const shards = shardByScenario('No scenarios', defaultOptions);
    expect(shards.length).toBe(1);
    expect(shards[0].id).toContain('full');
  });

  it('links scenario to related requirement when present', () => {
    const spec = `REQ-001
Scenario: Login
Given user exists
When login
Then success`;
    const shards = shardByScenario(spec, defaultOptions);
    const s = shards.find(x => x.type === 'scenario');
    expect(s?.content).toContain('Related Requirement');
  });
});

describe('shardAuto', () => {
  const baseAnalysis: ShardAnalysis = {
    recommendedStrategy: 'auto',
    complexity: 60,
    sectionCount: 3,
    requirementCount: 6,
    scenarioCount: 2,
    totalLines: 120,
    totalTokens: 3000,
    recommendationReason: 'test',
  };

  it('returns single shard if under token limit', () => {
    const analysis = { ...baseAnalysis, totalTokens: 100 };
    const shards = shardAuto('short', { ...defaultOptions, maxTokensPerShard: 2000 }, analysis);
    expect(shards.length).toBe(1);
  });

  it('prefers scenario strategy when scenarios dominate', () => {
    const analysis = { ...baseAnalysis, scenarioCount: 10, requirementCount: 2 };
    const spec = `Scenario: A
Given x
When y
Then z

Scenario: B
Given x
When y
Then z`;
    const shards = shardAuto(spec, defaultOptions, analysis);
    expect(shards.some(s => s.type === 'scenario')).toBe(true);
  });

  it('prefers requirement strategy when many requirements', () => {
    const analysis = { ...baseAnalysis, requirementCount: 20, scenarioCount: 1 };
    const spec = `- REQ-001: A
- REQ-002: B
- REQ-003: C`;
    const shards = shardAuto(spec, defaultOptions, analysis);
    expect(shards.some(s => s.type === 'requirement')).toBe(true);
  });

  it('prefixes generated ids with auto-', () => {
    const analysis = { ...baseAnalysis, totalTokens: 5000 };
    const spec = `## Requirements
- REQ-001: A`;
    const shards = shardAuto(spec, defaultOptions, analysis);
    expect(shards.every(s => s.id.startsWith('auto-'))).toBe(true);
  });

  it('enforces token limits by splitting oversized shards', () => {
    const analysis = { ...baseAnalysis, totalTokens: 10000, sectionCount: 0, requirementCount: 0, scenarioCount: 0 };
    const spec = '# Big\n\n' + 'word '.repeat(5000);
    const shards = shardAuto(spec, { ...defaultOptions, maxTokensPerShard: 200 }, analysis);
    expect(shards.length).toBeGreaterThan(1);
  });
});
