/**
 * validateSpecId integration tests
 * Tests the spec ID validation logic from @specsafe/core
 */
import { describe, it, expect } from 'vitest';
import { validateSpecId } from '@specsafe/core';

describe('validateSpecId', () => {
  describe('valid IDs', () => {
    it('should accept valid spec ID: SPEC-20260211-001', () => {
      expect(() => validateSpecId('SPEC-20260211-001')).not.toThrow();
    });

    it('should accept valid spec ID with different date and number', () => {
      expect(() => validateSpecId('SPEC-20250115-042')).not.toThrow();
    });

    it('should accept valid spec ID at boundary values', () => {
      expect(() => validateSpecId('SPEC-20241231-999')).not.toThrow();
    });
  });

  describe('invalid format', () => {
    it('should throw for invalid format: SPEC-2024-001', () => {
      expect(() => validateSpecId('SPEC-2024-001')).toThrow('Invalid spec ID format');
    });

    it('should throw for missing prefix: 20260211-001', () => {
      expect(() => validateSpecId('20260211-001')).toThrow('Invalid spec ID format');
    });

    it('should throw for wrong separator: SPEC_20260211_001', () => {
      expect(() => validateSpecId('SPEC_20260211_001')).toThrow('Invalid spec ID format');
    });

    it('should throw for lowercase prefix: spec-20260211-001', () => {
      expect(() => validateSpecId('spec-20260211-001')).toThrow('Invalid spec ID format');
    });

    it('should throw for missing sequence number: SPEC-20260211', () => {
      expect(() => validateSpecId('SPEC-20260211')).toThrow('Invalid spec ID format');
    });

    it('should throw for too many digits in sequence: SPEC-20260211-0001', () => {
      expect(() => validateSpecId('SPEC-20260211-0001')).toThrow('Invalid spec ID format');
    });

    it('should throw for too few digits in sequence: SPEC-20260211-01', () => {
      expect(() => validateSpecId('SPEC-20260211-01')).toThrow('Invalid spec ID format');
    });
  });

  describe('invalid dates', () => {
    it('should throw for invalid month 13: SPEC-20251399-001', () => {
      expect(() => validateSpecId('SPEC-20251399-001')).toThrow('invalid date');
    });

    it('should throw for invalid month 00: SPEC-20250001-001', () => {
      expect(() => validateSpecId('SPEC-20250001-001')).toThrow('invalid date');
    });

    it('should throw for invalid day 32: SPEC-20260132-001', () => {
      expect(() => validateSpecId('SPEC-20260132-001')).toThrow('invalid date');
    });

    it('should throw for invalid day 00: SPEC-20260100-001', () => {
      expect(() => validateSpecId('SPEC-20260100-001')).toThrow('invalid date');
    });

    it('should throw for February 30: SPEC-20260230-001', () => {
      expect(() => validateSpecId('SPEC-20260230-001')).toThrow('invalid date');
    });

    it('should throw for April 31: SPEC-20260431-001', () => {
      expect(() => validateSpecId('SPEC-20260431-001')).toThrow('invalid date');
    });
  });

  describe('empty and non-string values', () => {
    it('should throw for empty string', () => {
      expect(() => validateSpecId('')).toThrow('Spec ID is required');
    });

    it('should throw for null', () => {
      expect(() => validateSpecId(null as unknown as string)).toThrow('must be a string');
    });

    it('should throw for undefined', () => {
      expect(() => validateSpecId(undefined as unknown as string)).toThrow('Spec ID is required');
    });

    it('should throw for number', () => {
      expect(() => validateSpecId(123 as unknown as string)).toThrow('must be a string');
    });

    it('should throw for object', () => {
      expect(() => validateSpecId({} as unknown as string)).toThrow('must be a string');
    });

    it('should throw for array', () => {
      expect(() => validateSpecId([] as unknown as string)).toThrow('must be a string');
    });
  });
});
