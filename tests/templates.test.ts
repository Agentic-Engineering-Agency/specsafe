import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const TEMPLATES_DIR = path.resolve(__dirname, '../canonical/templates');

describe('Templates', () => {
  describe('spec-template.md', () => {
    const filePath = path.join(TEMPLATES_DIR, 'spec-template.md');

    it('exists', () => {
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('contains "## Requirements" or "## 3. Requirements"', () => {
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toMatch(/## .*Requirements/);
    });

    it('contains "## Scenarios" or "## 4. Scenarios"', () => {
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toMatch(/## .*Scenarios/);
    });

    it('contains SPEC-YYYYMMDD placeholder', () => {
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('SPEC-YYYYMMDD');
    });
  });

  describe('project-state-template.md', () => {
    const filePath = path.join(TEMPLATES_DIR, 'project-state-template.md');

    it('exists', () => {
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('contains "## Active Specs"', () => {
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('## Active Specs');
    });

    it('contains "## Completed Specs"', () => {
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('## Completed Specs');
    });

    it('contains "## Metrics"', () => {
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('## Metrics');
    });
  });

  describe('qa-report-template.md', () => {
    const filePath = path.join(TEMPLATES_DIR, 'qa-report-template.md');

    it('exists', () => {
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('contains "## Summary"', () => {
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('## Summary');
    });

    it('contains "## Recommendation"', () => {
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('## Recommendation');
    });
  });

  describe('specsafe-config-template.json', () => {
    const filePath = path.join(TEMPLATES_DIR, 'specsafe-config-template.json');

    it('exists', () => {
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('is valid JSON', () => {
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('has required keys', () => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const config = JSON.parse(content);
      expect(config).toHaveProperty('project');
      expect(config).toHaveProperty('version');
      expect(config).toHaveProperty('tools');
      expect(config).toHaveProperty('testFramework');
      expect(config).toHaveProperty('testCommand');
      expect(config).toHaveProperty('language');
      expect(config).toHaveProperty('specsafeVersion');
    });
  });
});
