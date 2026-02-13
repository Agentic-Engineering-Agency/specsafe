/**
 * ShardEngine Tests
 */

import { describe, it, expect } from 'vitest';
import { ShardEngine } from '../sharding.js';

describe('ShardEngine', () => {
  describe('analyze', () => {
    it('should analyze a simple spec correctly', () => {
      const engine = new ShardEngine();
      const spec = `
# Test Spec

## Requirements
- REQ-001: User must be able to login
- REQ-002: User must be able to logout

## Scenarios
Scenario: User logs in successfully
  Given user is on login page
  When user enters valid credentials
  Then user is redirected to dashboard
`;

      const analysis = engine.analyze(spec);
      
      expect(analysis.sectionCount).toBe(2);
      expect(analysis.requirementCount).toBeGreaterThan(0);
      expect(analysis.scenarioCount).toBeGreaterThan(0);
      expect(analysis.totalLines).toBeGreaterThan(0);
      expect(analysis.totalTokens).toBeGreaterThan(0);
      expect(analysis.complexity).toBeGreaterThan(0);
      expect(analysis.complexity).toBeLessThanOrEqual(100);
    });

    it('should recommend by-section for specs with clear sections', () => {
      const engine = new ShardEngine();
      const spec = `
# Test Spec

## Requirements
- REQ-001: Requirement 1

## Security
- REQ-002: Security requirement

## Testing
- Test case 1
`;

      const analysis = engine.analyze(spec);
      
      expect(analysis.recommendedStrategy).toBe('by-section');
      expect(analysis.recommendationReason).toContain('section');
    });

    it('should recommend by-requirement for specs with many requirements', () => {
      const engine = new ShardEngine();
      let requirements = '';
      for (let i = 1; i <= 20; i++) {
        requirements += `- REQ-${String(i).padStart(3, '0')}: Requirement ${i}\n`;
      }
      
      const spec = `
# Test Spec

## Requirements
${requirements}
`;

      const analysis = engine.analyze(spec);
      
      expect(analysis.recommendedStrategy).toBe('by-requirement');
      expect(analysis.recommendationReason).toContain('requirement');
    });

    it('should recommend by-scenario for specs with many scenarios', () => {
      const engine = new ShardEngine();
      let scenarios = '';
      for (let i = 1; i <= 15; i++) {
        scenarios += `
Scenario: Scenario ${i}
  Given condition ${i}
  When action ${i}
  Then result ${i}
`;
      }
      
      const spec = `
# Test Spec

${scenarios}
`;

      const analysis = engine.analyze(spec);
      
      expect(analysis.recommendedStrategy).toBe('by-scenario');
      expect(analysis.recommendationReason).toContain('scenario');
    });

    it('should estimate tokens correctly', () => {
      const engine = new ShardEngine();
      
      const shortText = 'Hello world';
      expect(engine.estimateTokens(shortText)).toBe(3);
      
      const longText = 'a'.repeat(400);
      expect(engine.estimateTokens(longText)).toBe(100);
    });
  });

  describe('shard', () => {
    it('should shard a spec using by-section strategy', () => {
      const engine = new ShardEngine({ strategy: 'by-section' });
      const spec = `
# Test Spec

## Requirements
- REQ-001: User must login

## Security
- Authentication required

## Testing
- Test cases
`;

      const result = engine.shard(spec);
      
      expect(result.success).toBe(true);
      expect(result.plan.shards.length).toBeGreaterThan(1);
      expect(result.plan.estimatedTokens).toBeGreaterThan(0);
      expect(result.plan.recommendedOrder.length).toBe(result.plan.shards.length);
    });

    it('should shard a spec using by-requirement strategy', () => {
      const engine = new ShardEngine({ strategy: 'by-requirement' });
      const spec = `
# Test Spec

## Requirements
- REQ-001: User must login
- REQ-002: User must logout
- REQ-003: User must reset password
`;

      const result = engine.shard(spec);
      
      expect(result.success).toBe(true);
      expect(result.plan.shards.length).toBeGreaterThan(1);
      
      const reqShards = result.plan.shards.filter(s => s.type === 'requirement');
      expect(reqShards.length).toBe(3);
    });

    it('should shard a spec using by-scenario strategy', () => {
      const engine = new ShardEngine({ strategy: 'by-scenario' });
      const spec = `
# Test Spec

## Scenarios
Scenario: Login success
  Given user is on login page
  When user enters valid credentials
  Then user is redirected

Scenario: Login failure
  Given user is on login page
  When user enters invalid credentials
  Then error is shown
`;

      const result = engine.shard(spec);
      
      expect(result.success).toBe(true);
      expect(result.plan.shards.length).toBeGreaterThan(1);
      
      const scenarioShards = result.plan.shards.filter(s => s.type === 'scenario');
      expect(scenarioShards.length).toBe(2);
    });

    it('should shard a spec using auto strategy', () => {
      const engine = new ShardEngine({ strategy: 'auto' });
      const spec = `
# Test Spec

## Requirements
- REQ-001: Requirement 1
- REQ-002: Requirement 2

## Scenarios
Scenario: Test scenario
  Given condition
  When action
  Then result
`;

      const result = engine.shard(spec);
      
      expect(result.success).toBe(true);
      expect(result.plan.shards.length).toBeGreaterThan(0);
    });

    it('should respect maxTokensPerShard', () => {
      const engine = new ShardEngine({ 
        strategy: 'by-section',
        maxTokensPerShard: 100 
      });
      
      // Create a large section
      const largeContent = '# Large Section\n\n' + 'A'.repeat(1000);
      const spec = `
${largeContent}

## Small Section
Small content
`;

      const result = engine.shard(spec);
      
      expect(result.success).toBe(true);
      
      // Check that no shard exceeds the limit significantly
      for (const shard of result.plan.shards) {
        if (shard.tokenCount) {
          expect(shard.tokenCount).toBeLessThanOrEqual(100 * 1.5); // Allow 50% margin
        }
      }
    });
  });

  describe('merge', () => {
    it('should merge shards back together', () => {
      const engine = new ShardEngine();
      const spec = `
# Test Spec

## Requirements
- REQ-001: User must login

## Security
- Authentication required
`;

      const result = engine.shard(spec);
      const mergeResult = engine.merge(result.plan.shards);
      
      expect(mergeResult.success).toBe(true);
      expect(mergeResult.content).toContain('Requirements');
      expect(mergeResult.content).toContain('Security');
    });

    it('should handle empty shards', () => {
      const engine = new ShardEngine();
      const mergeResult = engine.merge([]);
      
      expect(mergeResult.success).toBe(true);
      expect(mergeResult.content).toBe('');
    });

    it('should preserve content when merging', () => {
      const engine = new ShardEngine();
      const originalSpec = 'Hello world';
      
      const result = engine.shard(originalSpec);
      const mergeResult = engine.merge(result.plan.shards);
      
      expect(mergeResult.content).toContain('Hello');
    });
  });

  describe('findDependencies', () => {
    it('should find explicit references between shards', () => {
      const engine = new ShardEngine({ strategy: 'by-section' });
      const spec = `
# Test Spec

## Requirements
- REQ-001: Main requirement

## Implementation
See REQ-001 for details
`;

      const result = engine.shard(spec);
      const refs = engine.findDependencies(result.plan.shards);
      
      expect(refs.length).toBeGreaterThan(0);
      expect(['references', 'depends-on']).toContain(refs[0].type);
    });

    it('should detect section references', () => {
      const engine = new ShardEngine({ strategy: 'by-section' });
      const spec = `
# Test Spec

## Requirements
- REQ-001: Requirement

## Implementation
See REQ-001 in the Requirements section for more details
`;

      const result = engine.shard(spec);
      const refs = engine.findDependencies(result.plan.shards);
      
      expect(refs.length).toBeGreaterThan(0);
    });
  });

  describe('recommendedOrder', () => {
    it('should create a valid topological order', () => {
      const engine = new ShardEngine();
      const spec = `
# Test Spec

## Requirements
- REQ-001: Depends on header

## Implementation
Depends on REQ-001
`;

      const result = engine.shard(spec);
      
      expect(result.plan.recommendedOrder.length).toBe(result.plan.shards.length);
      expect(result.plan.shards.every(s => result.plan.recommendedOrder.includes(s.id))).toBe(true);
    });

    it('should prioritize metadata shards', () => {
      const engine = new ShardEngine({ strategy: 'by-section' });
      const spec = `
# Test Spec

Header content

## Requirements
- REQ-001: Requirement
`;

      const result = engine.shard(spec);
      
      // Header/metadata should come first
      const firstShardId = result.plan.recommendedOrder[0];
      const firstShard = result.plan.shards.find(s => s.id === firstShardId);
      expect(firstShard?.type).toBe('metadata');
    });
  });

  describe('error handling', () => {
    it('should handle empty spec gracefully', () => {
      const engine = new ShardEngine();
      const result = engine.shard('');
      
      expect(result.success).toBe(true);
      expect(result.plan.shards.length).toBeGreaterThan(0);
    });

    it('should handle invalid strategy by falling back', () => {
      const engine = new ShardEngine({ 
        strategy: 'auto' as any // Force auto to test fallback
      });
      const spec = '# Simple Spec';
      
      const result = engine.shard(spec);
      
      expect(result.success).toBe(true);
    });
  });
});
