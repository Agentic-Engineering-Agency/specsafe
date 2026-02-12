import { describe, it, expect } from 'vitest';
import { DeltaParser } from '../parser.js';

describe('DeltaParser', () => {
  const parser = new DeltaParser();

  describe('parse', () => {
    it('should parse ADDED requirements', () => {
      const content = `
# Delta Spec: DELTA-SPEC-001-20260212

**Base Spec:** SPEC-20260212-001
**Description:** Adding new authentication requirements

## ADDED Requirements

### FR-AUTH-1
**Priority:** P0

Users must be able to reset their password via email.

- Scenario: User clicks forgot password
- Scenario: System sends reset email
      `;

      const result = parser.parse(content, 'DELTA-001', 'SPEC-001', 'dev');

      expect(result.added).toHaveLength(1);
      expect(result.added[0].id).toBe('FR-AUTH-1');
      expect(result.added[0].priority).toBe('P0');
      expect(result.added[0].text).toContain('reset their password');
      expect(result.added[0].scenarios).toHaveLength(2);
    });

    it('should parse MODIFIED requirements with "was" notation', () => {
      const content = `
## MODIFIED Requirements

### FR-AUTH-1
**Priority:** P0

Users must authenticate using email and password with 2FA ← (was Users must authenticate using email and password)
      `;

      const result = parser.parse(content, 'DELTA-001', 'SPEC-001', 'dev');

      expect(result.modified).toHaveLength(1);
      expect(result.modified[0].id).toBe('FR-AUTH-1');
      expect(result.modified[0].text).toContain('with 2FA');
      expect(result.modified[0].oldText).toBe('Users must authenticate using email and password');
    });

    it('should parse REMOVED requirements', () => {
      const content = `
## REMOVED Requirements

- FR-OLD-1
- FR-OLD-2
      `;

      const result = parser.parse(content, 'DELTA-001', 'SPEC-001', 'dev');

      expect(result.removed).toHaveLength(2);
      expect(result.removed).toContain('FR-OLD-1');
      expect(result.removed).toContain('FR-OLD-2');
    });

    it('should parse all sections together', () => {
      const content = `
# Delta Spec: DELTA-001

**Base Spec:** SPEC-001
**Description:** Major auth update

## ADDED Requirements

### FR-NEW-1
**Priority:** P1

New requirement text.

## MODIFIED Requirements

### FR-EXISTING-1
**Priority:** P0

Modified text ← (was Old text)

## REMOVED Requirements

- FR-OLD-1
      `;

      const result = parser.parse(content, 'DELTA-001', 'SPEC-001', 'dev');

      expect(result.added).toHaveLength(1);
      expect(result.modified).toHaveLength(1);
      expect(result.removed).toHaveLength(1);
      expect(result.description).toBe('Major auth update');
    });
  });

  describe('validate', () => {
    it('should validate a correct delta spec', () => {
      const deltaSpec = {
        id: 'DELTA-001',
        baseSpecId: 'SPEC-001',
        description: 'Test delta',
        createdAt: new Date(),
        author: 'dev',
        added: [{ id: 'FR-1', text: 'New req' }],
        modified: [],
        removed: []
      };

      const result = parser.validate(deltaSpec);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing baseSpecId', () => {
      const deltaSpec = {
        id: 'DELTA-001',
        baseSpecId: '',
        description: 'Test',
        createdAt: new Date(),
        author: 'dev',
        added: [{ id: 'FR-1', text: 'New' }],
        modified: [],
        removed: []
      };

      const result = parser.validate(deltaSpec);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing baseSpecId');
    });

    it('should detect empty delta spec', () => {
      const deltaSpec = {
        id: 'DELTA-001',
        baseSpecId: 'SPEC-001',
        description: 'Test',
        createdAt: new Date(),
        author: 'dev',
        added: [],
        modified: [],
        removed: []
      };

      const result = parser.validate(deltaSpec);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('no changes');
    });

    it('should detect duplicate IDs in ADDED', () => {
      const deltaSpec = {
        id: 'DELTA-001',
        baseSpecId: 'SPEC-001',
        description: 'Test',
        createdAt: new Date(),
        author: 'dev',
        added: [
          { id: 'FR-1', text: 'Req 1' },
          { id: 'FR-1', text: 'Req 1 again' }
        ],
        modified: [],
        removed: []
      };

      const result = parser.validate(deltaSpec);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Duplicate'))).toBe(true);
    });

    it('should detect overlap between ADDED and MODIFIED', () => {
      const deltaSpec = {
        id: 'DELTA-001',
        baseSpecId: 'SPEC-001',
        description: 'Test',
        createdAt: new Date(),
        author: 'dev',
        added: [{ id: 'FR-1', text: 'New' }],
        modified: [{ id: 'FR-1', text: 'Modified' }],
        removed: []
      };

      const result = parser.validate(deltaSpec);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('both ADDED and MODIFIED'))).toBe(true);
    });
  });
});
