/**
 * Workflow Tests
 * Tests for the SpecSafe Workflow Engine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Workflow } from '../workflow.js';
import type { Spec, QAReport } from '../types.js';

describe('Workflow', () => {
  let workflow: Workflow;

  beforeEach(() => {
    workflow = new Workflow();
  });

  describe('createSpec', () => {
    it('should create a spec with correct defaults', () => {
      const spec = workflow.createSpec(
        'SPEC-001',
        'Test Spec',
        'A test specification',
        'John Doe',
        'TestProject'
      );

      expect(spec.id).toBe('SPEC-001');
      expect(spec.name).toBe('Test Spec');
      expect(spec.description).toBe('A test specification');
      expect(spec.stage).toBe('spec');
      expect(spec.requirements).toEqual([]);
      expect(spec.testFiles).toEqual([]);
      expect(spec.implementationFiles).toEqual([]);
      expect(spec.metadata.author).toBe('John Doe');
      expect(spec.metadata.project).toBe('TestProject');
      expect(spec.metadata.tags).toEqual([]);
      expect(spec.createdAt).toBeInstanceOf(Date);
      expect(spec.updatedAt).toBeInstanceOf(Date);
    });

    it('should reject duplicate IDs', () => {
      workflow.createSpec('SPEC-001', 'First', 'First spec', 'John', 'Project');
      
      expect(() => {
        workflow.createSpec('SPEC-001', 'Second', 'Second spec', 'Jane', 'Project');
      }).toThrow('Spec with ID SPEC-001 already exists');
    });
  });

  describe('Stage Transitions', () => {
    it('should allow spec→test→code→qa→complete happy path', () => {
      const spec = workflow.createSpec('SPEC-001', 'Test', 'Test spec', 'John', 'Project');
      
      // Add requirements for test stage
      spec.requirements = [{ id: 'REQ-1', text: 'Requirement 1', priority: 'P1', scenarios: [] }];
      workflow.moveToTest('SPEC-001');
      expect(workflow.getSpec('SPEC-001')?.stage).toBe('test');
      
      // Add test files for code stage
      spec.testFiles = ['test.spec.ts'];
      workflow.moveToCode('SPEC-001');
      expect(workflow.getSpec('SPEC-001')?.stage).toBe('code');
      
      // Add implementation for QA stage
      spec.implementationFiles = ['impl.ts'];
      workflow.moveToQA('SPEC-001');
      expect(workflow.getSpec('SPEC-001')?.stage).toBe('qa');
      
      // Complete with GO report
      const qaReport: QAReport = {
        id: 'QA-001',
        specId: 'SPEC-001',
        timestamp: new Date(),
        testResults: [],
        coverage: { statements: 100, branches: 100, functions: 100, lines: 100 },
        recommendation: 'GO',
        issues: [],
        notes: 'All good'
      };
      workflow.moveToComplete('SPEC-001', qaReport);
      expect(workflow.getSpec('SPEC-001')?.stage).toBe('complete');
    });

    it('should reject spec→code transition (skipping test)', () => {
      workflow.createSpec('SPEC-001', 'Test', 'Test spec', 'John', 'Project');
      
      expect(() => {
        workflow.moveToCode('SPEC-001');
      }).toThrow('Cannot move to CODE from spec');
    });

    it('should reject test→complete transition (skipping code/qa)', () => {
      const spec = workflow.createSpec('SPEC-001', 'Test', 'Test spec', 'John', 'Project');
      spec.requirements = [{ id: 'REQ-1', text: 'Req 1', priority: 'P1', scenarios: [] }];
      workflow.moveToTest('SPEC-001');
      
      const qaReport: QAReport = {
        id: 'QA-001',
        specId: 'SPEC-001',
        timestamp: new Date(),
        testResults: [],
        coverage: { statements: 100, branches: 100, functions: 100, lines: 100 },
        recommendation: 'GO',
        issues: [],
        notes: ''
      };
      
      expect(() => {
        workflow.moveToComplete('SPEC-001', qaReport);
      }).toThrow('Cannot move to COMPLETE from test');
    });
  });

  describe('moveToTest', () => {
    it('should require requirements to move to test', () => {
      workflow.createSpec('SPEC-001', 'Test', 'Test spec', 'John', 'Project');
      
      expect(() => {
        workflow.moveToTest('SPEC-001');
      }).toThrow('Cannot move to TEST: No requirements defined');
    });

    it('should allow transition when requirements exist', () => {
      const spec = workflow.createSpec('SPEC-001', 'Test', 'Test spec', 'John', 'Project');
      spec.requirements = [{ id: 'REQ-1', text: 'Requirement 1', priority: 'P1', scenarios: [] }];
      
      const result = workflow.moveToTest('SPEC-001');
      expect(result.stage).toBe('test');
    });
  });

  describe('moveToCode', () => {
    it('should require test files to move to code', () => {
      const spec = workflow.createSpec('SPEC-001', 'Test', 'Test spec', 'John', 'Project');
      spec.requirements = [{ id: 'REQ-1', text: 'Req 1', priority: 'P1', scenarios: [] }];
      workflow.moveToTest('SPEC-001');
      
      expect(() => {
        workflow.moveToCode('SPEC-001');
      }).toThrow('Cannot move to CODE: No test files generated');
    });
  });

  describe('moveToQA', () => {
    it('should require implementation files to move to QA', () => {
      const spec = workflow.createSpec('SPEC-001', 'Test', 'Test spec', 'John', 'Project');
      spec.requirements = [{ id: 'REQ-1', text: 'Req 1', priority: 'P1', scenarios: [] }];
      spec.testFiles = ['test.spec.ts'];
      workflow.moveToTest('SPEC-001');
      workflow.moveToCode('SPEC-001');
      
      expect(() => {
        workflow.moveToQA('SPEC-001');
      }).toThrow('Cannot move to QA: No implementation files');
    });
  });

  describe('moveToComplete', () => {
    it('should require GO QA report to complete', () => {
      const spec = workflow.createSpec('SPEC-001', 'Test', 'Test spec', 'John', 'Project');
      spec.requirements = [{ id: 'REQ-1', text: 'Req 1', priority: 'P1', scenarios: [] }];
      spec.testFiles = ['test.spec.ts'];
      spec.implementationFiles = ['impl.ts'];
      workflow.moveToTest('SPEC-001');
      workflow.moveToCode('SPEC-001');
      workflow.moveToQA('SPEC-001');
      
      const noGoReport: QAReport = {
        id: 'QA-001',
        specId: 'SPEC-001',
        timestamp: new Date(),
        testResults: [],
        coverage: { statements: 80, branches: 70, functions: 90, lines: 85 },
        recommendation: 'NO-GO',
        issues: [{ severity: 'high', description: 'Coverage too low' }],
        notes: 'Need more tests'
      };
      
      expect(() => {
        workflow.moveToComplete('SPEC-001', noGoReport);
      }).toThrow('Cannot complete: QA report recommends NO-GO');
    });

    it('should validate QA report specId matches', () => {
      const spec = workflow.createSpec('SPEC-001', 'Test', 'Test spec', 'John', 'Project');
      spec.requirements = [{ id: 'REQ-1', text: 'Req 1', priority: 'P1', scenarios: [] }];
      spec.testFiles = ['test.spec.ts'];
      spec.implementationFiles = ['impl.ts'];
      workflow.moveToTest('SPEC-001');
      workflow.moveToCode('SPEC-001');
      workflow.moveToQA('SPEC-001');
      
      const wrongReport: QAReport = {
        id: 'QA-001',
        specId: 'SPEC-999', // Wrong spec ID
        timestamp: new Date(),
        testResults: [],
        coverage: { statements: 100, branches: 100, functions: 100, lines: 100 },
        recommendation: 'GO',
        issues: [],
        notes: ''
      };
      
      expect(() => {
        workflow.moveToComplete('SPEC-001', wrongReport);
      }).toThrow('QA report spec ID (SPEC-999) does not match target spec (SPEC-001)');
    });
  });

  describe('getSpec', () => {
    it('should return undefined for missing ID', () => {
      expect(workflow.getSpec('NONEXISTENT')).toBeUndefined();
    });

    it('should return spec for existing ID', () => {
      workflow.createSpec('SPEC-001', 'Test', 'Test spec', 'John', 'Project');
      const spec = workflow.getSpec('SPEC-001');
      expect(spec).toBeDefined();
      expect(spec?.id).toBe('SPEC-001');
    });
  });

  describe('loadSpec', () => {
    it('should load external spec into internal map', () => {
      const externalSpec: Spec = {
        id: 'SPEC-LOADED',
        name: 'Loaded Spec',
        description: 'Loaded from external',
        stage: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
        requirements: [{ id: 'REQ-1', text: 'Req', priority: 'P0', scenarios: [] }],
        testFiles: ['test.ts'],
        implementationFiles: [],
        metadata: { author: 'Loader', project: 'Test', tags: ['loaded'] }
      };
      
      workflow.loadSpec(externalSpec);
      const loaded = workflow.getSpec('SPEC-LOADED');
      expect(loaded).toBeDefined();
      expect(loaded?.name).toBe('Loaded Spec');
      expect(loaded?.stage).toBe('test');
    });
  });

  describe('getAllSpecs', () => {
    it('should return all loaded specs', () => {
      workflow.createSpec('SPEC-001', 'First', 'First spec', 'John', 'Project');
      workflow.createSpec('SPEC-002', 'Second', 'Second spec', 'Jane', 'Project');
      
      const allSpecs = workflow.getAllSpecs();
      expect(allSpecs).toHaveLength(2);
      expect(allSpecs.map(s => s.id)).toContain('SPEC-001');
      expect(allSpecs.map(s => s.id)).toContain('SPEC-002');
    });

    it('should return empty array when no specs', () => {
      expect(workflow.getAllSpecs()).toEqual([]);
    });
  });

  describe('archiveSpec', () => {
    it('should move complete spec to archived', () => {
      const spec = workflow.createSpec('SPEC-001', 'Test', 'Test spec', 'John', 'Project');
      spec.requirements = [{ id: 'REQ-1', text: 'Req 1', priority: 'P1', scenarios: [] }];
      spec.testFiles = ['test.spec.ts'];
      spec.implementationFiles = ['impl.ts'];
      workflow.moveToTest('SPEC-001');
      workflow.moveToCode('SPEC-001');
      workflow.moveToQA('SPEC-001');
      
      const qaReport: QAReport = {
        id: 'QA-001',
        specId: 'SPEC-001',
        timestamp: new Date(),
        testResults: [],
        coverage: { statements: 100, branches: 100, functions: 100, lines: 100 },
        recommendation: 'GO',
        issues: [],
        notes: ''
      };
      workflow.moveToComplete('SPEC-001', qaReport);
      
      workflow.archiveSpec('SPEC-001');
      expect(workflow.getSpec('SPEC-001')?.stage).toBe('archived');
    });

    it('should reject archiving non-complete specs', () => {
      workflow.createSpec('SPEC-001', 'Test', 'Test spec', 'John', 'Project');
      
      expect(() => {
        workflow.archiveSpec('SPEC-001');
      }).toThrow('Cannot archive spec in spec stage');
    });
  });

  describe('canTransition', () => {
    it('should return valid for allowed transitions', () => {
      const spec = workflow.createSpec('SPEC-001', 'Test', 'Test spec', 'John', 'Project');
      spec.requirements = [{ id: 'REQ-1', text: 'Req 1', priority: 'P1', scenarios: [] }];
      
      const result = workflow.canTransition('SPEC-001', 'test');
      expect(result.valid).toBe(true);
    });

    it('should return invalid for disallowed transitions', () => {
      workflow.createSpec('SPEC-001', 'Test', 'Test spec', 'John', 'Project');
      
      const result = workflow.canTransition('SPEC-001', 'complete');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Cannot transition');
    });

    it('should return invalid for missing requirements on test transition', () => {
      workflow.createSpec('SPEC-001', 'Test', 'Test spec', 'John', 'Project');
      
      const result = workflow.canTransition('SPEC-001', 'test');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('No requirements defined');
    });
  });
});
