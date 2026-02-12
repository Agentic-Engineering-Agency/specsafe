/**
 * Command registration smoke tests
 * Validates all CLI commands are properly registered with correct structure
 */
import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';

// Mock fs/promises to prevent actual file system operations
vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue(''),
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
  access: vi.fn().mockRejectedValue({ code: 'ENOENT' }),
  readdir: vi.fn().mockResolvedValue([]),
  rename: vi.fn().mockResolvedValue(undefined),
}));

// Mock child_process for qa command
vi.mock('child_process', () => ({
  exec: vi.fn((cmd, callback) => {
    callback(null, { stdout: '', stderr: '' });
  }),
}));

// Mock ora to prevent spinner output in tests
vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    warn: vi.fn().mockReturnThis(),
    text: '',
  })),
}));

// Import commands after mocks are set up
const { initCommand } = await import('../commands/init.js');
const { newCommand } = await import('../commands/new.js');
const { statusCommand } = await import('../commands/status.js');
const { specCommand } = await import('../commands/spec.js');
const { testCreateCommand } = await import('../commands/test-create.js');
const { testApplyCommand } = await import('../commands/test-apply.js');
const { qaCommand } = await import('../commands/qa.js');
const { completeCommand } = await import('../commands/complete.js');
const { listCommand } = await import('../commands/list.js');
const { archiveCommand } = await import('../commands/archive.js');

describe('CLI Command Registration', () => {
  const commands: Command[] = [
    initCommand,
    newCommand,
    statusCommand,
    listCommand,
    specCommand,
    testCreateCommand,
    testApplyCommand,
    qaCommand,
    completeCommand,
    archiveCommand,
  ];

  it('should register all 10 commands', () => {
    expect(commands).toHaveLength(10);
  });

  describe('Command names', () => {
    const expectedNames = [
      'init',
      'new',
      'status',
      'list',
      'spec',
      'test-create',
      'test-apply',
      'qa',
      'complete',
      'archive',
    ];

    it.each(expectedNames)('should have command: %s', (name) => {
      const command = commands.find((cmd) => cmd.name() === name);
      expect(command).toBeDefined();
    });
  });

  describe('Command descriptions', () => {
    it('init command should have description', () => {
      expect(initCommand.description()).toContain('Initialize');
    });

    it('new command should have description', () => {
      expect(newCommand.description()).toContain('new spec');
    });

    it('status command should have description', () => {
      expect(statusCommand.description()).toContain('status');
    });

    it('list command should have description', () => {
      expect(listCommand.description()).toContain('List');
    });

    it('spec command should have description', () => {
      expect(specCommand.description()).toContain('spec');
    });

    it('test-create command should have description', () => {
      expect(testCreateCommand.description()).toContain('Generate tests');
    });

    it('test-apply command should have description', () => {
      expect(testApplyCommand.description()).toContain('implementation');
    });

    it('qa command should have description', () => {
      expect(qaCommand.description()).toContain('QA');
    });

    it('complete command should have description', () => {
      expect(completeCommand.description()).toContain('COMPLETE');
    });

    it('archive command should have description', () => {
      expect(archiveCommand.description()).toContain('ARCHIVE');
    });
  });

  describe('Commands with <id> argument', () => {
    it('spec command should require <id> argument', () => {
      const args = specCommand.registeredArguments;
      expect(args).toHaveLength(1);
      expect(args[0].required).toBe(true);
      expect(args[0]._name || args[0].name).toBe('id');
    });

    it('test-create command should require <id> argument', () => {
      const args = testCreateCommand.registeredArguments;
      expect(args).toHaveLength(1);
      expect(args[0].required).toBe(true);
      expect(args[0]._name || args[0].name).toBe('id');
    });

    it('test-apply command should require <id> argument', () => {
      const args = testApplyCommand.registeredArguments;
      expect(args).toHaveLength(1);
      expect(args[0].required).toBe(true);
      expect(args[0]._name || args[0].name).toBe('id');
    });

    it('qa command should require <id> argument', () => {
      const args = qaCommand.registeredArguments;
      expect(args).toHaveLength(1);
      expect(args[0].required).toBe(true);
      expect(args[0]._name || args[0].name).toBe('id');
    });

    it('complete command should require <id> argument', () => {
      const args = completeCommand.registeredArguments;
      expect(args).toHaveLength(1);
      expect(args[0].required).toBe(true);
      expect(args[0]._name || args[0].name).toBe('id');
    });

    it('archive command should require <id> argument', () => {
      const args = archiveCommand.registeredArguments;
      expect(args).toHaveLength(1);
      expect(args[0].required).toBe(true);
      expect(args[0]._name || args[0].name).toBe('id');
    });
  });

  describe('Commands without <id> argument', () => {
    it('init command should not require <id> argument', () => {
      const args = initCommand.registeredArguments;
      const idArg = args.find((a) => (a._name || a.name) === 'id');
      expect(idArg).toBeUndefined();
    });

    it('new command should not require <id> argument (uses <name>)', () => {
      const args = newCommand.registeredArguments;
      expect(args[0]._name || args[0].name).toBe('name');
      expect(args.find((a) => (a._name || a.name) === 'id')).toBeUndefined();
    });

    it('status command should not require <id> argument', () => {
      const args = statusCommand.registeredArguments;
      const idArg = args.find((a) => (a._name || a.name) === 'id');
      expect(idArg).toBeUndefined();
    });

    it('list command should not require <id> argument', () => {
      const args = listCommand.registeredArguments;
      const idArg = args.find((a) => (a._name || a.name) === 'id');
      expect(idArg).toBeUndefined();
    });
  });

  describe('Command options', () => {
    it('new command should have --description option', () => {
      const opts = newCommand.options;
      const descOpt = opts.find((o) => o.short === '-d' || o.long === '--description');
      expect(descOpt).toBeDefined();
    });

    it('new command should have --author option', () => {
      const opts = newCommand.options;
      const authorOpt = opts.find((o) => o.short === '-a' || o.long === '--author');
      expect(authorOpt).toBeDefined();
    });

    it('list command should have --stage option', () => {
      const opts = listCommand.options;
      const stageOpt = opts.find((o) => o.long === '--stage');
      expect(stageOpt).toBeDefined();
    });

    it('list command should have --json option', () => {
      const opts = listCommand.options;
      const jsonOpt = opts.find((o) => o.long === '--json');
      expect(jsonOpt).toBeDefined();
    });

    it('qa command should have --output option', () => {
      const opts = qaCommand.options;
      const outputOpt = opts.find((o) => o.short === '-o' || o.long === '--output');
      expect(outputOpt).toBeDefined();
    });

    it('complete command should have --report option', () => {
      const opts = completeCommand.options;
      const reportOpt = opts.find((o) => o.short === '-r' || o.long === '--report');
      expect(reportOpt).toBeDefined();
    });
  });
});
