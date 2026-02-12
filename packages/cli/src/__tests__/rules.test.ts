/**
 * Rules command tests
 * Tests the specsafe rules command with list, add, remove, update subcommands
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

// Mock fs/promises
const mockAccess = vi.fn();
const mockReadFile = vi.fn();
const mockWriteFile = vi.fn();
const mockMkdir = vi.fn();
const mockRm = vi.fn();
const mockReaddir = vi.fn();

vi.mock('fs/promises', () => ({
  access: (...args: unknown[]) => mockAccess(...args),
  readFile: (...args: unknown[]) => mockReadFile(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
  mkdir: (...args: unknown[]) => mockMkdir(...args),
  rm: (...args: unknown[]) => mockRm(...args),
  readdir: (...args: unknown[]) => mockReaddir(...args),
}));

// Mock ora
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

// Import after mocks are set up
const { rulesCommand } = await import('../commands/rules.js');

describe('CLI rules command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Command registration', () => {
    it('should register the rules command', () => {
      expect(rulesCommand).toBeDefined();
      expect(rulesCommand.name()).toBe('rules');
    });

    it('should have description', () => {
      expect(rulesCommand.description()).toContain('rules');
    });

    it('should have 4 subcommands', () => {
      const subcommands = rulesCommand.commands;
      expect(subcommands).toHaveLength(4);
    });
  });

  describe('Subcommands', () => {
    it('should have list subcommand', () => {
      const listCmd = rulesCommand.commands.find((cmd) => cmd.name() === 'list');
      expect(listCmd).toBeDefined();
      expect(listCmd?.description()).toContain('List');
    });

    it('should have add subcommand', () => {
      const addCmd = rulesCommand.commands.find((cmd) => cmd.name() === 'add');
      expect(addCmd).toBeDefined();
      expect(addCmd?.description()).toContain('Install');
    });

    it('should have remove subcommand', () => {
      const removeCmd = rulesCommand.commands.find((cmd) => cmd.name() === 'remove');
      expect(removeCmd).toBeDefined();
      expect(removeCmd?.description()).toContain('Remove');
    });

    it('should have info subcommand', () => {
      const infoCmd = rulesCommand.commands.find((cmd) => cmd.name() === 'info');
      expect(infoCmd).toBeDefined();
      expect(infoCmd?.description()).toContain('information');
    });
  });

  describe('add subcommand argument', () => {
    it('should require <agent> argument', () => {
      const addCmd = rulesCommand.commands.find((cmd) => cmd.name() === 'add');
      expect(addCmd).toBeDefined();
      const args = addCmd!.registeredArguments;
      expect(args).toHaveLength(1);
      expect(args[0].required).toBe(true);
      expect(args[0]._name || args[0].name).toBe('agent');
    });
  });

  describe('remove subcommand argument', () => {
    it('should require <agent> argument', () => {
      const removeCmd = rulesCommand.commands.find((cmd) => cmd.name() === 'remove');
      expect(removeCmd).toBeDefined();
      const args = removeCmd!.registeredArguments;
      expect(args).toHaveLength(1);
      expect(args[0].required).toBe(true);
      expect(args[0]._name || args[0].name).toBe('agent');
    });
  });
});

describe('Rules Registry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export AVAILABLE_RULES with 7 tools', async () => {
    const { AVAILABLE_RULES } = await import('../rules/registry.js');
    expect(AVAILABLE_RULES).toHaveLength(7);
  });

  it('should include cursor tool', async () => {
    const { AVAILABLE_RULES } = await import('../rules/registry.js');
    const cursor = AVAILABLE_RULES.find((t) => t.name === 'cursor');
    expect(cursor).toBeDefined();
    expect(cursor?.files).toContain('.cursorrules');
  });

  it('should include continue tool', async () => {
    const { AVAILABLE_RULES } = await import('../rules/registry.js');
    const continueTool = AVAILABLE_RULES.find((t) => t.name === 'continue');
    expect(continueTool).toBeDefined();
    expect(continueTool?.files).toContain('.continue/config.yaml');
  });

  it('should include aider tool', async () => {
    const { AVAILABLE_RULES } = await import('../rules/registry.js');
    const aider = AVAILABLE_RULES.find((t) => t.name === 'aider');
    expect(aider).toBeDefined();
    expect(aider?.files).toContain('.aider.conf.yml');
  });

  it('should include zed tool', async () => {
    const { AVAILABLE_RULES } = await import('../rules/registry.js');
    const zed = AVAILABLE_RULES.find((t) => t.name === 'zed');
    expect(zed).toBeDefined();
    expect(zed?.files).toContain('.zed/settings.json');
  });

  it('should include git-hooks tool', async () => {
    const { AVAILABLE_RULES } = await import('../rules/registry.js');
    const gitHooks = AVAILABLE_RULES.find((t) => t.name === 'git-hooks');
    expect(gitHooks).toBeDefined();
    expect(gitHooks?.files).toContain('.githooks/pre-commit');
  });

  it('should include claude-code tool', async () => {
    const { AVAILABLE_RULES } = await import('../rules/registry.js');
    const claudeCode = AVAILABLE_RULES.find((t) => t.name === 'claude-code');
    expect(claudeCode).toBeDefined();
    expect(claudeCode?.files).toContain('CLAUDE.md');
  });

  it('should include crush tool', async () => {
    const { AVAILABLE_RULES } = await import('../rules/registry.js');
    const crush = AVAILABLE_RULES.find((t) => t.name === 'crush');
    expect(crush).toBeDefined();
    expect(crush?.files).toContain('.opencode/commands/specsafe.md');
  });

  describe('detectTool', () => {
    it('should return true when tool config exists', async () => {
      mockAccess.mockResolvedValue(undefined);
      const { detectTool } = await import('../rules/registry.js');
      
      const result = await detectTool('cursor', '/test');
      expect(result).toBe(true);
    });

    it('should return false when tool config does not exist', async () => {
      mockAccess.mockRejectedValue({ code: 'ENOENT' });
      const { detectTool } = await import('../rules/registry.js');
      
      const result = await detectTool('cursor', '/test');
      expect(result).toBe(false);
    });

    it('should return false for unknown tool', async () => {
      const { detectTool } = await import('../rules/registry.js');
      
      const result = await detectTool('unknown-tool', '/test');
      expect(result).toBe(false);
    });
  });

  describe('isValidTool', () => {
    it('should return true for valid tools', async () => {
      const { isValidTool } = await import('../rules/registry.js');
      
      expect(isValidTool('cursor')).toBe(true);
      expect(isValidTool('continue')).toBe(true);
      expect(isValidTool('aider')).toBe(true);
    });

    it('should return false for invalid tools', async () => {
      const { isValidTool } = await import('../rules/registry.js');
      
      expect(isValidTool('unknown')).toBe(false);
      expect(isValidTool('')).toBe(false);
    });
  });

  describe('getTool', () => {
    it('should return tool definition for valid tool', async () => {
      const { getTool } = await import('../rules/registry.js');
      
      const tool = getTool('cursor');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('cursor');
      expect(tool?.description).toContain('Cursor');
    });

    it('should return undefined for invalid tool', async () => {
      const { getTool } = await import('../rules/registry.js');
      
      const tool = getTool('unknown');
      expect(tool).toBeUndefined();
    });
  });

  describe('loadInstalledTools', () => {
    it('should return empty array when config does not exist', async () => {
      mockAccess.mockRejectedValue({ code: 'ENOENT' });
      const { loadInstalledTools } = await import('../rules/registry.js');
      
      const tools = await loadInstalledTools('/test');
      expect(tools).toEqual([]);
    });

    it('should return installed tools from config', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({
        tools: {
          cursor: { enabled: true, version: '1.0.0' },
          aider: { enabled: true, version: '1.2.0' },
        },
      }));
      const { loadInstalledTools } = await import('../rules/registry.js');
      
      const tools = await loadInstalledTools('/test');
      expect(tools).toHaveLength(2);
      expect(tools[0].name).toBe('cursor');
      expect(tools[0].version).toBe('1.0.0');
    });
  });
});

describe('Rules Downloader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRulesVersion', () => {
    it('should return version string', async () => {
      const { getRulesVersion } = await import('../rules/downloader.js');
      
      const version = await getRulesVersion('cursor');
      expect(version).toBe('1.0.0');
    });
  });

  describe('rulesExist', () => {
    it('should return false for unknown tool', async () => {
      const { rulesExist } = await import('../rules/downloader.js');
      
      const exists = await rulesExist('unknown-tool');
      expect(exists).toBe(false);
    });
  });
});

describe('Rules Types', () => {
  it('should export all type definitions', async () => {
    const types = await import('../rules/types.js');
    
    expect(types).toBeDefined();
  });
});
