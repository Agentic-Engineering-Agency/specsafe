import { describe, it, expect, vi } from 'vitest';

// Mock fs/promises to prevent actual file operations
vi.mock('fs/promises', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@specsafe/core', () => ({
  ProjectTracker: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('@inquirer/prompts', () => ({
  input: vi.fn().mockResolvedValue('test-project'),
  checkbox: vi.fn().mockResolvedValue(['cursor']),
  select: vi.fn().mockResolvedValue('vitest'),
  confirm: vi.fn().mockResolvedValue(true),
}));

vi.mock('../utils/detectTools.js', () => ({
  detectInstalledTools: vi.fn().mockReturnValue(['cursor']),
  availableTools: [
    { name: 'cursor', displayName: 'Cursor IDE', configFiles: ['.cursorrules'] },
    { name: 'continue', displayName: 'Continue.dev', configFiles: ['.continue/config.json'] },
    { name: 'aider', displayName: 'Aider CLI', configFiles: ['.aider.conf.yml'] },
    { name: 'zed', displayName: 'Zed Editor', configFiles: ['.zed/settings.json'] },
  ],
}));

vi.mock('../utils/generateToolConfig.js', () => ({
  generateToolConfig: vi.fn().mockResolvedValue(undefined),
  generateGitHooks: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    text: '',
  })),
}));

vi.mock('chalk', () => ({
  default: {
    green: vi.fn((str: string) => str),
    blue: vi.fn((str: string) => str),
    red: vi.fn((str: string) => str),
    gray: vi.fn((str: string) => str),
    yellow: vi.fn((str: string) => str),
  },
}));

describe('init command', () => {
  it('should be defined and have correct properties', async () => {
    const { initCommand } = await import('../commands/init.js');
    
    expect(initCommand).toBeDefined();
    expect(initCommand.name()).toBe('init');
    expect(initCommand.description()).toContain('Initialize');
    expect(initCommand.description()).toContain('SpecSafe');
  });

  it('should accept optional name argument with default', async () => {
    const { initCommand } = await import('../commands/init.js');
    
    const args = initCommand.registeredArguments;
    expect(args).toHaveLength(1);
    expect(args[0].required).toBe(false);
    expect(args[0].defaultValue).toBe('my-project');
  });
});
