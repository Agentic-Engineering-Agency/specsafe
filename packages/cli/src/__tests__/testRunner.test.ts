import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { spawn, execSync } from 'child_process';

// Mock fs and child_process
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

vi.mock('child_process', () => ({
  spawn: vi.fn(),
  execSync: vi.fn(),
}));

// Import after mocks are set up
const testRunner = await import('../utils/testRunner.js');
const { detectTestFramework, runTests, runTestsSync } = testRunner;

describe('detectTestFramework', () => {
  const mockExistsSync = existsSync as unknown as ReturnType<typeof vi.fn>;
  const mockReadFileSync = readFileSync as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('vitest detection', () => {
    it('should detect vitest from vitest.config.ts', () => {
      mockExistsSync.mockImplementation((path: string) => path === 'vitest.config.ts');

      const result = detectTestFramework();

      expect(result.framework).toBe('vitest');
      expect(result.command).toBe('npx');
      expect(result.args).toContain('vitest');
      expect(result.args).toContain('--reporter=json');
    });

    it('should detect vitest from vitest.config.js', () => {
      mockExistsSync.mockImplementation((path: string) => path === 'vitest.config.js');

      const result = detectTestFramework();

      expect(result.framework).toBe('vitest');
      expect(result.args).toContain('vitest');
    });

    it('should detect vitest from package.json test script', () => {
      mockExistsSync.mockImplementation((path: string) => path === 'package.json');
      mockReadFileSync.mockReturnValue(JSON.stringify({
        scripts: { test: 'vitest run' }
      }));

      const result = detectTestFramework();

      expect(result.framework).toBe('vitest');
    });

    it('should detect vitest from devDependencies', () => {
      mockExistsSync.mockImplementation((path: string) => path === 'package.json');
      mockReadFileSync.mockReturnValue(JSON.stringify({
        scripts: {},
        devDependencies: { vitest: '^1.0.0' }
      }));

      const result = detectTestFramework();

      expect(result.framework).toBe('vitest');
    });
  });

  describe('fallback behavior', () => {
    it('should default to vitest when no framework is detected', () => {
      mockExistsSync.mockReturnValue(false);

      const result = detectTestFramework();

      expect(result.framework).toBe('vitest');
      expect(result.args).toContain('vitest');
    });

    it('should handle invalid package.json gracefully', () => {
      mockExistsSync.mockImplementation((path: string) => path === 'package.json');
      mockReadFileSync.mockReturnValue('invalid json');

      const result = detectTestFramework();

      expect(result.framework).toBe('vitest');
    });
  });
});

describe('runTests', () => {
  const mockExistsSync = existsSync as unknown as ReturnType<typeof vi.fn>;
  const mockSpawn = spawn as unknown as ReturnType<typeof vi.fn>;
  let mockChildProcess: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockExistsSync.mockImplementation((path: string) => path === 'vitest.config.ts');

    mockChildProcess = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn(),
    };
    mockSpawn.mockReturnValue(mockChildProcess);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should run tests with correct vitest arguments', async () => {
    const testPromise = runTests();

    const stdoutHandler = mockChildProcess.stdout.on.mock.calls.find((call: any) => call[0] === 'data')?.[1];
    const closeHandler = mockChildProcess.on.mock.calls.find((call: any) => call[0] === 'close')?.[1];

    stdoutHandler?.(JSON.stringify({
      testResults: [{
        name: 'test.ts',
        assertionResults: [
          { title: 'test 1', status: 'passed' },
          { title: 'test 2', status: 'passed' }
        ]
      }]
    }));

    closeHandler?.(0);

    const result = await testPromise;

    expect(mockSpawn).toHaveBeenCalledWith(
      'npx',
      expect.arrayContaining(['vitest', 'run', '--reporter=json']),
      expect.objectContaining({
        cwd: process.cwd(),
        shell: true
      })
    );
    expect(result.passCount).toBe(2);
    expect(result.failCount).toBe(0);
    expect(result.passed).toBe(true);
  });

  it('should filter tests by specId', async () => {
    const testPromise = runTests('SPEC-001');

    const stdoutHandler = mockChildProcess.stdout.on.mock.calls.find((call: any) => call[0] === 'data')?.[1];
    const closeHandler = mockChildProcess.on.mock.calls.find((call: any) => call[0] === 'close')?.[1];

    stdoutHandler?.(JSON.stringify({ results: [] }));
    closeHandler?.(0);

    await testPromise;

    expect(mockSpawn).toHaveBeenCalledWith(
      'npx',
      expect.arrayContaining(['-t', 'SPEC-001']),
      expect.anything()
    );
  });

  it('should parse test failures correctly', async () => {
    const testPromise = runTests();

    const stdoutHandler = mockChildProcess.stdout.on.mock.calls.find((call: any) => call[0] === 'data')?.[1];
    const closeHandler = mockChildProcess.on.mock.calls.find((call: any) => call[0] === 'close')?.[1];

    stdoutHandler?.(JSON.stringify({
      testResults: [{
        name: 'test.ts',
        assertionResults: [
          { title: 'passing test', status: 'passed' },
          { 
            title: 'failing test', 
            status: 'failed',
            failureMessages: ['Expected 1 to be 2']
          }
        ]
      }]
    }));

    closeHandler?.(1);

    const result = await testPromise;

    expect(result.passCount).toBe(1);
    expect(result.failCount).toBe(1);
    expect(result.passed).toBe(false);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0].testName).toContain('failing test');
    expect(result.failures[0].error).toBe('Expected 1 to be 2');
  });

  it('should handle spawn errors', async () => {
    const testPromise = runTests();

    const errorHandler = mockChildProcess.on.mock.calls.find((call: any) => call[0] === 'error')?.[1];
    
    errorHandler?.(new Error('Command not found'));

    await expect(testPromise).rejects.toThrow('Failed to run tests');
  });

  it('should fallback to generic parser on invalid JSON', async () => {
    const testPromise = runTests();

    const stdoutHandler = mockChildProcess.stdout.on.mock.calls.find((call: any) => call[0] === 'data')?.[1];
    const closeHandler = mockChildProcess.on.mock.calls.find((call: any) => call[0] === 'close')?.[1];

    stdoutHandler?.('3 passing\n1 failing');
    closeHandler?.(0);

    const result = await testPromise;

    expect(result.passCount).toBe(3);
    expect(result.failCount).toBe(1);
  });

  it('should handle empty test results', async () => {
    const testPromise = runTests();

    const stdoutHandler = mockChildProcess.stdout.on.mock.calls.find((call: any) => call[0] === 'data')?.[1];
    const closeHandler = mockChildProcess.on.mock.calls.find((call: any) => call[0] === 'close')?.[1];

    stdoutHandler?.(JSON.stringify({ testResults: [] }));
    closeHandler?.(0);

    const result = await testPromise;

    expect(result.passCount).toBe(0);
    expect(result.failCount).toBe(0);
    expect(result.passed).toBe(true);
  });
});

describe('runTestsSync', () => {
  const mockExistsSync = existsSync as unknown as ReturnType<typeof vi.fn>;
  const mockExecSync = execSync as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockImplementation((path: string) => path === 'vitest.config.ts');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should run tests synchronously', () => {
    mockExecSync.mockReturnValue(JSON.stringify({
      testResults: [{
        name: 'test.ts',
        assertionResults: [
          { title: 'test 1', status: 'passed' },
          { title: 'test 2', status: 'passed' }
        ]
      }]
    }));

    const result = runTestsSync();

    expect(mockExecSync).toHaveBeenCalledWith(
      expect.stringContaining('npx vitest run --reporter=json'),
      expect.objectContaining({
        cwd: process.cwd(),
        encoding: 'utf-8'
      })
    );
    expect(result.passCount).toBe(2);
    expect(result.failCount).toBe(0);
    expect(result.passed).toBe(true);
  });

  it('should parse test output even when command fails', () => {
    const error = new Error('Test failed') as any;
    error.stdout = JSON.stringify({
      testResults: [{
        name: 'test.ts',
        assertionResults: [
          { title: 'test 1', status: 'passed' },
          { 
            title: 'test 2', 
            status: 'failed',
            failureMessages: ['Assertion error']
          }
        ]
      }]
    });
    
    mockExecSync.mockImplementation(() => {
      throw error;
    });

    const result = runTestsSync();

    expect(result.passCount).toBe(1);
    expect(result.failCount).toBe(1);
    expect(result.passed).toBe(false);
  });

  it('should filter tests by specId in sync mode', () => {
    mockExecSync.mockReturnValue(JSON.stringify({ results: [] }));

    runTestsSync('SPEC-123');

    expect(mockExecSync).toHaveBeenCalledWith(
      expect.stringContaining('-t SPEC-123'),
      expect.anything()
    );
  });
});

describe('TestResult interface', () => {
  it('should export TestResult interface types', () => {
    // Verify the module exports the expected structure
    expect(testRunner).toHaveProperty('detectTestFramework');
    expect(testRunner).toHaveProperty('runTests');
    expect(testRunner).toHaveProperty('runTestsSync');
  });
});
