/**
 * Config loading tests
 * Tests the loadConfig function with various scenarios
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadConfig, type SpecSafeConfig } from '../config.js';

// Mock fs/promises
const mockAccess = vi.fn();
const mockReadFile = vi.fn();

vi.mock('fs/promises', () => ({
  access: (...args: unknown[]) => mockAccess(...args),
  readFile: (...args: unknown[]) => mockReadFile(...args),
}));

describe('loadConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('default config', () => {
    it('should return default config when no file exists', async () => {
      mockAccess.mockRejectedValue({ code: 'ENOENT' });

      const config = await loadConfig('/test/cwd');

      expect(config).toEqual({
        projectName: 'Untitled Project',
        version: '1.0.0',
        stages: ['spec', 'test', 'code', 'qa', 'complete', 'archived'],
        testFramework: 'vitest',
        language: 'typescript',
      });
    });

    it('should use provided cwd for config path', async () => {
      mockAccess.mockRejectedValue({ code: 'ENOENT' });

      await loadConfig('/custom/path');

      expect(mockAccess).toHaveBeenCalledWith('/custom/path/specsafe.config.json');
    });
  });

  describe('custom config loading', () => {
    it('should load custom config from specsafe.config.json', async () => {
      const customConfig: Partial<SpecSafeConfig> = {
        projectName: 'My Custom Project',
        version: '2.0.0',
        testFramework: 'jest',
      };

      mockAccess.mockResolvedValue(undefined);
      mockReadFile.mockResolvedValue(JSON.stringify(customConfig));

      const config = await loadConfig('/test/cwd');

      expect(config.projectName).toBe('My Custom Project');
      expect(config.version).toBe('2.0.0');
      expect(config.testFramework).toBe('jest');
    });

    it('should parse JSON config correctly', async () => {
      const jsonContent = JSON.stringify({
        projectName: 'Test Project',
        stages: ['spec', 'test', 'code'],
      });

      mockAccess.mockResolvedValue(undefined);
      mockReadFile.mockResolvedValue(jsonContent);

      const config = await loadConfig('/test/cwd');

      expect(mockReadFile).toHaveBeenCalledWith('/test/cwd/specsafe.config.json', 'utf-8');
    });
  });

  describe('partial config merging', () => {
    it('should merge partial config with defaults', async () => {
      const partialConfig = {
        projectName: 'Partial Project',
      };

      mockAccess.mockResolvedValue(undefined);
      mockReadFile.mockResolvedValue(JSON.stringify(partialConfig));

      const config = await loadConfig('/test/cwd');

      // Custom value
      expect(config.projectName).toBe('Partial Project');
      // Defaults preserved
      expect(config.version).toBe('1.0.0');
      expect(config.stages).toEqual(['spec', 'test', 'code', 'qa', 'complete', 'archived']);
      expect(config.testFramework).toBe('vitest');
      expect(config.language).toBe('typescript');
    });

    it('should merge multiple partial properties', async () => {
      const partialConfig = {
        projectName: 'Multi Partial',
        language: 'typescript',
        stages: ['custom-stage'],
      };

      mockAccess.mockResolvedValue(undefined);
      mockReadFile.mockResolvedValue(JSON.stringify(partialConfig));

      const config = await loadConfig('/test/cwd');

      expect(config.projectName).toBe('Multi Partial');
      expect(config.stages).toEqual(['custom-stage']);
      // Unset properties use defaults
      expect(config.testFramework).toBe('vitest');
      expect(config.version).toBe('1.0.0');
    });

    it('should not mutate default config', async () => {
      const partialConfig = {
        stages: ['only-one'],
      };

      mockAccess.mockResolvedValue(undefined);
      mockReadFile.mockResolvedValue(JSON.stringify(partialConfig));

      await loadConfig('/test/cwd');

      // Load again to verify defaults are still intact
      mockAccess.mockRejectedValue({ code: 'ENOENT' });
      const freshConfig = await loadConfig('/other/cwd');
      expect(freshConfig.stages).toEqual(['spec', 'test', 'code', 'qa', 'complete', 'archived']);
    });
  });

  describe('error handling', () => {
    it('should throw for invalid JSON', async () => {
      mockAccess.mockResolvedValue(undefined);
      mockReadFile.mockResolvedValue('not valid json');

      await expect(loadConfig('/test/cwd')).rejects.toThrow('Invalid JSON');
    });

    it('should throw for other file system errors', async () => {
      mockAccess.mockRejectedValue(new Error('Permission denied'));

      await expect(loadConfig('/test/cwd')).rejects.toThrow('Permission denied');
    });
  });

  describe('edge cases', () => {
    it('should handle empty config file', async () => {
      mockAccess.mockResolvedValue(undefined);
      mockReadFile.mockResolvedValue('{}');

      const config = await loadConfig('/test/cwd');

      expect(config).toEqual({
        projectName: 'Untitled Project',
        version: '1.0.0',
        stages: ['spec', 'test', 'code', 'qa', 'complete', 'archived'],
        testFramework: 'vitest',
        language: 'typescript',
      });
    });

    it('should handle null values in config file', async () => {
      mockAccess.mockResolvedValue(undefined);
      mockReadFile.mockResolvedValue(JSON.stringify({ projectName: null }));

      const config = await loadConfig('/test/cwd');

      // null should be treated as not set, so default is used
      expect(config.projectName).toBe('Untitled Project');
    });
  });
});
