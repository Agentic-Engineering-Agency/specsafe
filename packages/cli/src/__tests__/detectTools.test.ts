import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { existsSync } from 'fs';

// Mock fs module before importing detectTools
vi.mock('fs', () => ({
  existsSync: vi.fn(),
}));

// Import after mock is set up
const { detectInstalledTools, availableTools } = await import('../utils/detectTools.js');

describe('detectInstalledTools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return empty array when no tools are detected', () => {
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);
    
    const result = detectInstalledTools();
    
    expect(result).toEqual([]);
  });

  it('should detect cursor when .cursorrules exists', () => {
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
      return path === '.cursorrules';
    });
    
    const result = detectInstalledTools();
    
    expect(result).toContain('cursor');
    expect(result).toHaveLength(1);
  });

  it('should detect continue when .continue/config.json exists', () => {
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
      return path === '.continue/config.json';
    });
    
    const result = detectInstalledTools();
    
    expect(result).toContain('continue');
    expect(result).toHaveLength(1);
  });

  it('should detect aider when .aider.conf.yml exists', () => {
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
      return path === '.aider.conf.yml';
    });
    
    const result = detectInstalledTools();
    
    expect(result).toContain('aider');
    expect(result).toHaveLength(1);
  });

  it('should detect zed when .zed/settings.json exists', () => {
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
      return path === '.zed/settings.json';
    });
    
    const result = detectInstalledTools();
    
    expect(result).toContain('zed');
    expect(result).toHaveLength(1);
  });

  it('should detect multiple tools when multiple configs exist', () => {
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
      return ['.cursorrules', '.aider.conf.yml'].includes(path);
    });
    
    const result = detectInstalledTools();
    
    expect(result).toContain('cursor');
    expect(result).toContain('aider');
    expect(result).toHaveLength(2);
  });

  it('should detect all tools when all configs exist', () => {
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
    
    const result = detectInstalledTools();
    
    expect(result).toEqual(['cursor', 'continue', 'aider', 'zed', 'claude-code', 'crush']);
  });

  it('should detect claude-code when .claude directory exists', () => {
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
      return path === '.claude';
    });
    
    const result = detectInstalledTools();
    
    expect(result).toContain('claude-code');
  });

  it('should detect claude-code when CLAUDE.md exists', () => {
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
      return path === 'CLAUDE.md';
    });
    
    const result = detectInstalledTools();
    
    expect(result).toContain('claude-code');
  });

  it('should detect crush when .opencode directory exists', () => {
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
      return path === '.opencode';
    });
    
    const result = detectInstalledTools();
    
    expect(result).toContain('crush');
  });

  it('should detect crush when .opencode/commands directory exists', () => {
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
      return path === '.opencode/commands';
    });
    
    const result = detectInstalledTools();
    
    expect(result).toContain('crush');
  });
});

describe('availableTools', () => {
  it('should have 6 available tools', () => {
    expect(availableTools).toHaveLength(6);
  });

  it('should include cursor with correct config', () => {
    const cursor = availableTools.find(t => t.name === 'cursor');
    expect(cursor).toBeDefined();
    expect(cursor?.displayName).toBe('Cursor IDE');
    expect(cursor?.configFiles).toContain('.cursorrules');
  });

  it('should include continue with correct config', () => {
    const continueTool = availableTools.find(t => t.name === 'continue');
    expect(continueTool).toBeDefined();
    expect(continueTool?.displayName).toBe('Continue.dev');
    expect(continueTool?.configFiles).toContain('.continue/config.json');
  });

  it('should include aider with correct config', () => {
    const aider = availableTools.find(t => t.name === 'aider');
    expect(aider).toBeDefined();
    expect(aider?.displayName).toBe('Aider CLI');
    expect(aider?.configFiles).toContain('.aider.conf.yml');
  });

  it('should include zed with correct config', () => {
    const zed = availableTools.find(t => t.name === 'zed');
    expect(zed).toBeDefined();
    expect(zed?.displayName).toBe('Zed Editor');
    expect(zed?.configFiles).toContain('.zed/settings.json');
  });
});
