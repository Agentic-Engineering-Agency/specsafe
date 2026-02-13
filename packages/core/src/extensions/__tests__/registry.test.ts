import { describe, it, expect, beforeEach } from 'vitest';
import { ExtensionRegistry } from '../registry.js';
import type { Extension, ExtensionContext } from '../types.js';
import type { Spec } from '../../types.js';

// Helper to create a test spec
function createTestSpec(): Spec {
  return {
    id: 'test-001',
    name: 'Test Spec',
    description: 'Test description',
    stage: 'spec',
    requirements: [],
    testFiles: [],
    implementationFiles: [],
    metadata: {
      author: 'test',
      project: 'test',
      tags: [],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('ExtensionRegistry', () => {
  beforeEach(() => {
    ExtensionRegistry.clear();
  });

  it('should register an extension', () => {
    const ext: Extension = {
      id: 'test-ext',
      name: 'Test Extension',
      description: 'A test extension',
      version: '1.0.0',
      hooks: {},
    };

    ExtensionRegistry.register(ext);

    expect(ExtensionRegistry.has('test-ext')).toBe(true);
    expect(ExtensionRegistry.get('test-ext')).toEqual(ext);
  });

  it('should throw error when registering duplicate extension', () => {
    const ext: Extension = {
      id: 'test-ext',
      name: 'Test Extension',
      description: 'A test extension',
      version: '1.0.0',
      hooks: {},
    };

    ExtensionRegistry.register(ext);

    expect(() => ExtensionRegistry.register(ext)).toThrow(
      'Extension with ID "test-ext" is already registered'
    );
  });

  it('should unregister an extension', () => {
    const ext: Extension = {
      id: 'test-ext',
      name: 'Test Extension',
      description: 'A test extension',
      version: '1.0.0',
      hooks: {},
    };

    ExtensionRegistry.register(ext);
    expect(ExtensionRegistry.has('test-ext')).toBe(true);

    const result = ExtensionRegistry.unregister('test-ext');
    expect(result).toBe(true);
    expect(ExtensionRegistry.has('test-ext')).toBe(false);
  });

  it('should return false when unregistering non-existent extension', () => {
    const result = ExtensionRegistry.unregister('non-existent');
    expect(result).toBe(false);
  });

  it('should list all extensions', () => {
    const ext1: Extension = {
      id: 'ext-1',
      name: 'Extension 1',
      description: 'First extension',
      version: '1.0.0',
      hooks: {},
    };

    const ext2: Extension = {
      id: 'ext-2',
      name: 'Extension 2',
      description: 'Second extension',
      version: '1.0.0',
      hooks: {},
    };

    ExtensionRegistry.register(ext1);
    ExtensionRegistry.register(ext2);

    const list = ExtensionRegistry.list();
    expect(list).toHaveLength(2);
    expect(list).toContainEqual(ext1);
    expect(list).toContainEqual(ext2);
  });

  it('should enable and disable extensions', () => {
    const ext: Extension = {
      id: 'test-ext',
      name: 'Test Extension',
      description: 'A test extension',
      version: '1.0.0',
      hooks: {},
      enabled: true,
    };

    ExtensionRegistry.register(ext);

    expect(ExtensionRegistry.listEnabled()).toHaveLength(1);

    ExtensionRegistry.disable('test-ext');
    expect(ExtensionRegistry.get('test-ext')?.enabled).toBe(false);
    expect(ExtensionRegistry.listEnabled()).toHaveLength(0);

    ExtensionRegistry.enable('test-ext');
    expect(ExtensionRegistry.get('test-ext')?.enabled).toBe(true);
    expect(ExtensionRegistry.listEnabled()).toHaveLength(1);
  });

  it('should execute hooks in order', async () => {
    const results: string[] = [];

    const ext: Extension = {
      id: 'test-ext',
      name: 'Test Extension',
      description: 'A test extension',
      version: '1.0.0',
      hooks: {
        'pre-validate': () => {
          results.push('pre-validate');
          return { success: true };
        },
      },
    };

    ExtensionRegistry.register(ext);

    const context: ExtensionContext = {
      spec: createTestSpec(),
      phase: 'pre-validate',
    };

    await ExtensionRegistry.executeHooks('pre-validate', context);

    expect(results).toEqual(['pre-validate']);
  });

  it('should skip disabled extensions during hook execution', async () => {
    const results: string[] = [];

    const ext: Extension = {
      id: 'test-ext',
      name: 'Test Extension',
      description: 'A test extension',
      version: '1.0.0',
      enabled: false,
      hooks: {
        'pre-validate': () => {
          results.push('should-not-run');
          return { success: true };
        },
      },
    };

    ExtensionRegistry.register(ext);

    const context: ExtensionContext = {
      spec: createTestSpec(),
      phase: 'pre-validate',
    };

    const hookResults = await ExtensionRegistry.executeHooks('pre-validate', context);

    expect(results).toEqual([]);
    expect(hookResults).toHaveLength(0);
  });

  it('should handle hook errors gracefully', async () => {
    const ext: Extension = {
      id: 'test-ext',
      name: 'Test Extension',
      description: 'A test extension',
      version: '1.0.0',
      hooks: {
        'pre-validate': () => {
          throw new Error('Hook failed');
        },
      },
    };

    ExtensionRegistry.register(ext);

    const context: ExtensionContext = {
      spec: createTestSpec(),
      phase: 'pre-validate',
    };

    const results = await ExtensionRegistry.executeHooks('pre-validate', context);

    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(false);
    expect(results[0].errors).toContain('Hook failed');
  });
});
