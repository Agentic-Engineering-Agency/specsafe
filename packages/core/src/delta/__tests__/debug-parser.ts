import { DeltaParser } from '../parser.js';

const parser = new DeltaParser();

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

console.log('Result:', JSON.stringify(result, null, 2));
console.log('Added length:', result.added.length);
console.log('Modified length:', result.modified.length);
console.log('Removed length:', result.removed.length);

if (result.added.length > 0) {
  console.log('First added:', result.added[0]);
}
