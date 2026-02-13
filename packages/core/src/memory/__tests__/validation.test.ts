/**
 * Validation Tests
 * Tests for validation and sanitization functions
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  isValidDate,
  isValidSpecId,
  validateDecision,
  validatePattern,
  validateConstraint,
  validateHistoryEntry,
  validateProjectId,
  validateProjectMemory,
  redactSensitiveInfo,
  sanitizePath
} from '../validation.js';

describe('sanitizeString', () => {
  it('should remove null bytes', () => {
    const result = sanitizeString('hello\x00world');
    expect(result).toBe('helloworld');
  });

  it('should remove control characters', () => {
    const result = sanitizeString('hello\x01world\x02');
    expect(result).toBe('helloworld');
  });

  it('should trim trailing whitespace', () => {
    const result = sanitizeString('hello world\t\n');
    expect(result).toBe('hello world');
  });

  it('should trim whitespace', () => {
    const result = sanitizeString('  hello world  ');
    expect(result).toBe('hello world');
  });

  it('should throw on non-string input', () => {
    expect(() => sanitizeString(123 as any)).toThrow('Input must be a string');
  });

  it('should handle empty string', () => {
    const result = sanitizeString('');
    expect(result).toBe('');
  });
});

describe('isValidSpecId', () => {
  it('should accept valid spec IDs', () => {
    expect(isValidSpecId('SPEC-20240101-001')).toBe(true);
    expect(isValidSpecId('SPEC-001')).toBe(true);
    expect(isValidSpecId('spec_123')).toBe(true);
  });

  it('should reject invalid characters', () => {
    expect(isValidSpecId('SPEC-001; rm -rf /')).toBe(false);
    expect(isValidSpecId('SPEC-001|cat /etc/passwd')).toBe(false);
    expect(isValidSpecId('SPEC-001$(whoami)')).toBe(false);
  });

  it('should reject empty strings', () => {
    expect(isValidSpecId('')).toBe(false);
  });

  it('should reject too long IDs', () => {
    const longId = 'A'.repeat(101);
    expect(isValidSpecId(longId)).toBe(false);
  });

  it('should reject non-string input', () => {
    expect(isValidSpecId(123 as any)).toBe(false);
  });
});

describe('validateProjectId', () => {
  it('should accept valid project IDs', () => {
    expect(validateProjectId('my-project')).toBe(true);
    expect(validateProjectId('project123')).toBe(true);
  });

  it('should reject empty strings', () => {
    expect(validateProjectId('')).toBe(false);
  });

  it('should reject too long IDs', () => {
    const longId = 'A'.repeat(101);
    expect(validateProjectId(longId)).toBe(false);
  });
});

describe('validateDecision', () => {
  it('should accept valid decision', () => {
    const decision = {
      id: 'DECISION-1234567890',
      specId: 'SPEC-001',
      decision: 'Use TypeScript',
      rationale: 'For type safety',
      timestamp: new Date(),
      alternatives: ['JavaScript', 'Flow']
    };
    expect(validateDecision(decision)).toBe(true);
  });

  it('should reject decision with invalid spec ID', () => {
    const decision = {
      id: 'DECISION-1234567890',
      specId: 'SPEC-001; rm -rf',
      decision: 'Use TypeScript',
      rationale: 'For type safety',
      timestamp: new Date(),
      alternatives: []
    };
    expect(validateDecision(decision)).toBe(false);
  });

  it('should reject decision with too long decision text', () => {
    const decision = {
      id: 'DECISION-1234567890',
      specId: 'SPEC-001',
      decision: 'A'.repeat(1001),
      rationale: 'For type safety',
      timestamp: new Date(),
      alternatives: []
    };
    expect(validateDecision(decision)).toBe(false);
  });

  it('should reject decision with too long rationale', () => {
    const decision = {
      id: 'DECISION-1234567890',
      specId: 'SPEC-001',
      decision: 'Use TypeScript',
      rationale: 'A'.repeat(5001),
      timestamp: new Date(),
      alternatives: []
    };
    expect(validateDecision(decision)).toBe(false);
  });

  it('should reject decision with non-array alternatives', () => {
    const decision = {
      id: 'DECISION-1234567890',
      specId: 'SPEC-001',
      decision: 'Use TypeScript',
      rationale: 'For type safety',
      timestamp: new Date(),
      alternatives: 'not an array' as any
    };
    expect(validateDecision(decision)).toBe(false);
  });
});

describe('validatePattern', () => {
  it('should accept valid pattern', () => {
    const pattern = {
      id: 'PATTERN-1234567890',
      name: 'jwt-auth',
      description: 'JWT authentication pattern',
      examples: [
        { specId: 'SPEC-001', context: 'Login flow' },
        { specId: 'SPEC-002', context: 'API auth' }
      ],
      usageCount: 2
    };
    expect(validatePattern(pattern)).toBe(true);
  });

  it('should reject pattern with too long name', () => {
    const pattern = {
      id: 'PATTERN-1234567890',
      name: 'A'.repeat(101),
      description: 'JWT authentication pattern',
      examples: [],
      usageCount: 1
    };
    expect(validatePattern(pattern)).toBe(false);
  });

  it('should reject pattern with too long description', () => {
    const pattern = {
      id: 'PATTERN-1234567890',
      name: 'jwt-auth',
      description: 'A'.repeat(1001),
      examples: [],
      usageCount: 1
    };
    expect(validatePattern(pattern)).toBe(false);
  });

  it('should reject pattern with invalid example', () => {
    const pattern = {
      id: 'PATTERN-1234567890',
      name: 'jwt-auth',
      description: 'JWT authentication pattern',
      examples: [{ specId: 'INVALID; rm -rf', context: 'Login' }],
      usageCount: 1
    };
    expect(validatePattern(pattern)).toBe(false);
  });

  it('should reject pattern with negative usage count', () => {
    const pattern = {
      id: 'PATTERN-1234567890',
      name: 'jwt-auth',
      description: 'JWT authentication pattern',
      examples: [],
      usageCount: -1
    };
    expect(validatePattern(pattern)).toBe(false);
  });
});

describe('validateConstraint', () => {
  it('should accept valid constraint', () => {
    const constraint = {
      id: 'CONSTRAINT-1234567890',
      type: 'technical' as const,
      description: 'Must support Node 18+',
      specId: 'SPEC-001'
    };
    expect(validateConstraint(constraint)).toBe(true);
  });

  it('should reject constraint with invalid type', () => {
    const constraint = {
      id: 'CONSTRAINT-1234567890',
      type: 'invalid' as any,
      description: 'Must support Node 18+'
    };
    expect(validateConstraint(constraint)).toBe(false);
  });

  it('should reject constraint with too long description', () => {
    const constraint = {
      id: 'CONSTRAINT-1234567890',
      type: 'technical' as const,
      description: 'A'.repeat(501)
    };
    expect(validateConstraint(constraint)).toBe(false);
  });
});

describe('validateHistoryEntry', () => {
  it('should accept valid history entry', () => {
    const entry = {
      timestamp: new Date(),
      specId: 'SPEC-001',
      action: 'created' as const,
      details: 'Spec created'
    };
    expect(validateHistoryEntry(entry)).toBe(true);
  });

  it('should reject entry with invalid action', () => {
    const entry = {
      timestamp: new Date(),
      specId: 'SPEC-001',
      action: 'invalid' as any,
      details: 'Spec created'
    };
    expect(validateHistoryEntry(entry)).toBe(false);
  });

  it('should reject entry with too long details', () => {
    const entry = {
      timestamp: new Date(),
      specId: 'SPEC-001',
      action: 'created' as const,
      details: 'A'.repeat(1001)
    };
    expect(validateHistoryEntry(entry)).toBe(false);
  });
});

describe('validateProjectMemory', () => {
  it('should accept valid project memory', () => {
    const memory = {
      projectId: 'test-project',
      specs: ['SPEC-001', 'SPEC-002'],
      decisions: [],
      patterns: [],
      constraints: [],
      history: []
    };
    expect(validateProjectMemory(memory)).toBe(true);
  });

  it('should reject memory with invalid project ID', () => {
    const memory = {
      projectId: '',
      specs: [],
      decisions: [],
      patterns: [],
      constraints: [],
      history: []
    };
    expect(validateProjectMemory(memory)).toBe(false);
  });

  it('should reject memory with invalid spec ID in array', () => {
    const memory = {
      projectId: 'test-project',
      specs: ['SPEC-001; rm -rf'],
      decisions: [],
      patterns: [],
      constraints: [],
      history: []
    };
    expect(validateProjectMemory(memory)).toBe(false);
  });

  it('should reject null memory', () => {
    expect(validateProjectMemory(null)).toBe(false);
  });

  it('should reject memory with invalid decision', () => {
    const memory = {
      projectId: 'test-project',
      specs: [],
      decisions: [{ id: 'DECISION-1', specId: 'INVALID; rm -rf', decision: 'Test', rationale: 'Test', timestamp: new Date(), alternatives: [] }],
      patterns: [],
      constraints: [],
      history: []
    };
    expect(validateProjectMemory(memory)).toBe(false);
  });
});

describe('redactSensitiveInfo', () => {
  it('should redact API keys', () => {
    const input = 'apiKey: sk-proj-abc123xyz789';
    const result = redactSensitiveInfo(input);
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('abc123xyz789');
  });

  it('should redact JWT tokens', () => {
    const input = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ';
    const result = redactSensitiveInfo(input);
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('eyJhbGci');
  });

  it('should redact passwords', () => {
    const input = 'password: mySecretPassword123';
    const result = redactSensitiveInfo(input);
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('mySecretPassword123');
  });

  it('should preserve non-sensitive text', () => {
    const input = 'This is a regular text with no secrets';
    const result = redactSensitiveInfo(input);
    expect(result).toBe(input);
  });
});

describe('sanitizePath', () => {
  it('should normalize and validate safe paths', () => {
    const result = sanitizePath('/safe/dir', 'file.txt');
    expect(result).toContain('file.txt');
  });

  it('should reject directory traversal attempts', () => {
    expect(() => sanitizePath('/safe/dir', '../../../etc/passwd')).toThrow('directory traversal');
  });

  it('should reject absolute path escape attempts', () => {
    expect(() => sanitizePath('/safe/dir', '/etc/passwd')).toThrow('directory traversal');
  });
});
