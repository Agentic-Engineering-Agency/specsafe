import { describe, it, expect } from 'vitest';
import { getAdapter, getAllAdapters } from '../src/registry.js';

const TOOL_NAMES = ['claude-code', 'opencode', 'cursor', 'continue', 'aider', 'zed', 'gemini', 'antigravity'] as const;

describe('getAdapter', () => {
  it.each(TOOL_NAMES)('returns adapter for "%s"', (name) => {
    const adapter = getAdapter(name);
    expect(adapter).toBeDefined();
    expect(adapter!.name).toBe(name);
  });

  it('returns undefined for unknown tool names', () => {
    expect(getAdapter('unknown-tool')).toBeUndefined();
  });

  it('each adapter has correct name and displayName properties', () => {
    for (const name of TOOL_NAMES) {
      const adapter = getAdapter(name)!;
      expect(adapter.name).toBe(name);
      expect(typeof adapter.displayName).toBe('string');
      expect(adapter.displayName.length).toBeGreaterThan(0);
    }
  });
});

describe('getAllAdapters', () => {
  it('returns 8 adapters', () => {
    const adapters = getAllAdapters();
    expect(adapters).toHaveLength(8);
  });

  it('all have unique names', () => {
    const adapters = getAllAdapters();
    const names = adapters.map((a) => a.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
