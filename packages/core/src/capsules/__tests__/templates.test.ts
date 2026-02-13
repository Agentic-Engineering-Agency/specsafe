import { describe, it, expect } from 'vitest';
import {
  USER_STORY_TEMPLATE,
  TECHNICAL_CONTEXT_TEMPLATE,
  BUSINESS_JUSTIFICATION_TEMPLATE,
  DISCOVERY_NOTE_TEMPLATE,
  BUILTIN_TEMPLATES,
  TEMPLATE_NAMES,
  getTemplate,
  listTemplates,
  isValidTemplateType,
  getTemplateChoices,
  formatContent,
  parseContent,
} from '../templates.js';

describe('Templates', () => {
  describe('BUILTIN_TEMPLATES', () => {
    it('should have all four template types', () => {
      expect(Object.keys(BUILTIN_TEMPLATES)).toHaveLength(4);
      expect(BUILTIN_TEMPLATES['user-story']).toBeDefined();
      expect(BUILTIN_TEMPLATES['technical-context']).toBeDefined();
      expect(BUILTIN_TEMPLATES['business-justification']).toBeDefined();
      expect(BUILTIN_TEMPLATES['discovery-note']).toBeDefined();
    });
  });

  describe('TEMPLATE_NAMES', () => {
    it('should have human-readable names for all types', () => {
      expect(TEMPLATE_NAMES['user-story']).toBe('User Story');
      expect(TEMPLATE_NAMES['technical-context']).toBe('Technical Context');
      expect(TEMPLATE_NAMES['business-justification']).toBe('Business Justification');
      expect(TEMPLATE_NAMES['discovery-note']).toBe('Discovery Note');
    });
  });

  describe('getTemplate', () => {
    it('should return template for valid type', () => {
      const template = getTemplate('user-story');
      expect(template).toBe(USER_STORY_TEMPLATE);
      expect(template.type).toBe('user-story');
      expect(template.fields).toHaveLength(3);
    });

    it('should throw for invalid type', () => {
      expect(() => getTemplate('invalid-type' as any)).toThrow('Unknown capsule type');
    });
  });

  describe('listTemplates', () => {
    it('should return all templates', () => {
      const templates = listTemplates();
      expect(templates).toHaveLength(4);
      expect(templates).toContain(USER_STORY_TEMPLATE);
      expect(templates).toContain(TECHNICAL_CONTEXT_TEMPLATE);
      expect(templates).toContain(BUSINESS_JUSTIFICATION_TEMPLATE);
      expect(templates).toContain(DISCOVERY_NOTE_TEMPLATE);
    });
  });

  describe('isValidTemplateType', () => {
    it('should return true for valid types', () => {
      expect(isValidTemplateType('user-story')).toBe(true);
      expect(isValidTemplateType('technical-context')).toBe(true);
      expect(isValidTemplateType('business-justification')).toBe(true);
      expect(isValidTemplateType('discovery-note')).toBe(true);
    });

    it('should return false for invalid types', () => {
      expect(isValidTemplateType('invalid')).toBe(false);
      expect(isValidTemplateType('')).toBe(false);
      expect(isValidTemplateType('random')).toBe(false);
    });
  });

  describe('getTemplateChoices', () => {
    it('should return choices for all templates', () => {
      const choices = getTemplateChoices();
      expect(choices).toHaveLength(4);
      expect(choices[0]).toHaveProperty('name');
      expect(choices[0]).toHaveProperty('value');
    });

    it('should have correct name-value mapping', () => {
      const choices = getTemplateChoices();
      const userStoryChoice = choices.find(c => c.value === 'user-story');
      expect(userStoryChoice?.name).toBe('User Story');
    });
  });

  describe('formatContent', () => {
    it('should format user story content', () => {
      const fields = {
        user: 'customer',
        goal: 'save my payment method',
        benefit: 'I can checkout faster next time',
      };
      const content = formatContent('user-story', fields);
      expect(content).toContain('**As a:**');
      expect(content).toContain('customer');
      expect(content).toContain('**I want:**');
      expect(content).toContain('save my payment method');
      expect(content).toContain('**so that:**');
      expect(content).toContain('I can checkout faster next time');
    });

    it('should skip empty fields', () => {
      const fields = {
        user: 'customer',
        goal: '',
        benefit: 'benefit here',
      };
      const content = formatContent('user-story', fields);
      expect(content).toContain('**As a:**');
      expect(content).not.toContain('**I want:**');
    });

    it('should format technical context', () => {
      const fields = {
        problem: 'API is slow',
        constraints: 'must use existing infrastructure',
        tradeoffs: 'caching vs real-time',
      };
      const content = formatContent('technical-context', fields);
      expect(content).toContain('**Problem:**');
      expect(content).toContain('API is slow');
      expect(content).toContain('**Constraints:**');
      expect(content).toContain('must use existing infrastructure');
      expect(content).toContain('**Trade-offs Considered:**');
      expect(content).toContain('caching vs real-time');
    });
  });

  describe('parseContent', () => {
    it('should parse formatted user story', () => {
      const content = `**As a:**
customer

**I want:**
save my payment method

**so that:**
I can checkout faster`;
      
      const fields = parseContent('user-story', content);
      expect(fields.user).toBe('customer');
      expect(fields.goal).toBe('save my payment method');
      expect(fields.benefit).toBe('I can checkout faster');
    });

    it('should return empty strings for missing fields', () => {
      const content = `**As a:**
customer`;
      
      const fields = parseContent('user-story', content);
      expect(fields.user).toBe('customer');
      expect(fields.goal).toBe('');
      expect(fields.benefit).toBe('');
    });
  });
});
