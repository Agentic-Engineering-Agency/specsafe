/**
 * ProjectMemoryManager Tests
 * Tests for the project memory management functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, access } from 'fs/promises';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
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

  describe('Security: Input Validation', () => {
    it('should reject invalid spec IDs with special characters', async () => {
      await manager.load('test-project');
      
      expect(() => manager.addSpec('SPEC-001; rm -rf /')).toThrow('Invalid spec ID format');
      expect(() => manager.addSpec('SPEC-001|cat /etc/passwd')).toThrow('Invalid spec ID format');
      expect(() => manager.addSpec('SPEC-001$(whoami)')).toThrow('Invalid spec ID format');
    });

    it('should reject empty decision text', async () => {
      await manager.load('test-project');
      
      expect(() => manager.addDecision('SPEC-001', '', 'Rationale')).toThrow('Decision cannot be empty');
      expect(() => manager.addDecision('SPEC-001', '   ', 'Rationale')).toThrow('Decision cannot be empty');
    });

    it('should reject empty rationale', async () => {
      await manager.load('test-project');
      
      expect(() => manager.addDecision('SPEC-001', 'Decision', '')).toThrow('Rationale cannot be empty');
    });

    it('should reject invalid pattern names', async () => {
      await manager.load('test-project');
      
      expect(() => manager.recordPattern('SPEC-001', {
        name: '',
        description: 'Test pattern',
        examples: []
      })).toThrow('Pattern name cannot be empty');
    });

    it('should reject invalid constraint types', async () => {
      await manager.load('test-project');
      
      expect(() => manager.addConstraint({
        type: 'invalid' as any,
        description: 'Test constraint'
      })).toThrow('Invalid constraint type');
    });

    it('should sanitize input strings', async () => {
      await manager.load('test-project');
      
      const decision = manager.addDecision(
        'SPEC-001',
        'Use TypeScript\x00',
        'Type safety\x01'
      );
      
      expect(decision.decision).not.toContain('\x00');
      expect(decision.rationale).not.toContain('\x01');
    });
  });

  describe('Security: Data Sanitization', () => {
    it('should redact sensitive info from decision rationale', async () => {
      await manager.load('test-project');
      
      const decision = manager.addDecision(
        'SPEC-001',
        'Use JWT',
        'Use token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
      );
      
      expect(decision.rationale).toContain('[REDACTED]');
      expect(decision.rationale).not.toContain('eyJhbGci');
    });

    it('should redact sensitive info from alternatives', async () => {
      await manager.load('test-project');
      
      const decision = manager.addDecision(
        'SPEC-001',
        'Use API',
        'For security',
        ['Use sk-proj-abc123', 'Use xyz789']
      );
      
      expect(decision.alternatives[0]).toContain('[REDACTED]');
      expect(decision.alternatives[0]).not.toContain('abc123');
    });

    it('should limit alternatives to 10 items', async () => {
      await manager.load('test-project');
      
      const alternatives = Array.from({ length: 15 }, (_, i) => `Alternative ${i}`);
      const decision = manager.addDecision(
        'SPEC-001',
        'Choose option',
        'Test',
        alternatives
      );
      
      expect(decision.alternatives).toHaveLength(10);
    });

    it('should limit pattern examples to 20 items', async () => {
      await manager.load('test-project');
      
      const examples = Array.from({ length: 25 }, (_, i) => ({
        specId: `SPEC-${i}`,
        context: `Example ${i}`
      }));
      
      const pattern = manager.recordPattern('SPEC-001', {
        name: 'test-pattern',
        description: 'Test',
        examples
      });
      
      expect(pattern.examples).toHaveLength(20);
    });

    it('should limit history to 1000 entries', async () => {
      await manager.load('test-project');
      
      // Add more than 1000 specs
      for (let i = 0; i < 1100; i++) {
        manager.addSpec(`SPEC-${i.toString().padStart(3, '0')}`);
      }
      
      const memory = manager.getMemory();
      expect(memory.history.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('Security: Path Handling', () => {
    it('should always resolve memory file under provided project root', async () => {
      const managerWithNested = new ProjectMemoryManager(join(tempDir, 'nested/../project'));
      expect(managerWithNested.getMemoryFilePath()).toContain('.specsafe/memory.json');
      expect(managerWithNested.getMemoryFilePath()).not.toContain('..');
    });
  });

  describe('Concurrent Access', () => {
    it('should handle concurrent save operations', async () => {
      await manager.load('test-project');
      
      // Create multiple concurrent saves
      const saves = Array.from({ length: 10 }, (_, i) => 
        async () => {
          manager.addSpec(`SPEC-${i}`);
          await manager.save();
        }
      );
      
      // Execute all saves
      await Promise.all(saves.map(fn => fn()));
      
      // Reload and verify data integrity
      const newManager = new ProjectMemoryManager(tempDir);
      const loaded = await newManager.load('test-project');
      
      expect(loaded.specs).toHaveLength(10);
    });

    it('should handle concurrent load operations', async () => {
      await manager.load('test-project');
      manager.addSpec('SPEC-001');
      await manager.save();
      
      // Create multiple concurrent loads
      const loads = Array.from({ length: 10 }, () => 
        async () => {
          const m = new ProjectMemoryManager(tempDir);
          return await m.load('test-project');
        }
      );
      
      const results = await Promise.all(loads.map(fn => fn()));
      
      // All should return the same data
      results.forEach(loaded => {
        expect(loaded.specs).toContain('SPEC-001');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in memory file', async () => {
      await manager.load('test-project');
      await manager.save();
      
      // Corrupt the file
      const { writeFile } = await import('fs/promises');
      await writeFile(manager.getMemoryFilePath(), '{ invalid json }');
      
      const newManager = new ProjectMemoryManager(tempDir);
      
      await expect(newManager.load('test-project')).rejects.toThrow('Invalid JSON');
    });

    it('should handle empty memory file', async () => {
      const { writeFile, mkdir } = await import('fs/promises');
      const path = manager.getMemoryFilePath();
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, '');
      
      const newManager = new ProjectMemoryManager(tempDir);
      
      await expect(newManager.load('test-project')).rejects.toThrow('Memory file is empty');
    });

    it('should handle invalid memory structure', async () => {
      const { writeFile, mkdir } = await import('fs/promises');
      const path = manager.getMemoryFilePath();
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, JSON.stringify({
        projectId: 'test',
        specs: 'invalid' // Should be array
      }));
      
      const newManager = new ProjectMemoryManager(tempDir);
      
      await expect(newManager.load('test-project')).rejects.toThrow('structure is invalid');
    });
  });

  describe('Atomic Writes', () => {
    it('should use atomic write pattern (no partial writes)', async () => {
      await manager.load('test-project');
      
      // Add data
      manager.addSpec('SPEC-001');
      manager.addDecision('SPEC-001', 'Test', 'Test');
      
      await manager.save();
      
      // Verify file is valid JSON
      const { readFile } = await import('fs/promises');
      const content = await readFile(manager.getMemoryFilePath(), 'utf-8');
      
      // Should be parseable JSON
      expect(() => JSON.parse(content)).not.toThrow();
      
      const parsed = JSON.parse(content);
      expect(parsed.specs).toContain('SPEC-001');
    });
  });
});
