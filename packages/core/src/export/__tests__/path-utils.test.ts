/**
 * Path Utilities Tests
 * Tests for path security and validation functions
 */

import { describe, it, expect } from 'vitest';
import {
  validatePath,
  sanitizeFilename,
  validateFilePath,
  validateExportFormat,
  isValidSpecId,
  validateOutputPath,
} from '../path-utils.js';

describe('validatePath', () => {
  it('should accept valid paths within base directory', () => {
    const basePath = '/home/user/project';
    expect(() => validatePath(basePath, 'specs/active/SPEC-001.md')).not.toThrow();
    expect(() => validatePath(basePath, 'docs/readme.md')).not.toThrow();
  });

  it('should reject path traversal attempts', () => {
    const basePath = '/home/user/project';
    expect(() => validatePath(basePath, '../etc/passwd')).toThrow('Path traversal detected');
    expect(() => validatePath(basePath, 'specs/../../etc/passwd')).toThrow('Path traversal detected');
    expect(() => validatePath(basePath, './../../../etc/passwd')).toThrow('Path traversal detected');
  });

  it('should accept absolute paths that are within base directory', () => {
    const basePath = '/home/user/project';
    expect(() => validatePath(basePath, '/home/user/project/specs/active/SPEC-001.md')).not.toThrow();
  });

  it('should reject absolute paths outside base directory', () => {
    const basePath = '/home/user/project';
    expect(() => validatePath(basePath, '/etc/passwd')).toThrow('Path traversal detected');
    expect(() => validatePath(basePath, '/tmp/test.md')).toThrow('Path traversal detected');
  });

  it('should resolve relative paths correctly', () => {
    const basePath = '/home/user/project';
    const result = validatePath(basePath, 'specs/active/SPEC-001.md');
    expect(result).toContain('specs/active/SPEC-001.md');
  });
});

describe('sanitizeFilename', () => {
  it('should accept valid filenames', () => {
    expect(sanitizeFilename('spec-001.md')).toBe('spec-001.md');
    expect(sanitizeFilename('My_Spec_v2.0.pdf')).toBe('My_Spec_v2.0.pdf');
    expect(sanitizeFilename('SPEC-20260212-001.json')).toBe('SPEC-20260212-001.json');
  });

  it('should remove path traversal sequences', () => {
    expect(sanitizeFilename('../../../etc/passwd')).toBe('etcpasswd');
    expect(sanitizeFilename('../file.txt')).toBe('file.txt');
  });

  it('should remove leading slashes', () => {
    expect(sanitizeFilename('/etc/passwd')).toBe('etcpasswd');
    expect(sanitizeFilename('\\windows\\system32')).toBe('windowssystem32');
  });

  it('should remove invalid characters', () => {
    expect(sanitizeFilename('file<name>.txt')).toBe('filename.txt');
    expect(sanitizeFilename('file|name.txt')).toBe('filename.txt');
    expect(sanitizeFilename('file?name.txt')).toBe('filename.txt');
    expect(sanitizeFilename('file:name.txt')).toBe('filename.txt');
    expect(sanitizeFilename('file*name.txt')).toBe('filename.txt');
  });

  it('should throw error for empty filename', () => {
    expect(() => sanitizeFilename('')).toThrow('Filename cannot be empty');
    expect(() => sanitizeFilename('.')).toThrow('Filename cannot be empty');
  });

  it('should handle mixed special characters', () => {
    expect(sanitizeFilename('../My Spec<>:name?.txt')).toBe('My Specname.txt');
  });
});

describe('validateFilePath', () => {
  it('should accept valid file paths', () => {
    const basePath = '/home/user/project';
    expect(() => validateFilePath('specs/active/SPEC-001.md', basePath)).not.toThrow();
    expect(() => validateFilePath('docs/readme.md', basePath)).not.toThrow();
  });

  it('should reject path traversal', () => {
    const basePath = '/home/user/project';
    expect(() => validateFilePath('../etc/passwd', basePath)).toThrow('Contains suspicious pattern');
    expect(() => validateFilePath('specs/../../etc/passwd', basePath)).toThrow('Contains suspicious pattern');
  });

  it('should reject URL-encoded path traversal', () => {
    const basePath = '/home/user/project';
    expect(() => validateFilePath('%2e%2e/etc/passwd', basePath)).toThrow('Contains suspicious pattern');
    expect(() => validateFilePath('%5cetc%5cpasswd', basePath)).toThrow('Contains suspicious pattern');
  });

  it('should reject null bytes', () => {
    const basePath = '/home/user/project';
    expect(() => validateFilePath('file\x00.txt', basePath)).toThrow('Contains suspicious pattern');
  });

  it('should reject environment variable injection attempts', () => {
    const basePath = '/home/user/project';
    expect(() => validateFilePath('$HOME/passwd', basePath)).toThrow('Contains suspicious pattern');
    expect(() => validateFilePath('${HOME}/passwd', basePath)).toThrow('Contains suspicious pattern');
  });

  it('should reject paths outside base directory', () => {
    const basePath = '/home/user/project';
    expect(() => validateFilePath('/etc/passwd', basePath)).toThrow('Path must be within');
  });
});

describe('validateExportFormat', () => {
  it('should accept valid formats', () => {
    expect(validateExportFormat('markdown')).toBe('markdown');
    expect(validateExportFormat('json')).toBe('json');
    expect(validateExportFormat('html')).toBe('html');
    expect(validateExportFormat('stakeholder')).toBe('stakeholder');
    expect(validateExportFormat('pdf-bundle')).toBe('pdf-bundle');
  });

  it('should reject invalid formats', () => {
    expect(() => validateExportFormat('invalid')).toThrow('Invalid export format');
    expect(() => validateExportFormat('xml')).toThrow('Invalid export format');
    expect(() => validateExportFormat('')).toThrow('Invalid export format');
    expect(() => validateExportFormat('pdf')).toThrow('Invalid export format');
  });

  it('should be case-sensitive', () => {
    expect(() => validateExportFormat('Markdown')).toThrow('Invalid export format');
    expect(() => validateExportFormat('JSON')).toThrow('Invalid export format');
    expect(() => validateExportFormat('HTML')).toThrow('Invalid export format');
  });
});

describe('isValidSpecId', () => {
  it('should accept valid spec IDs', () => {
    expect(isValidSpecId('SPEC-20260212-001')).toBe(true);
    expect(isValidSpecId('FEAT-20230101-123')).toBe(true);
    expect(isValidSpecId('FIX-20251231-999')).toBe(true);
    expect(isValidSpecId('DOC-20260212-000')).toBe(true);
  });

  it('should reject invalid spec IDs', () => {
    expect(isValidSpecId('spec-20260212-001')).toBe(false); // lowercase
    expect(isValidSpecId('SPEC-20260212-1')).toBe(false); // too few digits
    expect(isValidSpecId('SPEC-2026-01-001')).toBe(false); // wrong date format
    expect(isValidSpecId('SPEC20260212001')).toBe(false); // missing hyphens
    expect(isValidSpecId('SPEC-20260212-')).toBe(false); // missing number
    expect(isValidSpecId('20260212-001')).toBe(false); // missing prefix
    expect(isValidSpecId('')).toBe(false); // empty
  });

  it('should enforce date format YYYYMMDD', () => {
    expect(isValidSpecId('SPEC-20260000-001')).toBe(false); // invalid date
    expect(isValidSpecId('SPEC-20261301-001')).toBe(false); // invalid month
    expect(isValidSpecId('SPEC-20260032-001')).toBe(false); // invalid day
  });
});

describe('validateOutputPath', () => {
  it('should accept valid output paths', () => {
    const basePath = '/home/user/project';
    expect(() => validateOutputPath('exports', basePath)).not.toThrow();
    expect(() => validateOutputPath('docs/exports', basePath)).not.toThrow();
    expect(() => validateOutputPath('./exports', basePath)).not.toThrow();
  });

  it('should reject empty paths', () => {
    expect(() => validateOutputPath('')).toThrow('Output path cannot be empty');
    expect(() => validateOutputPath('   ')).toThrow('Output path cannot be empty');
  });

  it('should use process.cwd() as default base', () => {
    expect(() => validateOutputPath('exports')).not.toThrow();
  });

  it('should reject path traversal in output paths', () => {
    const basePath = '/home/user/project';
    expect(() => validateOutputPath('../exports', basePath)).toThrow('Contains suspicious pattern');
    expect(() => validateOutputPath('../../exports', basePath)).toThrow('Contains suspicious pattern');
  });

  it('should reject absolute paths outside base', () => {
    const basePath = '/home/user/project';
    expect(() => validateOutputPath('/tmp/exports', basePath)).toThrow('Path must be within');
  });
});

describe('Security Edge Cases', () => {
  it('should handle complex path traversal attempts', () => {
    const basePath = '/home/user/project';
    expect(() => validateFilePath('....//....//etc/passwd', basePath)).toThrow();
    expect(() => validateFilePath('././../etc/passwd', basePath)).toThrow();
    expect(() => validateFilePath('..%2f..%2fetc%2fpasswd', basePath)).toThrow();
  });

  it('should handle mixed encoding attempts', () => {
    const basePath = '/home/user/project';
    expect(() => validateFilePath('%2E%2E%2Fetc%2Fpasswd', basePath)).toThrow();
  });

  it('should handle null injection attempts', () => {
    const basePath = '/home/user/project';
    expect(() => validateFilePath('file.txt\x00allowed', basePath)).toThrow();
  });

  it('should handle unicode and special characters in filenames', () => {
    // Should allow unicode
    expect(() => sanitizeFilename('fïléñäme.txt')).not.toThrow();
    expect(() => sanitizeFilename('文件.txt')).not.toThrow();
  });

  it('should sanitize filenames with path separators', () => {
    expect(sanitizeFilename('subdir/file.txt')).toBe('subdirfile.txt');
    expect(sanitizeFilename('subdir\\file.txt')).toBe('subdirfile.txt');
  });
});
