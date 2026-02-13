import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CapsuleManager } from '../capsules.js';
import { CapsuleType, Capsule } from '../types.js';
import { writeFile, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('CapsuleManager', () => {
  let manager: CapsuleManager;
  let testDir: string;

  beforeEach(async () => {
    // Create a temporary directory for testing
    testDir = join(tmpdir(), `specsafe-test-${Date.now()}`);
    const { mkdir } = await import('fs/promises');
    await mkdir(testDir, { recursive: true });

    // Create .specsafe directory
    await mkdir(join(testDir, '.specsafe'), { recursive: true });
    await mkdir(join(testDir, '.specsafe', 'capsules'), { recursive: true });

    manager = new CapsuleManager({ basePath: testDir });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      if (existsSync(testDir)) {
        await rm(testDir, { recursive: true, force: true });
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('load', () => {
    it('should return empty array for non-existent spec', async () => {
      const capsules = await manager.load('nonexistent-spec');
      expect(capsules).toEqual([]);
    });

    it('should load capsules from file', async () => {
      const specId = 'test-spec';
      const testCapsule: Capsule = {
        id: 'CAPSULE-001',
        specId: 'test-spec',
        type: 'user-story',
        title: 'Test Capsule',
        content: 'Test content',
        author: 'test-author',
        createdAt: '2024-01-01T00:00:00.000Z',
        tags: [],
      };

      // Save capsules directly to file
      await writeFile(
        join(testDir, '.specsafe', 'capsules', 'test-spec.json'),
        JSON.stringify([testCapsule])
      );

      const capsules = await manager.load(specId);
      expect(capsules).toHaveLength(1);
      expect(capsules[0].id).toBe('CAPSULE-001');
    });
  });

  describe('add', () => {
    it('should add a new capsule with generated ID', async () => {
      const capsule = await manager.add('test-spec', {
        type: 'user-story',
        title: 'New Capsule',
        content: 'Content here',
        author: 'author',
        tags: [],
      });

      expect(capsule.id).toMatch(/^CAPSULE-[a-z0-9-]+$/);
      expect(capsule.specId).toBe('test-spec');
      expect(capsule.type).toBe('user-story');
      expect(capsule.title).toBe('New Capsule');
      expect(capsule.createdAt).toBeDefined();
    });

    it('should persist capsule to file', async () => {
      const capsule = await manager.add('test-spec', {
        type: 'user-story',
        title: 'New Capsule',
        content: 'Content here',
        author: 'author',
        tags: [],
      });

      const capsules = await manager.load('test-spec');
      expect(capsules).toHaveLength(1);
      expect(capsules[0].id).toBe(capsule.id);
    });

    it('should handle spec with file extension', async () => {
      const capsule = await manager.add('specs/test.md', {
        type: 'user-story',
        title: 'New Capsule',
        content: 'Content here',
        author: 'author',
        tags: [],
      });

      expect(capsule.specId).toBe('test');
      const capsules = await manager.load('specs/test.md');
      expect(capsules).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update an existing capsule', async () => {
      const capsule = await manager.add('test-spec', {
        type: 'user-story',
        title: 'Original Title',
        content: 'Original content',
        author: 'author',
        tags: [],
      });

      const updated = await manager.update('test-spec', capsule.id, {
        title: 'Updated Title',
        content: 'Updated content',
      });

      expect(updated).toBeDefined();
      expect(updated?.title).toBe('Updated Title');
      expect(updated?.content).toBe('Updated content');
      expect(updated?.id).toBe(capsule.id);
    });

    it('should return null for non-existent capsule', async () => {
      const updated = await manager.update('test-spec', 'NONEXISTENT', {
        title: 'Updated',
      });
      expect(updated).toBeNull();
    });

    it('should preserve other fields on update', async () => {
      const capsule = await manager.add('test-spec', {
        type: 'user-story',
        title: 'Original Title',
        content: 'Original content',
        author: 'author',
        tags: ['tag1', 'tag2'],
      });

      const updated = await manager.update('test-spec', capsule.id, {
        title: 'Updated Title',
      });

      expect(updated?.content).toBe('Original content');
      expect(updated?.author).toBe('author');
      expect(updated?.tags).toEqual(['tag1', 'tag2']);
    });
  });

  describe('remove', () => {
    it('should remove a capsule', async () => {
      const capsule = await manager.add('test-spec', {
        type: 'user-story',
        title: 'To be removed',
        content: 'Content',
        author: 'author',
        tags: [],
      });

      const removed = await manager.remove('test-spec', capsule.id);
      expect(removed).toBe(true);

      const capsules = await manager.load('test-spec');
      expect(capsules).toHaveLength(0);
    });

    it('should return false for non-existent capsule', async () => {
      const removed = await manager.remove('test-spec', 'NONEXISTENT');
      expect(removed).toBe(false);
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      // Add test capsules
      await manager.add('test-spec', {
        type: 'user-story',
        title: 'User Story 1',
        content: 'Content',
        author: 'alice',
        tags: ['important'],
      });

      await manager.add('test-spec', {
        type: 'technical-context',
        title: 'Technical Note',
        content: 'Content',
        author: 'bob',
        tags: ['backend'],
      });

      await manager.add('test-spec', {
        type: 'user-story',
        title: 'User Story 2',
        content: 'Content',
        author: 'charlie',
        tags: ['important', 'frontend'],
      });
    });

    it('should list all capsules without filter', async () => {
      const capsules = await manager.list('test-spec');
      expect(capsules).toHaveLength(3);
    });

    it('should filter by type', async () => {
      const capsules = await manager.list('test-spec', {
        types: ['user-story'],
      });
      expect(capsules).toHaveLength(2);
      expect(capsules.every((c) => c.type === 'user-story')).toBe(true);
    });

    it('should filter by multiple types', async () => {
      const capsules = await manager.list('test-spec', {
        types: ['user-story', 'technical-context'],
      });
      expect(capsules).toHaveLength(3);
    });

    it('should filter by tag', async () => {
      const capsules = await manager.list('test-spec', {
        tags: ['important'],
      });
      expect(capsules).toHaveLength(2);
    });

    it('should filter by author', async () => {
      const capsules = await manager.list('test-spec', {
        author: 'alice',
      });
      expect(capsules).toHaveLength(1);
      expect(capsules[0].author).toBe('alice');
    });

    it('should filter by multiple criteria', async () => {
      const capsules = await manager.list('test-spec', {
        types: ['user-story'],
        tags: ['important'],
      });
      expect(capsules).toHaveLength(2);
    });

    it('should handle empty filter results', async () => {
      const capsules = await manager.list('test-spec', {
        types: ['discovery-note'],
      });
      expect(capsules).toHaveLength(0);
    });
  });

  describe('get', () => {
    it('should get capsule by ID', async () => {
      const capsule = await manager.add('test-spec', {
        type: 'user-story',
        title: 'Test',
        content: 'Content',
        author: 'author',
        tags: [],
      });

      const found = await manager.get('test-spec', capsule.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(capsule.id);
    });

    it('should return null for non-existent capsule', async () => {
      const found = await manager.get('test-spec', 'NONEXISTENT');
      expect(found).toBeNull();
    });
  });

  describe('getRelated', () => {
    it('should return empty array when no other specs exist', async () => {
      await manager.add('test-spec', {
        type: 'user-story',
        title: 'Test',
        content: 'Content',
        author: 'author',
        tags: [],
      });

      const related = await manager.getRelated('test-spec');
      expect(related).toEqual([]);
    });

    it('should find capsules from other specs', async () => {
      // Add capsules to different specs
      await manager.add('spec-a', {
        type: 'user-story',
        title: 'Spec A capsule',
        content: 'Content',
        author: 'author',
        tags: [],
      });

      await manager.add('spec-b', {
        type: 'technical-context',
        title: 'Spec B capsule',
        content: 'Content',
        author: 'author',
        tags: [],
      });

      const related = await manager.getRelated('spec-a');
      expect(related).toHaveLength(1);
      expect(related[0].specId).toBe('spec-b');
    });
  });

  describe('countByType', () => {
    it('should count capsules by type', async () => {
      await manager.add('test-spec', {
        type: 'user-story',
        title: 'User Story 1',
        content: 'Content',
        author: 'author',
        tags: [],
      });

      await manager.add('test-spec', {
        type: 'user-story',
        title: 'User Story 2',
        content: 'Content',
        author: 'author',
        tags: [],
      });

      await manager.add('test-spec', {
        type: 'technical-context',
        title: 'Technical',
        content: 'Content',
        author: 'author',
        tags: [],
      });

      const counts = await manager.countByType('test-spec');
      expect(counts['user-story']).toBe(2);
      expect(counts['technical-context']).toBe(1);
      expect(counts['business-justification']).toBe(0);
      expect(counts['discovery-note']).toBe(0);
    });

    it('should return zeros for empty spec', async () => {
      const counts = await manager.countByType('empty-spec');
      expect(counts['user-story']).toBe(0);
      expect(counts['technical-context']).toBe(0);
      expect(counts['business-justification']).toBe(0);
      expect(counts['discovery-note']).toBe(0);
    });
  });

  describe('exportToMarkdown', () => {
    it('should export capsules to markdown', async () => {
      await manager.add('test-spec', {
        type: 'user-story',
        title: 'User Story',
        content: '**As a:**\ncustomer\n\n**I want:\nsave\n\n**so that:\nfast',
        author: 'alice',
        tags: ['important'],
      });

      const markdown = await manager.exportToMarkdown('test-spec');
      expect(markdown).toContain('# Context Capsules: test-spec');
      expect(markdown).toContain('## User Story');
      expect(markdown).toContain('### User Story');
      expect(markdown).toContain('**ID:**');
      expect(markdown).toContain('**Author:** alice');
      expect(markdown).toContain('customer');
    });

    it('should handle empty capsule list', async () => {
      const markdown = await manager.exportToMarkdown('empty-spec');
      expect(markdown).toContain('# Context Capsules: empty-spec');
      expect(markdown).toContain('**Total Capsules:** 0');
    });
  });
});
