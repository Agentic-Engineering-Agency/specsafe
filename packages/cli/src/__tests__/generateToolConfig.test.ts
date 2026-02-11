import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { generateToolConfig, generateGitHooks } from '../utils/generateToolConfig.js';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
}));

// Mock fs
vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(false),
}));

// Mock chalk
vi.mock('chalk', () => ({
  default: {
    yellow: vi.fn((str: string) => str),
    green: vi.fn((str: string) => str),
  },
}));

// Mock child_process
vi.mock('child_process', () => ({
  exec: vi.fn(),
}));

describe('generateToolConfig', () => {
  const projectDir = '/test/project';

  beforeEach(() => {
    vi.clearAllMocks();
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);
  });

  describe('cursor', () => {
    it('should generate .cursorrules file', async () => {
      await generateToolConfig('cursor', projectDir);

      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.cursorrules'),
        expect.stringContaining('SpecSafe Rules for Cursor')
      );
    });

    it('should skip if .cursorrules already exists', async () => {
      (existsSync as unknown as ReturnType<typeof vi.fn>).mockImplementation((path: string) =>
        path.includes('.cursorrules')
      );

      await generateToolConfig('cursor', projectDir);

      expect(writeFile).not.toHaveBeenCalled();
    });
  });

  describe('continue', () => {
    it('should create .continue directory', async () => {
      await generateToolConfig('continue', projectDir);

      expect(mkdir).toHaveBeenCalledWith(
        expect.stringContaining('.continue'),
        { recursive: true }
      );
    });

    it('should generate config.json', async () => {
      await generateToolConfig('continue', projectDir);

      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining('config.json'),
        expect.stringContaining('customCommands')
      );
    });

    it('should skip if config.json already exists', async () => {
      (existsSync as unknown as ReturnType<typeof vi.fn>).mockImplementation((path: string) =>
        path.includes('config.json')
      );

      await generateToolConfig('continue', projectDir);

      expect(writeFile).not.toHaveBeenCalled();
    });
  });

  describe('aider', () => {
    it('should generate .aider.conf.yml file', async () => {
      await generateToolConfig('aider', projectDir);

      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.aider.conf.yml'),
        expect.stringContaining('Aider configuration for SpecSafe')
      );
    });

    it('should skip if .aider.conf.yml already exists', async () => {
      (existsSync as unknown as ReturnType<typeof vi.fn>).mockImplementation((path: string) =>
        path.includes('.aider.conf.yml')
      );

      await generateToolConfig('aider', projectDir);

      expect(writeFile).not.toHaveBeenCalled();
    });
  });

  describe('zed', () => {
    it('should create .zed directory', async () => {
      await generateToolConfig('zed', projectDir);

      expect(mkdir).toHaveBeenCalledWith(
        expect.stringContaining('.zed'),
        { recursive: true }
      );
    });

    it('should generate settings.json', async () => {
      await generateToolConfig('zed', projectDir);

      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining('settings.json'),
        expect.stringContaining('context_servers')
      );
    });

    it('should skip if settings.json already exists', async () => {
      (existsSync as unknown as ReturnType<typeof vi.fn>).mockImplementation((path: string) =>
        path.includes('settings.json')
      );

      await generateToolConfig('zed', projectDir);

      expect(writeFile).not.toHaveBeenCalled();
    });
  });

  describe('unknown tool', () => {
    it('should throw error for unknown tool', async () => {
      await expect(generateToolConfig('unknown', projectDir)).rejects.toThrow('Unknown tool: unknown');
    });
  });
});

describe('generateGitHooks', () => {
  const projectDir = '/test/project';

  beforeEach(() => {
    vi.clearAllMocks();
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);
  });

  it('should create .githooks directory', async () => {
    await generateGitHooks(projectDir);

    expect(mkdir).toHaveBeenCalledWith(
      expect.stringContaining('.githooks'),
      { recursive: true }
    );
  });

  it('should generate pre-commit hook', async () => {
    await generateGitHooks(projectDir);

    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining('pre-commit'),
      expect.stringContaining('SpecSafe pre-commit hook')
    );
  });

  it('should skip if pre-commit already exists', async () => {
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockImplementation((path: string) =>
      path.includes('pre-commit')
    );

    await generateGitHooks(projectDir);

    expect(writeFile).not.toHaveBeenCalled();
  });
});
