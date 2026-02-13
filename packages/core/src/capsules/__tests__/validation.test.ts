import { describe, it, expect } from 'vitest';
import {
  VALIDATION_LIMITS,
  sanitizeString,
  validateSpecId,
  validateTitle,
  validateAuthor,
  validateContent,
  validateTags,
  validateFilter,
  isValidCapsuleType,
} from '../validation.js';

describe('VALIDATION_LIMITS', () => {
  it('should have defined limits', () => {
    expect(VALIDATION_LIMITS.MAX_TITLE_LENGTH).toBe(200);
    expect(VALIDATION_LIMITS.MAX_AUTHOR_LENGTH).toBe(100);
    expect(VALIDATION_LIMITS.MAX_CONTENT_LENGTH).toBe(100_000);
    expect(VALIDATION_LIMITS.MAX_TAG_LENGTH).toBe(50);
    expect(VALIDATION_LIMITS.MAX_TAGS_COUNT).toBe(20);
    expect(VALIDATION_LIMITS.MAX_SPEC_ID_LENGTH).toBe(255);
  });
});

describe('sanitizeString', () => {
  it('should remove null bytes', () => {
    const input = 'Hello\x00World';
    const sanitized = sanitizeString(input, 100);
    expect(sanitized).toBe('HelloWorld');
  });

  it('should remove control characters', () => {
    const input = 'Hello\x01\x02World';
    const sanitized = sanitizeString(input, 100, false);
    expect(sanitized).toBe('Hello  World');
  });

  it('should keep newlines when allowed', () => {
    const input = 'Hello\nWorld';
    const sanitized = sanitizeString(input, 100, true);
    expect(sanitized).toBe('Hello\nWorld');
  });

  it('should remove newlines when not allowed', () => {
    const input = 'Hello\nWorld';
    const sanitized = sanitizeString(input, 100, false);
    expect(sanitized).toBe('Hello World');
  });

  it('should limit length', () => {
    const input = 'a'.repeat(100);
    const sanitized = sanitizeString(input, 50);
    expect(sanitized).toBe('a'.repeat(50));
  });

  it('should trim whitespace', () => {
    const input = '  Hello World  ';
    const sanitized = sanitizeString(input, 100);
    expect(sanitized).toBe('Hello World');
  });

  it('should handle non-string input', () => {
    expect(sanitizeString(null as any, 100)).toBe('');
    expect(sanitizeString(undefined as any, 100)).toBe('');
    expect(sanitizeString(123 as any, 100)).toBe('');
  });
});

describe('validateSpecId', () => {
  it('should accept valid spec IDs', () => {
    expect(validateSpecId('checkout')).toBe('checkout');
    expect(validateSpecId('specs/checkout')).toBe('checkout');
    expect(validateSpecId('specs/checkout.md')).toBe('checkout');
    expect(validateSpecId('my-feature-123')).toBe('my-feature-123');
    expect(validateSpecId('my.feature')).toBe('my.feature');
  });

  it('should reject path traversal attempts', () => {
    expect(() => validateSpecId('../etc/passwd')).toThrow();
    expect(() => validateSpecId('..')).toThrow();
    expect(() => validateSpecId('...')).toThrow();
    expect(() => validateSpecId('specs/../../../etc/passwd')).toThrow();
  });

  it('should reject invalid characters', () => {
    expect(() => validateSpecId('my spec')).toThrow();
    expect(() => validateSpecId('my\x00spec')).toThrow();
  });

  it('should reject empty spec IDs', () => {
    expect(() => validateSpecId('')).toThrow();
    expect(() => validateSpecId('.md')).toThrow();
    expect(() => validateSpecId('   ')).toThrow();
  });

  it('should reject overly long spec IDs', () => {
    const longId = 'a'.repeat(256);
    expect(() => validateSpecId(longId)).toThrow();
  });

  it('should handle non-string input', () => {
    expect(() => validateSpecId(null as any)).toThrow();
    expect(() => validateSpecId(undefined as any)).toThrow();
    expect(() => validateSpecId(123 as any)).toThrow();
  });
});

describe('validateTitle', () => {
  it('should accept valid titles', () => {
    expect(validateTitle('My Title')).toBe('My Title');
    expect(validateTitle('  My Title  ')).toBe('My Title');
  });

  it('should reject empty titles', () => {
    expect(() => validateTitle('')).toThrow();
    expect(() => validateTitle('   ')).toThrow();
  });

  it('should reject overly long titles', () => {
    const longTitle = 'a'.repeat(201);
    expect(() => validateTitle(longTitle)).toThrow();
  });

  it('should handle non-string input', () => {
    expect(() => validateTitle(null as any)).toThrow();
    expect(() => validateTitle(undefined as any)).toThrow();
  });
});

describe('validateAuthor', () => {
  it('should accept valid authors', () => {
    expect(validateAuthor('John Doe')).toBe('John Doe');
    expect(validateAuthor('  John Doe  ')).toBe('John Doe');
  });

  it('should reject empty authors', () => {
    expect(() => validateAuthor('')).toThrow();
    expect(() => validateAuthor('   ')).toThrow();
  });

  it('should reject overly long authors', () => {
    const longAuthor = 'a'.repeat(101);
    expect(() => validateAuthor(longAuthor)).toThrow();
  });

  it('should handle non-string input', () => {
    expect(() => validateAuthor(null as any)).toThrow();
    expect(() => validateAuthor(undefined as any)).toThrow();
  });
});

describe('validateContent', () => {
  it('should accept valid content', () => {
    const content = 'Line 1\nLine 2\nLine 3';
    expect(validateContent(content)).toBe(content);
  });

  it('should preserve newlines in content', () => {
    const content = 'First line\nSecond line\nThird line';
    expect(validateContent(content)).toBe(content);
  });

  it('should reject empty content', () => {
    expect(() => validateContent('')).toThrow();
    expect(() => validateContent('   ')).toThrow();
  });

  it('should reject overly long content', () => {
    const longContent = 'a'.repeat(100_001);
    expect(() => validateContent(longContent)).toThrow();
  });

  it('should handle non-string input', () => {
    expect(() => validateContent(null as any)).toThrow();
    expect(() => validateContent(undefined as any)).toThrow();
  });
});

describe('validateTags', () => {
  it('should accept valid tags', () => {
    expect(validateTags(['tag1', 'tag2', 'tag3'])).toEqual(['tag1', 'tag2', 'tag3']);
  });

  it('should deduplicate tags', () => {
    expect(validateTags(['tag1', 'tag1', 'tag2', 'tag1'])).toEqual(['tag1', 'tag2']);
  });

  it('should trim tag whitespace', () => {
    expect(validateTags([' tag1 ', '  tag2  '])).toEqual(['tag1', 'tag2']);
  });

  it('should remove empty tags', () => {
    expect(validateTags(['tag1', '', 'tag2', '  ', 'tag3'])).toEqual(['tag1', 'tag2', 'tag3']);
  });

  it('should skip non-string tags', () => {
    expect(validateTags(['tag1', null as any, 'tag2', undefined as any] as any)).toEqual(['tag1', 'tag2']);
  });

  it('should reject too many tags', () => {
    const tags = Array.from({ length: 21 }, (_, i) => `tag${i}`);
    expect(() => validateTags(tags)).toThrow();
  });

  it('should reject overly long individual tags', () => {
    const longTag = 'a'.repeat(51);
    expect(() => validateTags([longTag])).toThrow();
  });

  it('should handle non-array input', () => {
    expect(() => validateTags(null as any)).toThrow();
    expect(() => validateTags(undefined as any)).toThrow();
    expect(() => validateTags('not-an-array' as any)).toThrow();
  });

  it('should accept empty array', () => {
    expect(validateTags([])).toEqual([]);
  });
});

describe('validateFilter', () => {
  it('should accept valid filter with no options', () => {
    const result = validateFilter({});
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should accept valid types filter', () => {
    const result = validateFilter({
      types: ['user-story', 'technical-context'],
    });
    expect(result.isValid).toBe(true);
  });

  it('should reject invalid types', () => {
    const result = validateFilter({
      types: ['invalid-type'],
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid capsule type: invalid-type');
  });

  it('should accept valid tags filter', () => {
    const result = validateFilter({
      tags: ['tag1', 'tag2'],
    });
    expect(result.isValid).toBe(true);
  });

  it('should reject invalid tags', () => {
    const result = validateFilter({
      tags: Array.from({ length: 21 }, (_, i) => `tag${i}`),
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('tags'))).toBe(true);
  });

  it('should accept valid author filter', () => {
    const result = validateFilter({
      author: 'John Doe',
    });
    expect(result.isValid).toBe(true);
  });

  it('should reject invalid author', () => {
    const result = validateFilter({
      author: '',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Author'))).toBe(true);
  });

  it('should accept valid date range', () => {
    const result = validateFilter({
      dateRange: {
        from: '2024-01-01T00:00:00.000Z',
        to: '2024-12-31T23:59:59.999Z',
      },
    });
    expect(result.isValid).toBe(true);
  });

  it('should reject invalid date range format', () => {
    const result = validateFilter({
      dateRange: {
        from: 'not-a-date',
        to: '2024-12-31T23:59:59.999Z',
      },
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('date'))).toBe(true);
  });

  it('should reject date range where from > to', () => {
    const result = validateFilter({
      dateRange: {
        from: '2024-12-31T23:59:59.999Z',
        to: '2024-01-01T00:00:00.000Z',
      },
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('must be before'))).toBe(true);
  });

  it('should accept multiple valid filters', () => {
    const result = validateFilter({
      types: ['user-story'],
      tags: ['important'],
      author: 'John Doe',
      dateRange: {
        from: '2024-01-01T00:00:00.000Z',
        to: '2024-12-31T23:59:59.999Z',
      },
    });
    expect(result.isValid).toBe(true);
  });

  it('should collect all validation errors', () => {
    const result = validateFilter({
      types: ['invalid-type'],
      tags: Array.from({ length: 21 }, (_, i) => `tag${i}`),
      author: '',
      dateRange: {
        from: 'not-a-date',
        to: 'invalid',
      },
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});

describe('isValidCapsuleType', () => {
  it('should return true for valid types', () => {
    expect(isValidCapsuleType('user-story')).toBe(true);
    expect(isValidCapsuleType('technical-context')).toBe(true);
    expect(isValidCapsuleType('business-justification')).toBe(true);
    expect(isValidCapsuleType('discovery-note')).toBe(true);
  });

  it('should return false for invalid types', () => {
    expect(isValidCapsuleType('invalid')).toBe(false);
    expect(isValidCapsuleType('')).toBe(false);
    expect(isValidCapsuleType('random-type')).toBe(false);
  });
});
