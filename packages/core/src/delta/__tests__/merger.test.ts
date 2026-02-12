import { describe, it, expect } from 'vitest';
import { SemanticMerger } from '../merger.js';
import type { DeltaSpec } from '../types.js';

describe('SemanticMerger', () => {
  const merger = new SemanticMerger();

  const baseSpec = `
# Feature Spec

## Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-1 | Users must be able to login | P0 | |
| FR-2 | Users must be able to logout | P1 | |
| FR-3 | Sessions must expire after 30 minutes | P2 | |

## Scenarios
...
  `;

  describe('merge - ADDED', () => {
    it('should add new requirements', () => {
      const deltaSpec: DeltaSpec = {
        id: 'DELTA-001',
        baseSpecId: 'SPEC-001',
        description: 'Add password reset',
        createdAt: new Date(),
        author: 'dev',
        added: [
          { id: 'FR-4', text: 'Users must be able to reset password', priority: 'P0' }
        ],
        modified: [],
        removed: []
      };

      const result = merger.merge(baseSpec, deltaSpec);

      expect(result.success).toBe(true);
      expect(result.stats.added).toBe(1);
      expect(result.content).toContain('FR-4');
      expect(result.content).toContain('reset password');
    });

    it('should detect duplicate adds', () => {
      const deltaSpec: DeltaSpec = {
        id: 'DELTA-001',
        baseSpecId: 'SPEC-001',
        description: 'Test',
        createdAt: new Date(),
        author: 'dev',
        added: [
          { id: 'FR-1', text: 'Duplicate requirement', priority: 'P0' }
        ],
        modified: [],
        removed: []
      };

      const result = merger.merge(baseSpec, deltaSpec);

      expect(result.success).toBe(false);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe('duplicate_add');
      expect(result.stats.added).toBe(0);
    });
  });

  describe('merge - MODIFIED', () => {
    it('should modify existing requirements', () => {
      const deltaSpec: DeltaSpec = {
        id: 'DELTA-001',
        baseSpecId: 'SPEC-001',
        description: 'Update login requirement',
        createdAt: new Date(),
        author: 'dev',
        added: [],
        modified: [
          {
            id: 'FR-1',
            text: 'Users must be able to login with 2FA',
            priority: 'P0',
            oldText: 'Users must be able to login'
          }
        ],
        removed: []
      };

      const result = merger.merge(baseSpec, deltaSpec);

      expect(result.success).toBe(true);
      expect(result.stats.modified).toBe(1);
      expect(result.content).toContain('login with 2FA');
      expect(result.content).not.toContain('Users must be able to login |');
    });

    it('should detect requirement not found for modification', () => {
      const deltaSpec: DeltaSpec = {
        id: 'DELTA-001',
        baseSpecId: 'SPEC-001',
        description: 'Test',
        createdAt: new Date(),
        author: 'dev',
        added: [],
        modified: [
          { id: 'FR-999', text: 'Non-existent requirement', priority: 'P0' }
        ],
        removed: []
      };

      const result = merger.merge(baseSpec, deltaSpec);

      expect(result.success).toBe(false);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe('requirement_not_found');
      expect(result.stats.modified).toBe(0);
    });
  });

  describe('merge - REMOVED', () => {
    it('should remove requirements', () => {
      const deltaSpec: DeltaSpec = {
        id: 'DELTA-001',
        baseSpecId: 'SPEC-001',
        description: 'Remove session expiry',
        createdAt: new Date(),
        author: 'dev',
        added: [],
        modified: [],
        removed: ['FR-3']
      };

      const result = merger.merge(baseSpec, deltaSpec);

      expect(result.success).toBe(true);
      expect(result.stats.removed).toBe(1);
      expect(result.content).not.toContain('FR-3');
      expect(result.content).not.toContain('Sessions must expire');
    });

    it('should detect requirement not found for removal', () => {
      const deltaSpec: DeltaSpec = {
        id: 'DELTA-001',
        baseSpecId: 'SPEC-001',
        description: 'Test',
        createdAt: new Date(),
        author: 'dev',
        added: [],
        modified: [],
        removed: ['FR-999']
      };

      const result = merger.merge(baseSpec, deltaSpec);

      expect(result.success).toBe(false);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe('requirement_not_found');
      expect(result.stats.removed).toBe(0);
    });
  });

  describe('merge - Combined Operations', () => {
    it('should apply multiple changes together', () => {
      const deltaSpec: DeltaSpec = {
        id: 'DELTA-001',
        baseSpecId: 'SPEC-001',
        description: 'Comprehensive update',
        createdAt: new Date(),
        author: 'dev',
        added: [
          { id: 'FR-4', text: 'New requirement', priority: 'P1' }
        ],
        modified: [
          { id: 'FR-1', text: 'Updated login requirement', priority: 'P0' }
        ],
        removed: ['FR-3']
      };

      const result = merger.merge(baseSpec, deltaSpec);

      expect(result.success).toBe(true);
      expect(result.stats.added).toBe(1);
      expect(result.stats.modified).toBe(1);
      expect(result.stats.removed).toBe(1);
      expect(result.content).toContain('FR-4');
      expect(result.content).toContain('Updated login');
      expect(result.content).not.toContain('FR-3');
    });
  });

  describe('diff', () => {
    it('should generate a readable diff preview', () => {
      const deltaSpec: DeltaSpec = {
        id: 'DELTA-001',
        baseSpecId: 'SPEC-001',
        description: 'Test changes',
        createdAt: new Date(),
        author: 'dev',
        added: [
          { id: 'FR-4', text: 'New requirement', priority: 'P1' }
        ],
        modified: [
          {
            id: 'FR-1',
            text: 'Updated requirement',
            priority: 'P0',
            oldText: 'Old requirement'
          }
        ],
        removed: ['FR-3']
      };

      const diff = merger.diff(baseSpec, deltaSpec);

      expect(diff).toContain('DELTA-001');
      expect(diff).toContain('Added Requirements (1)');
      expect(diff).toContain('FR-4');
      expect(diff).toContain('Modified Requirements (1)');
      expect(diff).toContain('FR-1');
      expect(diff).toContain('(was: Old requirement)');
      expect(diff).toContain('Removed Requirements (1)');
      expect(diff).toContain('FR-3');
    });
  });
});
