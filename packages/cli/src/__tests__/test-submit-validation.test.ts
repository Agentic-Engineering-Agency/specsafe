import { describe, it, expect } from 'vitest';
import { sanitizeFilename, sanitizeRelativePath, validateSpecId } from '../commands/test-submit.js';

describe('test-submit input validation', () => {
  it('accepts safe spec id', () => {
    expect(validateSpecId('SPEC-42')).toBe('SPEC-42');
  });

  it('rejects invalid spec id', () => {
    expect(() => validateSpecId('../SPEC-42')).toThrow('Invalid spec ID');
  });

  it('rejects unsafe relative path traversal', () => {
    expect(() => sanitizeRelativePath('../shots', 'Screenshots directory')).toThrow('safe relative path');
  });

  it('accepts safe filename', () => {
    expect(sanitizeFilename('step-1.png')).toBe('step-1.png');
  });

  it('rejects unsafe filename', () => {
    expect(() => sanitizeFilename('../secret.png')).toThrow('Unsafe filename');
  });
});
