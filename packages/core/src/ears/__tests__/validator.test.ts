/**
 * EARS Validator Tests
 */

import { describe, it, expect } from 'vitest';
import { 
  validateRequirement, 
  validateRequirements, 
  getEARSScore, 
  meetsEARSThreshold,
  generateEARSReport 
} from '../validator.js';
import type { Spec } from '../../types.js';

describe('EARS Validator', () => {
  describe('validateRequirement', () => {
    it('should validate compliant ubiquitous requirement', () => {
      const result = validateRequirement('The system shall encrypt all data');
      
      expect(result.isCompliant).toBe(true);
      expect(result.earsRequirement).toBeDefined();
      expect(result.earsRequirement!.type).toBe('ubiquitous');
      expect(result.issues).toHaveLength(0);
    });

    it('should validate compliant event-driven requirement', () => {
      const result = validateRequirement('When user submits form, the system shall validate inputs');
      
      expect(result.isCompliant).toBe(true);
      expect(result.earsRequirement!.type).toBe('event');
      expect(result.issues).toHaveLength(0);
    });

    it('should detect missing modal verb', () => {
      const result = validateRequirement('The system encrypts data');
      
      expect(result.isCompliant).toBe(false);
      expect(result.issues.some(i => i.includes('modal verb'))).toBe(true);
    });

    it('should detect ambiguous words', () => {
      const result = validateRequirement('The system should maybe validate inputs');
      
      expect(result.isCompliant).toBe(false);
      expect(result.issues.some(i => i.includes('should'))).toBe(true);
      expect(result.issues.some(i => i.includes('maybe'))).toBe(true);
    });

    it('should detect vague terms', () => {
      const result = validateRequirement('The system shall provide appropriate response');
      
      expect(result.isCompliant).toBe(false);
      expect(result.issues.some(i => i.includes('appropriate'))).toBe(true);
    });

    it('should detect too short requirements', () => {
      const result = validateRequirement('System shall work');
      
      expect(result.issues.some(i => i.includes('too short'))).toBe(true);
    });

    it('should detect too long requirements', () => {
      const longText = 'The system shall ' + 'do something really amazing and incredible '.repeat(10);
      const result = validateRequirement(longText);
      
      expect(result.issues.some(i => i.includes('too long'))).toBe(true);
    });

    it('should provide suggestions for non-EARS requirements', () => {
      const result = validateRequirement('System processes data quickly');
      
      expect(result.isCompliant).toBe(false);
      expect(result.suggestion).toBeDefined();
      expect(result.suggestion).toContain('EARS');
    });

    it('should suggest event-driven for implicit triggers', () => {
      const result = validateRequirement('After user login, process the data');
      
      expect(result.suggestion).toBeDefined();
      expect(result.suggestion!.toLowerCase()).toContain('event');
    });

    it('should suggest state-driven for state mentions', () => {
      const result = validateRequirement('During maintenance mode, block requests');
      
      expect(result.suggestion).toBeDefined();
      expect(result.suggestion!.toLowerCase()).toContain('state');
    });

    it('should suggest unwanted for error handling', () => {
      const result = validateRequirement('Handle invalid input errors');
      
      expect(result.suggestion).toBeDefined();
      expect(result.suggestion!.toLowerCase()).toContain('unwanted');
    });
  });

  describe('validateRequirements', () => {
    it('should validate all requirements in spec', () => {
      const spec: Spec = {
        id: 'SPEC-001',
        name: 'Test Spec',
        description: 'Test',
        stage: 'spec',
        createdAt: new Date(),
        updatedAt: new Date(),
        requirements: [
          { 
            id: 'REQ-1', 
            text: 'The system shall encrypt data', 
            priority: 'P0', 
            scenarios: [] 
          },
          { 
            id: 'REQ-2', 
            text: 'When user logs in, the system shall create session', 
            priority: 'P0', 
            scenarios: [] 
          },
          { 
            id: 'REQ-3', 
            text: 'System should work well', 
            priority: 'P1', 
            scenarios: [] 
          }
        ],
        testFiles: [],
        implementationFiles: [],
        metadata: {
          author: 'Test',
          project: 'Test',
          tags: []
        }
      };
      
      const result = validateRequirements(spec);
      
      expect(result.totalRequirements).toBe(3);
      expect(result.compliantCount).toBe(2);
      expect(result.score).toBeGreaterThan(50);
      expect(result.requirements).toHaveLength(3);
      expect(result.summary.length).toBeGreaterThan(0);
    });

    it('should calculate correct score', () => {
      const spec: Spec = {
        id: 'SPEC-002',
        name: 'Test Spec',
        description: 'Test',
        stage: 'spec',
        createdAt: new Date(),
        updatedAt: new Date(),
        requirements: [
          { id: 'REQ-1', text: 'The system shall encrypt data', priority: 'P0', scenarios: [] },
          { id: 'REQ-2', text: 'When user logs in, the system shall create session', priority: 'P0', scenarios: [] },
          { id: 'REQ-3', text: 'While connected, the system shall sync data', priority: 'P0', scenarios: [] },
          { id: 'REQ-4', text: 'Where admin, the system shall allow config', priority: 'P1', scenarios: [] }
        ],
        testFiles: [],
        implementationFiles: [],
        metadata: { author: 'Test', project: 'Test', tags: [] }
      };
      
      const result = validateRequirements(spec);
      
      expect(result.score).toBe(100);
      expect(result.compliantCount).toBe(4);
    });

    it('should provide recommendation based on score', () => {
      const highScoreSpec: Spec = {
        id: 'SPEC-003',
        name: 'High Score',
        description: 'Test',
        stage: 'spec',
        createdAt: new Date(),
        updatedAt: new Date(),
        requirements: [
          { id: 'REQ-1', text: 'The system shall encrypt data', priority: 'P0', scenarios: [] },
          { id: 'REQ-2', text: 'When user logs in, the system shall create session', priority: 'P0', scenarios: [] }
        ],
        testFiles: [],
        implementationFiles: [],
        metadata: { author: 'Test', project: 'Test', tags: [] }
      };
      
      const result = validateRequirements(highScoreSpec);
      
      expect(result.recommendation).toContain('✅');
      expect(result.score).toBeGreaterThanOrEqual(90);
    });

    it('should group requirements by EARS type', () => {
      const spec: Spec = {
        id: 'SPEC-004',
        name: 'Mixed Types',
        description: 'Test',
        stage: 'spec',
        createdAt: new Date(),
        updatedAt: new Date(),
        requirements: [
          { id: 'REQ-1', text: 'The system shall encrypt data', priority: 'P0', scenarios: [] },
          { id: 'REQ-2', text: 'The system shall validate inputs', priority: 'P0', scenarios: [] },
          { id: 'REQ-3', text: 'When user logs in, the system shall create session', priority: 'P0', scenarios: [] },
          { id: 'REQ-4', text: 'While connected, the system shall sync data', priority: 'P0', scenarios: [] }
        ],
        testFiles: [],
        implementationFiles: [],
        metadata: { author: 'Test', project: 'Test', tags: [] }
      };
      
      const result = validateRequirements(spec);
      
      const ubiquitousCount = result.summary.find(s => s.type === 'ubiquitous');
      const eventCount = result.summary.find(s => s.type === 'event');
      const stateCount = result.summary.find(s => s.type === 'state');
      
      expect(ubiquitousCount?.count).toBe(2);
      expect(eventCount?.count).toBe(1);
      expect(stateCount?.count).toBe(1);
    });
  });

  describe('getEARSScore', () => {
    it('should return score for spec', () => {
      const spec: Spec = {
        id: 'SPEC-005',
        name: 'Score Test',
        description: 'Test',
        stage: 'spec',
        createdAt: new Date(),
        updatedAt: new Date(),
        requirements: [
          { id: 'REQ-1', text: 'The system shall work', priority: 'P0', scenarios: [] },
          { id: 'REQ-2', text: 'When user acts, the system shall respond', priority: 'P0', scenarios: [] }
        ],
        testFiles: [],
        implementationFiles: [],
        metadata: { author: 'Test', project: 'Test', tags: [] }
      };
      
      const score = getEARSScore(spec);
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('meetsEARSThreshold', () => {
    it('should check if spec meets threshold', () => {
      const goodSpec: Spec = {
        id: 'SPEC-006',
        name: 'Good Spec',
        description: 'Test',
        stage: 'spec',
        createdAt: new Date(),
        updatedAt: new Date(),
        requirements: [
          { id: 'REQ-1', text: 'The system shall encrypt data', priority: 'P0', scenarios: [] },
          { id: 'REQ-2', text: 'When user logs in, the system shall create session', priority: 'P0', scenarios: [] }
        ],
        testFiles: [],
        implementationFiles: [],
        metadata: { author: 'Test', project: 'Test', tags: [] }
      };
      
      expect(meetsEARSThreshold(goodSpec, 90)).toBe(true);
      expect(meetsEARSThreshold(goodSpec, 100)).toBe(true);
    });

    it('should use default threshold of 80', () => {
      const spec: Spec = {
        id: 'SPEC-007',
        name: 'Default Threshold',
        description: 'Test',
        stage: 'spec',
        createdAt: new Date(),
        updatedAt: new Date(),
        requirements: [
          { id: 'REQ-1', text: 'The system shall work', priority: 'P0', scenarios: [] }
        ],
        testFiles: [],
        implementationFiles: [],
        metadata: { author: 'Test', project: 'Test', tags: [] }
      };
      
      const result = meetsEARSThreshold(spec);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('generateEARSReport', () => {
    it('should generate markdown report', () => {
      const spec: Spec = {
        id: 'SPEC-008',
        name: 'Report Test',
        description: 'Test',
        stage: 'spec',
        createdAt: new Date(),
        updatedAt: new Date(),
        requirements: [
          { id: 'REQ-1', text: 'The system shall encrypt data', priority: 'P0', scenarios: [] },
          { id: 'REQ-2', text: 'System works', priority: 'P1', scenarios: [] }
        ],
        testFiles: [],
        implementationFiles: [],
        metadata: { author: 'Test Author', project: 'Test Project', tags: [] }
      };
      
      const report = generateEARSReport(spec);
      
      expect(report).toContain('# EARS Compliance Report');
      expect(report).toContain('SPEC-008');
      expect(report).toContain('Report Test');
      expect(report).toContain('Overall Score');
      expect(report).toContain('Total Requirements');
      expect(report).toContain('Detailed Analysis');
      expect(report).toContain('encrypt data');
    });

    it('should include requirement details in report', () => {
      const spec: Spec = {
        id: 'SPEC-009',
        name: 'Details Test',
        description: 'Test',
        stage: 'spec',
        createdAt: new Date(),
        updatedAt: new Date(),
        requirements: [
          { id: 'REQ-1', text: 'When user submits form, the system shall validate inputs', priority: 'P0', scenarios: [] }
        ],
        testFiles: [],
        implementationFiles: [],
        metadata: { author: 'Test', project: 'Test', tags: [] }
      };
      
      const report = generateEARSReport(spec);
      
      expect(report).toContain('EARS Type');
      expect(report).toContain('event');
      expect(report).toContain('Event:');
      expect(report).toContain('Action:');
    });
  });
});
