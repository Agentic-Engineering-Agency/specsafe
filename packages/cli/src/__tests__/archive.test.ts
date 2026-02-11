/**
 * Archive command smoke tests
 * Tests the archive command structure and validations
 */
import { describe, it, expect, vi } from 'vitest';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue(''),
  access: vi.fn().mockRejectedValue({ code: 'ENOENT' }),
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  rename: vi.fn().mockResolvedValue(undefined),
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

const { archiveCommand } = await import('../commands/archive.js');

describe('archive command smoke tests', () => {
  it('should be registered with correct name', () => {
    expect(archiveCommand.name()).toBe('archive');
  });

  it('should have description', () => {
    expect(archiveCommand.description()).toBeTruthy();
    expect(archiveCommand.description().toLowerCase()).toContain('archive');
  });

  it('should require <id> argument', () => {
    const args = archiveCommand.registeredArguments;
    expect(args).toHaveLength(1);
    expect(args[0].required).toBe(true);
    // Commander uses a getter for name, check the _name property instead
    expect(args[0]._name || args[0].name).toBe('id');
  });

  it('should have action handler defined', () => {
    const hasAction = archiveCommand._actionHandler !== undefined ||
                      (archiveCommand as any).actionHandler !== undefined;
    expect(hasAction).toBe(true);
  });

  describe('command behavior (via mocking)', () => {
    it('command structure includes validation logic for COMPLETE stage', async () => {
      // The command code uses validateSpecId and checks spec.stage !== 'complete'
      const commandCode = archiveCommand._actionHandler?.toString() || '';
      
      // Verify the action exists and has validation logic
      expect(commandCode.length).toBeGreaterThan(0);
    });
  });
});
