/**
 * ProjectMemoryManager Tests
 * Tests for the project memory management functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, access } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { ProjectMemoryManager } from '../memory.js';

describe('ProjectMemoryManager', () => {
  let tempDir: string;
  let manager: ProjectMemoryManager;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'specsafe-memory-test-'));
    manager = new ProjectMemoryManager(tempDir);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('load', () => {
    it('should create default memory when file does not exist', async () => {
      const memory = await manager.load('test-project');
      
      expect(memory.projectId).toBe('test-project');
      expect(memory.specs).toEqual([]);
      expect(memory.decisions).toEqual([]);
      expect(memory.patterns).toEqual([]);
      expect(memory.constraints).toEqual([]);
      expect(memory.history).toEqual([]);
    });

    it('should load existing memory file', async () => {
      const memory = await manager.load('test-project');
      manager.addSpec('SPEC-20240101-001');
      await manager.save();

      const newManager = new ProjectMemoryManager(tempDir);
      const loaded = await newManager.load('test-project');
      
      expect(loaded.projectId).toBe('test-project');
      expect(loaded.specs).toContain('SPEC-20240101-001');
    });

    it('should convert date strings to Date objects on load', async () => {
      const memory = await manager.load('test-project');
      manager.addDecision('SPEC-001', 'Test decision', 'Test rationale');
      await manager.save();

      const newManager = new ProjectMemoryManager(tempDir);
      const loaded = await newManager.load('test-project');
      
      expect(loaded.decisions[0].timestamp instanceof Date).toBe(true);
    });
  });

  describe('save', () => {
    it('should persist memory to disk', async () => {
      const memory = await manager.load('test-project');
      manager.addSpec('SPEC-001');
      await manager.save();

      const memoryPath = join(tempDir, '.specsafe', 'memory.json');
      const exists = await access(memoryPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      const content = await readFile(memoryPath, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed.projectId).toBe('test-project');
      expect(parsed.specs).toContain('SPEC-001');
    });

    it('should throw if load was not called first', async () => {
      const newManager = new ProjectMemoryManager(tempDir);
      await expect(newManager.save()).rejects.toThrow('No memory loaded');
    });
  });

  describe('addSpec', () => {
    it('should add a spec to memory', async () => {
      await manager.load('test-project');
      manager.addSpec('SPEC-001');

      const memory = manager.getMemory();
      expect(memory.specs).toContain('SPEC-001');
    });

    it('should not duplicate specs', async () => {
      await manager.load('test-project');
      manager.addSpec('SPEC-001');
      manager.addSpec('SPEC-001');

      const memory = manager.getMemory();
      expect(memory.specs.filter(s => s === 'SPEC-001')).toHaveLength(1);
    });

    it('should add history entry', async () => {
      await manager.load('test-project');
      manager.addSpec('SPEC-001');

      const memory = manager.getMemory();
      expect(memory.history).toHaveLength(1);
      expect(memory.history[0].specId).toBe('SPEC-001');
      expect(memory.history[0].action).toBe('created');
    });
  });

  describe('addDecision', () => {
    it('should record a decision', async () => {
      await manager.load('test-project');
      const decision = manager.addDecision('SPEC-001', 'Use TypeScript', 'Type safety');

      expect(decision.specId).toBe('SPEC-001');
      expect(decision.decision).toBe('Use TypeScript');
      expect(decision.rationale).toBe('Type safety');
      expect(decision.alternatives).toEqual([]);
    });

    it('should record alternatives', async () => {
      await manager.load('test-project');
      const decision = manager.addDecision(
        'SPEC-001',
        'Use TypeScript',
        'Type safety',
        ['JavaScript', 'Flow']
      );

      expect(decision.alternatives).toEqual(['JavaScript', 'Flow']);
    });

    it('should add to history', async () => {
      await manager.load('test-project');
      manager.addDecision('SPEC-001', 'Use TypeScript', 'Type safety');

      const memory = manager.getMemory();
      const decisionHistory = memory.history.filter(h => h.action === 'decision');
      expect(decisionHistory).toHaveLength(1);
    });
  });

  describe('recordPattern', () => {
    it('should create a new pattern', async () => {
      await manager.load('test-project');
      const pattern = manager.recordPattern('SPEC-001', {
        name: 'jwt-auth',
        description: 'Use JWT for authentication',
        examples: [{ specId: 'SPEC-001', context: 'Login flow' }]
      });

      expect(pattern.name).toBe('jwt-auth');
      expect(pattern.usageCount).toBe(1);
    });

    it('should increment usage count for existing pattern', async () => {
      await manager.load('test-project');
      
      manager.recordPattern('SPEC-001', {
        name: 'jwt-auth',
        description: 'Use JWT for authentication',
        examples: [{ specId: 'SPEC-001', context: 'Login flow' }]
      });

      const pattern = manager.recordPattern('SPEC-002', {
        name: 'jwt-auth',
        description: 'Use JWT for authentication',
        examples: [{ specId: 'SPEC-002', context: 'API auth' }]
      });

      expect(pattern.usageCount).toBe(2);
      expect(pattern.examples).toHaveLength(2);
    });

    it('should be case-insensitive for pattern names', async () => {
      await manager.load('test-project');
      
      manager.recordPattern('SPEC-001', {
        name: 'JWT-Auth',
        description: 'Use JWT',
        examples: []
      });

      const pattern = manager.recordPattern('SPEC-002', {
        name: 'jwt-auth',
        description: 'Use JWT',
        examples: []
      });

      expect(pattern.usageCount).toBe(2);
    });
  });

  describe('addConstraint', () => {
    it('should add a constraint', async () => {
      await manager.load('test-project');
      const constraint = manager.addConstraint({
        type: 'technical',
        description: 'Must support Node 18+',
        specId: 'SPEC-001'
      });

      expect(constraint.type).toBe('technical');
      expect(constraint.description).toBe('Must support Node 18+');
    });
  });

  describe('getReusablePatterns', () => {
    it('should return patterns used multiple times', async () => {
      await manager.load('test-project');
      
      manager.recordPattern('SPEC-001', {
        name: 'jwt-auth',
        description: 'JWT auth',
        examples: [{ specId: 'SPEC-001', context: 'Login' }]
      });

      manager.recordPattern('SPEC-002', {
        name: 'jwt-auth',
        description: 'JWT auth',
        examples: [{ specId: 'SPEC-002', context: 'API' }]
      });

      manager.recordPattern('SPEC-003', {
        name: 'once-only',
        description: 'Used once',
        examples: [{ specId: 'SPEC-003', context: 'Test' }]
      });

      const reusable = manager.getReusablePatterns(2);
      expect(reusable).toHaveLength(1);
      expect(reusable[0].name).toBe('jwt-auth');
    });

    it('should sort by usage count', async () => {
      await manager.load('test-project');
      
      // Pattern A used 3 times
      for (let i = 1; i <= 3; i++) {
        manager.recordPattern(`SPEC-00${i}`, {
          name: 'pattern-a',
          description: 'Pattern A',
          examples: [{ specId: `SPEC-00${i}`, context: 'Test' }]
        });
      }

      // Pattern B used 5 times
      for (let i = 1; i <= 5; i++) {
        manager.recordPattern(`SPEC-01${i}`, {
          name: 'pattern-b',
          description: 'Pattern B',
          examples: [{ specId: `SPEC-01${i}`, context: 'Test' }]
        });
      }

      const reusable = manager.getReusablePatterns(2);
      expect(reusable[0].name).toBe('pattern-b');
      expect(reusable[1].name).toBe('pattern-a');
    });
  });

  describe('getRelatedSpecs', () => {
    it('should find specs sharing patterns', async () => {
      await manager.load('test-project');
      
      manager.recordPattern('SPEC-001', {
        name: 'jwt-auth',
        description: 'JWT auth',
        examples: [
          { specId: 'SPEC-001', context: 'Login' },
          { specId: 'SPEC-002', context: 'API' }
        ]
      });

      const related = manager.getRelatedSpecs('SPEC-001');
      expect(related).toContain('SPEC-002');
    });

    it('should find specs with related decisions', async () => {
      await manager.load('test-project');
      
      manager.addDecision('SPEC-001', 'Use PostgreSQL', 'Reliability');
      manager.addDecision('SPEC-002', 'Use PostgreSQL for main DB', 'Consistency with SPEC-001');

      const related = manager.getRelatedSpecs('SPEC-001');
      expect(related).toContain('SPEC-002');
    });

    it('should not include the spec itself', async () => {
      await manager.load('test-project');
      
      manager.recordPattern('SPEC-001', {
        name: 'jwt-auth',
        description: 'JWT auth',
        examples: [
          { specId: 'SPEC-001', context: 'Login' },
          { specId: 'SPEC-002', context: 'API' }
        ]
      });

      const related = manager.getRelatedSpecs('SPEC-001');
      expect(related).not.toContain('SPEC-001');
    });
  });

  describe('getContextForSpec', () => {
    it('should compile context for a spec', async () => {
      await manager.load('test-project');
      
      manager.addSpec('SPEC-001');
      manager.recordPattern('SPEC-001', {
        name: 'jwt-auth',
        description: 'JWT authentication',
        examples: [{ specId: 'SPEC-001', context: 'Login' }]
      });
      manager.addDecision('SPEC-001', 'Use TypeScript', 'Type safety');
      manager.addConstraint({
        type: 'technical',
        description: 'Node 18+ required'
      });

      const context = manager.getContextForSpec('SPEC-002');

      expect(context.patterns).toHaveLength(1);
      expect(context.constraints).toHaveLength(1);
      expect(context.summary).toContain('patterns');
    });
  });

  describe('exists', () => {
    it('should return false when memory file does not exist', async () => {
      const exists = await manager.exists();
      expect(exists).toBe(false);
    });

    it('should return true when memory file exists', async () => {
      await manager.load('test-project');
      await manager.save();

      const exists = await manager.exists();
      expect(exists).toBe(true);
    });
  });
});
