import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProjectStateManager } from '../../src/core/ProjectState.js';
import { getTimestamp } from '../../src/utils/logger.js';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

describe('ProjectStateManager', () => {
  let tempDir: string;
  let manager: ProjectStateManager;

  beforeEach(async () => {
    // Create temp directory for testing
    const os = await import('os');
    tempDir = path.join(os.tmpdir(), `specsafe-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    // Initialize SpecSafe in temp dir
    const specsafeDir = path.join(tempDir, '.specsafe');
    await fs.mkdir(specsafeDir, { recursive: true });

    // Create config file
    const config = {
      specsafe: { version: '1.0.0', projectName: 'Test Project' },
    };
    await fs.writeFile(
      path.join(specsafeDir, 'config.yaml'),
      yaml.dump(config, { indent: 2 }),
      'utf-8'
    );

    manager = new ProjectStateManager(tempDir);
  });

  afterEach(async () => {
    // Clean up temp directory
    try {
      const fs = await import('fs');
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('initialization', () => {
    it('should create a new state object', () => {
      const state = manager.getState();
      expect(state.currentPhase).toBe('SPEC');
      expect(state.activeSpec).toBeNull();
      expect(state.specs).toEqual([]);
    });

    it('should create PROJECT_STATE.md when saved', async () => {
      await manager.save();

      const statePath = path.join(tempDir, 'PROJECT_STATE.md');
      const content = await fs.readFile(statePath, 'utf-8');
      expect(content).toContain('# Project State');
      expect(content).toContain('Test Project');
    });
  });

  describe('addSpec', () => {
    it('should add a new spec to tracking', async () => {
      await manager.addSpec('test-spec', 'SPEC');

      const state = await manager.load();
      expect(state.specs).toHaveLength(1);
      expect(state.specs[0].name).toBe('test-spec');
      expect(state.specs[0].phase).toBe('SPEC');
      expect(state.specs[0].location).toBe('active');
    });

    it('should set active spec when adding', async () => {
      await manager.addSpec('active-spec', 'TEST');

      const state = await manager.load();
      expect(state.activeSpec).toBe('active-spec');
      expect(state.currentPhase).toBe('TEST');
    });

    it('should add multiple specs', async () => {
      await manager.addSpec('spec-1', 'SPEC');
      await manager.addSpec('spec-2', 'TEST');

      const state = await manager.load();
      expect(state.specs).toHaveLength(2);
    });
  });

  describe('updateSpec', () => {
    it('should update spec phase', async () => {
      await manager.addSpec('test-spec', 'SPEC');
      await manager.updateSpec('test-spec', { phase: 'CODE' });

      const state = await manager.load();
      const spec = state.specs.find((s) => s.name === 'test-spec');
      expect(spec?.phase).toBe('CODE');
    });

    it('should update spec metrics', async () => {
      await manager.addSpec('test-spec', 'TEST');
      await manager.updateSpec('test-spec', {
        tests: 10,
        passing: 8,
        coverage: 75,
      });

      const state = await manager.load();
      const spec = state.specs.find((s) => s.name === 'test-spec');
      expect(spec?.tests).toBe(10);
      expect(spec?.passing).toBe(8);
      expect(spec?.coverage).toBe(75);
    });

    it('should throw error for non-existent spec', async () => {
      await expect(manager.updateSpec('nonexistent', {})).rejects.toThrow(
        'Spec not found'
      );
    });

    it('should update updatedAt timestamp', async () => {
      await manager.addSpec('test-spec', 'SPEC');
      await manager.updateSpec('test-spec', { phase: 'TEST' });

      const state = await manager.load();
      const spec = state.specs.find((s) => s.name === 'test-spec');
      expect(spec?.updatedAt).toBeDefined();
    });
  });

  describe('moveSpec', () => {
    it('should move spec to completed', async () => {
      await manager.addSpec('test-spec', 'QA');
      await manager.moveSpec('test-spec', 'completed');

      const state = await manager.load();
      const spec = state.specs.find((s) => s.name === 'test-spec');
      expect(spec?.location).toBe('completed');
      expect(spec?.phase).toBe('COMPLETE');
    });

    it('should move spec to archive', async () => {
      await manager.addSpec('test-spec', 'COMPLETE');
      await manager.moveSpec('test-spec', 'archive');

      const state = await manager.load();
      const spec = state.specs.find((s) => s.name === 'test-spec');
      expect(spec?.location).toBe('archive');
    });
    });

    it('should throw error for non-existent spec', async () => {
      await expect(manager.moveSpec('nonexistent', 'active')).rejects.toThrow(
        'Spec not found'
      );
    });
  });

  describe('PROJECT_STATE.md generation', () => {
    it('should generate valid markdown', async () => {
      await manager.addSpec('test-spec', 'TEST');
      await manager.save();

      const content = await fs.readFile(
        path.join(tempDir, 'PROJECT_STATE.md'),
        'utf-8'
      );

      expect(content).toContain('| Spec | Location | Phase | Tests |');
      expect(content).toContain('| test-spec | active | TEST |');
    });

    it('should show pass rate percentage', async () => {
      await manager.addSpec('test-spec', 'CODE');
      await manager.updateSpec('test-spec', { tests: 10, passing: 5 });
      await manager.save();

      const content = await fs.readFile(
        path.join(tempDir, 'PROJECT_STATE.md'),
        'utf-8'
      );

      expect(content).toContain('50%');
    });

    it('should show dash for no tests', async () => {
      await manager.addSpec('test-spec', 'SPEC');
      await manager.save();

      const content = await fs.readFile(
        path.join(tempDir, 'PROJECT_STATE.md'),
        'utf-8'
      );

      expect(content).toContain('-');
    });
  });

  describe('change log', () => {
    it('should create change log entry', async () => {
      await manager.addChangeLog({
        date: '2026-01-26',
        time: '10:00:00',
        action: 'TEST_CREATE',
        spec: 'test-spec',
        files: 'test.ts',
        agent: 'test-generator',
        notes: 'Generated tests',
      });

      const logPath = path.join(tempDir, 'tracking', 'changes.log');
      const content = await fs.readFile(logPath, 'utf-8');

      expect(content).toContain('2026-01-26');
      expect(content).toContain('TEST_CREATE');
      expect(content).toContain('test-spec');
    });

    it('should append multiple entries', async () => {
      await manager.addChangeLog({
        date: '2026-01-26',
        time: '10:00:00',
        action: 'SPEC_CREATE',
        spec: 'test-spec',
        files: 'spec.md',
        agent: 'human',
        notes: 'Created spec',
      });

      await manager.addChangeLog({
        date: '2026-01-26',
        time: '10:05:00',
        action: 'TEST_CREATE',
        spec: 'test-spec',
        files: 'test.ts',
        agent: 'test-generator',
        notes: 'Generated tests',
      });

      const logPath = path.join(tempDir, 'tracking', 'changes.log');
      const content = await fs.readFile(logPath, 'utf-8');

      expect(content).toContain('SPEC_CREATE');
      expect(content).toContain('TEST_CREATE');
    });
  });

  describe('config', () => {
    it('should load config from file', async () => {
      const config = await manager.loadConfig();

      expect(config).toBeDefined();
      expect(config.specsafe.version).toBe('1.0.0');
      expect(config.specsafe.projectName).toBe('Test Project');
    });

    it('should return null if config does not exist', async () => {
      // Remove config file
      await fs.unlink(path.join(tempDir, '.specsafe', 'config.yaml'));

      const manager2 = new ProjectStateManager(tempDir);
      const config = await manager2.loadConfig();

      expect(config).toBeNull();
    });
  });
});
