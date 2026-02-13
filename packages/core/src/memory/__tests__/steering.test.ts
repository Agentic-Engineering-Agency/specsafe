/**
 * SteeringEngine Tests
 * Tests for the steering and guidance engine
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { SteeringEngine } from '../steering.js';
import { ProjectMemoryManager } from '../memory.js';

describe('SteeringEngine', () => {
  let tempDir: string;
  let engine: SteeringEngine;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'specsafe-steering-test-'));
    engine = new SteeringEngine(tempDir);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('initialize', () => {
    it('should initialize with project memory', async () => {
      await engine.initialize('test-project');
      const memory = engine.getMemory();
      
      expect(memory).not.toBeNull();
      expect(memory?.projectId).toBe('test-project');
    });
  });

  describe('analyze', () => {
    it('should throw if not initialized', () => {
      expect(() => engine.analyze({ currentSpec: 'SPEC-001' }))
        .toThrow('not initialized');
    });

    it('should return context, warnings, and recommendations', async () => {
      await engine.initialize('test-project');
      
      const result = engine.analyze({ currentSpec: 'SPEC-001' });

      expect(result).toHaveProperty('context');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('relatedDecisions');
    });

    it('should include pattern recommendations', async () => {
      await engine.initialize('test-project');
      
      const manager = engine.getMemoryManager();
      
      // Add some patterns
      for (let i = 1; i <= 3; i++) {
        manager.recordPattern(`SPEC-00${i}`, {
          name: 'jwt-auth',
          description: 'JWT authentication pattern',
          examples: [{ specId: `SPEC-00${i}`, context: 'Auth' }]
        });
      }

      const result = engine.analyze({ currentSpec: 'SPEC-NEW' });

      const patternRecs = result.recommendations.filter(
        r => r.type === 'pattern'
      );
      expect(patternRecs.length).toBeGreaterThan(0);
      expect(patternRecs[0].message).toContain('jwt-auth');
    });
  });

  describe('suggest', () => {
    it('should suggest frequently used patterns', async () => {
      await engine.initialize('test-project');
      const manager = engine.getMemoryManager();

      // Create patterns with varying usage
      for (let i = 1; i <= 5; i++) {
        manager.recordPattern(`SPEC-00${i}`, {
          name: 'common-pattern',
          description: 'A commonly used pattern',
          examples: [{ specId: `SPEC-00${i}`, context: 'Test' }]
        });
      }

      manager.recordPattern('SPEC-006', {
        name: 'rare-pattern',
        description: 'A rarely used pattern',
        examples: [{ specId: 'SPEC-006', context: 'Test' }]
      });

      const suggestions = engine.suggest({ currentSpec: 'SPEC-NEW' });
      const patternSuggestions = suggestions.filter(s => s.type === 'pattern');

      expect(patternSuggestions.some(s => s.message.includes('common-pattern'))).toBe(true);
    });

    it('should suggest decisions from related specs', async () => {
      await engine.initialize('test-project');
      const manager = engine.getMemoryManager();

      // Create related specs through shared pattern
      manager.recordPattern('SPEC-001', {
        name: 'shared-pattern',
        description: 'Shared',
        examples: [
          { specId: 'SPEC-001', context: 'Test' },
          { specId: 'SPEC-002', context: 'Test' }
        ]
      });

      manager.addDecision('SPEC-002', 'Use PostgreSQL', 'Reliability');

      const suggestions = engine.suggest({ currentSpec: 'SPEC-001' });
      const decisionSuggestions = suggestions.filter(s => s.type === 'decision');

      expect(decisionSuggestions.length).toBeGreaterThan(0);
      expect(decisionSuggestions[0].message).toContain('PostgreSQL');
    });

    it('should suggest constraints', async () => {
      await engine.initialize('test-project');
      const manager = engine.getMemoryManager();

      manager.addConstraint({
        type: 'technical',
        description: 'Must support Node 18+'
      });

      const suggestions = engine.suggest({ currentSpec: 'SPEC-001' });
      const constraintSuggestions = suggestions.filter(s => s.type === 'constraint');

      expect(constraintSuggestions.length).toBeGreaterThan(0);
      expect(constraintSuggestions[0].message).toContain('Node 18');
    });

    it('should set appropriate confidence levels', async () => {
      await engine.initialize('test-project');
      const manager = engine.getMemoryManager();

      // Pattern with high usage
      for (let i = 1; i <= 5; i++) {
        manager.recordPattern(`SPEC-00${i}`, {
          name: 'high-confidence',
          description: 'High confidence pattern',
          examples: [{ specId: `SPEC-00${i}`, context: 'Test' }]
        });
      }

      const suggestions = engine.suggest({ currentSpec: 'SPEC-NEW' });
      const highConf = suggestions.find(s => s.message.includes('high-confidence'));

      expect(highConf?.confidence).toBe('high');
    });
  });

  describe('warn', () => {
    it('should detect pattern inconsistencies', async () => {
      await engine.initialize('test-project');
      const manager = engine.getMemoryManager();

      // Create a common pattern
      for (let i = 1; i <= 5; i++) {
        manager.recordPattern(`SPEC-00${i}`, {
          name: 'common-auth',
          description: 'Common authentication',
          examples: [{ specId: `SPEC-00${i}`, context: 'Auth' }]
        });
      }

      // Spec uses a different pattern
      manager.recordPattern('SPEC-CURRENT', {
        name: 'different-auth',
        description: 'Different authentication approach',
        examples: [{ specId: 'SPEC-CURRENT', context: 'Auth' }]
      });

      const warnings = engine.warn({ currentSpec: 'SPEC-CURRENT' });

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].type).toBe('consistency');
    });

    it('should detect decision conflicts', async () => {
      await engine.initialize('test-project');
      const manager = engine.getMemoryManager();

      manager.addDecision('SPEC-001', 'Use PostgreSQL', 'Reliability');
      manager.addDecision('SPEC-CURRENT', 'Migrate to MongoDB', 'Scalability');

      const warnings = engine.warn({ currentSpec: 'SPEC-CURRENT' });
      const conflictWarnings = warnings.filter(w => w.type === 'conflict');

      expect(conflictWarnings.length).toBeGreaterThan(0);
      expect(conflictWarnings[0].severity).toBe('high');
    });

    it('should warn about missing constraints', async () => {
      await engine.initialize('test-project');
      const manager = engine.getMemoryManager();

      manager.addConstraint({
        type: 'architectural',
        description: 'Must use microservices architecture'
      });

      const warnings = engine.warn({ currentSpec: 'SPEC-001' });
      const missingWarnings = warnings.filter(w => w.type === 'missing');

      expect(missingWarnings.length).toBeGreaterThan(0);
    });

    it('should include related spec IDs in warnings', async () => {
      await engine.initialize('test-project');
      const manager = engine.getMemoryManager();

      manager.addDecision('SPEC-001', 'Use PostgreSQL', 'Reliability');
      manager.addDecision('SPEC-CURRENT', 'Use MongoDB', 'Scalability');

      const warnings = engine.warn({ currentSpec: 'SPEC-CURRENT' });

      expect(warnings[0].relatedSpecId).toBe('SPEC-001');
    });
  });

  describe('recommendPatterns', () => {
    it('should return patterns sorted by usage', async () => {
      await engine.initialize('test-project');
      const manager = engine.getMemoryManager();

      // Pattern A used 2 times
      for (let i = 1; i <= 2; i++) {
        manager.recordPattern(`SPEC-00${i}`, {
          name: 'pattern-a',
          description: 'Pattern A',
          examples: [{ specId: `SPEC-00${i}`, context: 'Test' }]
        });
      }

      // Pattern B used 4 times
      for (let i = 1; i <= 4; i++) {
        manager.recordPattern(`SPEC-01${i}`, {
          name: 'pattern-b',
          description: 'Pattern B',
          examples: [{ specId: `SPEC-01${i}`, context: 'Test' }]
        });
      }

      const patterns = engine.recommendPatterns('SPEC-NEW', 5);

      expect(patterns[0].name).toBe('pattern-b');
      expect(patterns[0].usageCount).toBe(4);
    });

    it('should respect limit parameter', async () => {
      await engine.initialize('test-project');
      const manager = engine.getMemoryManager();

      for (let i = 1; i <= 10; i++) {
        manager.recordPattern(`SPEC-00${i}`, {
          name: `pattern-${i}`,
          description: `Pattern ${i}`,
          examples: [{ specId: `SPEC-00${i}`, context: 'Test' }]
        });
      }

      const patterns = engine.recommendPatterns('SPEC-NEW', 3);

      expect(patterns).toHaveLength(3);
    });

    it('should prioritize patterns from related specs', async () => {
      await engine.initialize('test-project');
      const manager = engine.getMemoryManager();

      // Create related specs
      manager.recordPattern('SPEC-RELATED', {
        name: 'related-pattern',
        description: 'From related spec',
        examples: [
          { specId: 'SPEC-RELATED', context: 'Test' },
          { specId: 'SPEC-CURRENT', context: 'Test' }
        ]
      });

      // Pattern used many times but not in related specs
      for (let i = 1; i <= 10; i++) {
        manager.recordPattern(`SPEC-OTHER-${i}`, {
          name: 'popular-pattern',
          description: 'Popular pattern',
          examples: [{ specId: `SPEC-OTHER-${i}`, context: 'Test' }]
        });
      }

      const patterns = engine.recommendPatterns('SPEC-CURRENT', 2);

      // Related pattern should be first even with lower usage
      expect(patterns[0].name).toBe('related-pattern');
    });
  });

  describe('integration with memory manager', () => {
    it('should persist and reload analysis context', async () => {
      await engine.initialize('test-project');
      const manager = engine.getMemoryManager();

      manager.addSpec('SPEC-001');
      manager.addDecision('SPEC-001', 'Use TypeScript', 'Type safety');
      manager.recordPattern('SPEC-001', {
        name: 'jwt-auth',
        description: 'JWT auth',
        examples: [{ specId: 'SPEC-001', context: 'Login' }]
      });
      await manager.save();

      // Create new engine instance
      const newEngine = new SteeringEngine(tempDir);
      await newEngine.initialize('test-project');

      const result = newEngine.analyze({ currentSpec: 'SPEC-002' });

      expect(result.relatedDecisions).toHaveLength(1);
      expect(result.context).toContain('patterns');
    });
  });
});
