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

    it('should generate config.yaml', async () => {
      await generateToolConfig('continue', projectDir);

      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining('config.yaml'),
        expect.stringContaining('prompts')
      );
    });

    it('should skip if config.yaml already exists', async () => {
      (existsSync as unknown as ReturnType<typeof vi.fn>).mockImplementation((path: string) =>
        path.includes('config.yaml')
      );

      await generateToolConfig('continue', projectDir);

      // config.yaml skipped, but prompt files are still written
      const configCalls = (writeFile as unknown as ReturnType<typeof vi.fn>).mock.calls.filter(
        (call: any[]) => call[0].includes('config.yaml')
      );
      expect(configCalls).toHaveLength(0);
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

    it('should skip .aider.conf.yml if it already exists', async () => {
      (existsSync as unknown as ReturnType<typeof vi.fn>).mockImplementation((path: string) =>
        path.includes('.aider.conf.yml')
      );

      await generateToolConfig('aider', projectDir);

      // .aider.conf.yml skipped, but .aiderignore may still be written
      const confCalls = (writeFile as unknown as ReturnType<typeof vi.fn>).mock.calls.filter(
        (call: any[]) => call[0].includes('.aider.conf.yml')
      );
      expect(confCalls).toHaveLength(0);
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

  describe('claude-code', () => {
    it('should create CLAUDE.md file', async () => {
      await generateToolConfig('claude-code', projectDir);

      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining('CLAUDE.md'),
        expect.stringContaining('SpecSafe Project')
      );
    });

    it('should create .claude/skills directory', async () => {
      await generateToolConfig('claude-code', projectDir);

      expect(mkdir).toHaveBeenCalledWith(
        expect.stringContaining('.claude/skills'),
        { recursive: true }
      );
    });

    it('should create specsafe skill file', async () => {
      await generateToolConfig('claude-code', projectDir);

      expect(mkdir).toHaveBeenCalledWith(
        expect.stringContaining('.claude/skills/specsafe'),
        { recursive: true }
      );
      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining('specsafe/SKILL.md'),
        expect.stringContaining('name: specsafe')
      );
    });

    it('should create spec skill file', async () => {
      await generateToolConfig('claude-code', projectDir);

      expect(mkdir).toHaveBeenCalledWith(
        expect.stringContaining('.claude/skills/specsafe-spec'),
        { recursive: true }
      );
      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining('specsafe-spec/SKILL.md'),
        expect.stringContaining('name: specsafe-spec')
      );
    });

    it('should create verify skill file', async () => {
      await generateToolConfig('claude-code', projectDir);

      expect(mkdir).toHaveBeenCalledWith(
        expect.stringContaining('.claude/skills/specsafe-verify'),
        { recursive: true }
      );
      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining('specsafe-verify/SKILL.md'),
        expect.stringContaining('name: specsafe-verify')
      );
    });

    it('should skip if CLAUDE.md already exists', async () => {
      (existsSync as unknown as ReturnType<typeof vi.fn>).mockImplementation((path: string) =>
        path.includes('CLAUDE.md')
      );

      await generateToolConfig('claude-code', projectDir);

      // Should still create skills even if CLAUDE.md exists
      expect(mkdir).toHaveBeenCalledWith(
        expect.stringContaining('.claude/skills'),
        { recursive: true }
      );
    });

    it('should skip skill files if they already exist', async () => {
      (existsSync as unknown as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
        if (path.includes('SKILL.md')) {
          return true;
        }
        return false;
      });

      await generateToolConfig('claude-code', projectDir);

      // CLAUDE.md should still be created
      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining('CLAUDE.md'),
        expect.any(String)
      );

      // Skill files should NOT be written since they already exist
      expect(writeFile).not.toHaveBeenCalledWith(
        expect.stringContaining('SKILL.md'),
        expect.any(String)
      );
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
