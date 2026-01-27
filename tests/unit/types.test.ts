import { describe, it, expect } from 'vitest';
import { DEFAULT_CONFIG } from '../../src/types.js';

describe('Types', () => {
  describe('DEFAULT_CONFIG', () => {
    it('should have all required sections', () => {
      expect(DEFAULT_CONFIG).toHaveProperty('specsafe');
      expect(DEFAULT_CONFIG).toHaveProperty('workflow');
      expect(DEFAULT_CONFIG).toHaveProperty('specs');
      expect(DEFAULT_CONFIG).toHaveProperty('tests');
      expect(DEFAULT_CONFIG).toHaveProperty('qa');
      expect(DEFAULT_CONFIG).toHaveProperty('complete');
      expect(DEFAULT_CONFIG).toHaveProperty('archive');
      expect(DEFAULT_CONFIG).toHaveProperty('tracking');
      expect(DEFAULT_CONFIG).toHaveProperty('aiTools');
    });

    it('should enforce TDD by default', () => {
      expect(DEFAULT_CONFIG.workflow.enforceTdd).toBe(true);
    });

    it('should have default test framework', () => {
      expect(DEFAULT_CONFIG.tests.framework).toBe('vitest');
    });

    it('should have coverage threshold', () => {
      expect(DEFAULT_CONFIG.tests.coverageThreshold).toBe(80);
    });

    it('should have QA pass threshold', () => {
      expect(DEFAULT_CONFIG.qa.passThreshold).toBe(80);
    });

    it('should have correct directory structure', () => {
      expect(DEFAULT_CONFIG.specs.directories.active).toBe('specs/active');
      expect(DEFAULT_CONFIG.specs.directories.completed).toBe('specs/completed');
      expect(DEFAULT_CONFIG.specs.directories.archive).toBe('specs/archive');
    });

    it('should have normative language requirements', () => {
      expect(DEFAULT_CONFIG.specs.normativeLanguage).toContain('SHALL');
      expect(DEFAULT_CONFIG.specs.normativeLanguage).toContain('MUST');
      expect(DEFAULT_CONFIG.specs.normativeLanguage).toContain('SHALL NOT');
      expect(DEFAULT_CONFIG.specs.normativeLanguage).toContain('MUST NOT');
    });

    it('should require human approval by default', () => {
      expect(DEFAULT_CONFIG.workflow.requireHumanApproval).toBe(true);
    });

    it('should have tracking enabled', () => {
      expect(DEFAULT_CONFIG.tracking.autoUpdate).toBe(true);
      expect(DEFAULT_CONFIG.tracking.trackTime).toBe(true);
      expect(DEFAULT_CONFIG.tracking.trackDecisions).toBe(true);
    });

    it('should have AI tool preferences', () => {
      expect(DEFAULT_CONFIG.aiTools.primary).toBe('claude-code');
      expect(DEFAULT_CONFIG.aiTools.secondary).toBe('opencode');
    });

    it('should have model preferences', () => {
      expect(DEFAULT_CONFIG.aiTools.modelPreference).toHaveProperty('specReview');
      expect(DEFAULT_CONFIG.aiTools.modelPreference).toHaveProperty('testGeneration');
      expect(DEFAULT_CONFIG.aiTools.modelPreference).toHaveProperty('codeImplementation');
      expect(DEFAULT_CONFIG.aiTools.modelPreference).toHaveProperty('qaReview');
    });
  });
});
