/**
 * List command smoke tests
 * Tests the list command structure and options
 */
import { describe, it, expect, vi } from 'vitest';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue(''),
  access: vi.fn().mockRejectedValue({ code: 'ENOENT' }),
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  readdir: vi.fn().mockResolvedValue([]),
}));

// Mock ora
vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    warn: vi.fn().mockReturnThis(),
  })),
}));

const { listCommand } = await import('../commands/list.js');

describe('list command smoke tests', () => {
  it('should be registered with correct name', () => {
    expect(listCommand.name()).toBe('list');
  });

  it('should have description', () => {
    expect(listCommand.description()).toBeTruthy();
    expect(listCommand.description().toLowerCase()).toContain('list');
  });

  describe('options', () => {
    it('should have --stage option', () => {
      const opts = listCommand.options;
      const stageOpt = opts.find((o) => o.long === '--stage');
      expect(stageOpt).toBeDefined();
      expect(stageOpt?.description).toContain('stage');
    });

    it('should have --json option', () => {
      const opts = listCommand.options;
      const jsonOpt = opts.find((o) => o.long === '--json');
      expect(jsonOpt).toBeDefined();
    });

    it('--stage option should accept stage parameter', () => {
      const opts = listCommand.options;
      const stageOpt = opts.find((o) => o.long === '--stage');
      expect(stageOpt?.required).toBe(true);
    });
  });

  it('should not require arguments', () => {
    expect(listCommand.registeredArguments).toHaveLength(0);
  });

  it('should have action handler defined', () => {
    // Commander stores action in _actionHandler or actionHandler
    const hasAction = listCommand._actionHandler !== undefined ||
                      (listCommand as any).actionHandler !== undefined;
    expect(hasAction).toBe(true);
  });
});
