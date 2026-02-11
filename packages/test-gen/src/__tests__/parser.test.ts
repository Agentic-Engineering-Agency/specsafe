/**
 * ScenarioParser Tests
 * Tests for the Scenario Parser
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ScenarioParser } from '../parser.js';

describe('ScenarioParser', () => {
  let parser: ScenarioParser;

  beforeEach(() => {
    parser = new ScenarioParser();
  });

  describe('parseRequirements', () => {
    it('should extract requirements from "### Requirement:" sections', () => {
      const text = `
# Spec Document

### Requirement: User Authentication
Some description here

| GIVEN | WHEN | THEN |
| user is on login page | user enters valid credentials | user is logged in |

### Requirement: Data Validation
Another requirement

| GIVEN | WHEN | THEN |
| input is empty | form is submitted | error is shown |
`;
      
      const requirements = parser.parseRequirements(text);
      
      expect(requirements).toHaveLength(2);
      expect(requirements[0].id).toBe('REQ-1');
      expect(requirements[0].text).toBe('User Authentication');
      expect(requirements[0].priority).toBe('P1');
      expect(requirements[0].scenarios).toHaveLength(1);
      
      expect(requirements[1].id).toBe('REQ-2');
      expect(requirements[1].text).toBe('Data Validation');
    });

    it('should return empty array when no requirements found', () => {
      const text = 'Just some random text without requirements';
      
      const requirements = parser.parseRequirements(text);
      
      expect(requirements).toEqual([]);
    });
  });

  describe('parseScenarios', () => {
    it('should extract GIVEN/WHEN/THEN from table format', () => {
      const text = `
### Requirement: Test Requirement

| GIVEN | WHEN | THEN |
| user exists | action is triggered | result happens |
| another user | another action | another result |
`;
      
      const requirements = parser.parseRequirements(text);
      
      expect(requirements[0].scenarios).toHaveLength(2);
      expect(requirements[0].scenarios[0].given).toBe('user exists');
      expect(requirements[0].scenarios[0].when).toBe('action is triggered');
      expect(requirements[0].scenarios[0].then).toBe('result happens');
      expect(requirements[0].scenarios[1].given).toBe('another user');
      expect(requirements[0].scenarios[1].when).toBe('another action');
      expect(requirements[0].scenarios[1].then).toBe('another result');
    });

    it('should handle scenarios across multiple requirements', () => {
      const text = `
### Requirement: First Feature

| GIVEN | WHEN | THEN |
| first given | first when | first then |

### Requirement: Second Feature

| GIVEN | WHEN | THEN |
| second given | second when | second then |
| third given | third when | third then |
`;
      
      const requirements = parser.parseRequirements(text);
      
      expect(requirements).toHaveLength(2);
      expect(requirements[0].scenarios).toHaveLength(1);
      expect(requirements[1].scenarios).toHaveLength(2);
    });

    it('should skip header row in scenario tables', () => {
      const text = `
### Requirement: Test

| GIVEN | WHEN | THEN |
| actual given | actual when | actual then |
`;
      
      const requirements = parser.parseRequirements(text);
      
      // The header row should be filtered out (GIVEN != 'GIVEN' check)
      expect(requirements[0].scenarios[0].given).toBe('actual given');
    });
  });

  describe('Empty input', () => {
    it('should return empty arrays for empty input', () => {
      const requirements = parser.parseRequirements('');
      expect(requirements).toEqual([]);
    });

    it('should return empty arrays for whitespace-only input', () => {
      const requirements = parser.parseRequirements('   \n\t\n   ');
      expect(requirements).toEqual([]);
    });
  });

  describe('Malformed input', () => {
    it('should not crash on malformed content', () => {
      const text = `
### Requirement: Broken
No table here, just text

### Requirement: Also Broken
| incomplete | table |
`;
      
      // Should not throw
      expect(() => {
        parser.parseRequirements(text);
      }).not.toThrow();
      
      const requirements = parser.parseRequirements(text);
      expect(requirements).toHaveLength(2);
      // First has no scenarios (no table)
      expect(requirements[0].scenarios).toEqual([]);
      // Second might have scenarios depending on parsing
    });

    it('should handle requirements without scenarios', () => {
      const text = `
### Requirement: Just a requirement
No scenarios here.
`;
      
      const requirements = parser.parseRequirements(text);
      
      expect(requirements).toHaveLength(1);
      expect(requirements[0].scenarios).toEqual([]);
    });
  });
});
