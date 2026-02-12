import { describe, it, expect } from 'vitest';
import { ElicitationEngine } from '../engine.js';
import type { ElicitationFlow } from '../types.js';

const simpleFlow: ElicitationFlow = {
  id: 'test-flow',
  name: 'Test Flow',
  description: 'A simple test flow',
  steps: [
    {
      id: 'name',
      prompt: 'What is your name?',
      type: 'text',
      required: true,
    },
    {
      id: 'age',
      prompt: 'What is your age?',
      type: 'text',
      required: false,
    },
    {
      id: 'confirm',
      prompt: 'Are you sure?',
      type: 'confirm',
      required: true,
    },
  ],
};

const conditionalFlow: ElicitationFlow = {
  id: 'conditional-flow',
  name: 'Conditional Flow',
  description: 'Flow with conditional steps',
  steps: [
    {
      id: 'has_feature',
      prompt: 'Enable feature?',
      type: 'confirm',
      required: true,
    },
    {
      id: 'feature_name',
      prompt: 'What is the feature name?',
      type: 'text',
      required: true,
      condition: (answers) => answers.has_feature === true,
    },
    {
      id: 'done',
      prompt: 'All done',
      type: 'confirm',
      required: true,
    },
  ],
};

const validationFlow: ElicitationFlow = {
  id: 'validation-flow',
  name: 'Validation Flow',
  description: 'Flow with validation',
  steps: [
    {
      id: 'email',
      prompt: 'Enter email',
      type: 'text',
      required: true,
      validate: (value) => {
        if (typeof value !== 'string' || !value.includes('@')) {
          return 'Invalid email address';
        }
        return true;
      },
    },
  ],
};

describe('ElicitationEngine', () => {
  describe('basic navigation', () => {
    it('should start a flow and return first step', () => {
      const engine = new ElicitationEngine(simpleFlow);
      const firstStep = engine.start();

      expect(firstStep).toBeDefined();
      expect(firstStep.id).toBe('name');
      expect(engine.getCurrentStep()).toEqual(firstStep);
    });

    it('should navigate through all steps', () => {
      const engine = new ElicitationEngine(simpleFlow);
      
      const step1 = engine.start();
      expect(step1.id).toBe('name');

      const step2 = engine.answer('name', 'John');
      expect(step2).not.toBeNull();
      expect(step2?.id).toBe('age');

      const step3 = engine.answer('age', '30');
      expect(step3).not.toBeNull();
      expect(step3?.id).toBe('confirm');

      const step4 = engine.answer('confirm', true);
      expect(step4).toBeNull(); // Flow complete
      expect(engine.isComplete()).toBe(true);
    });

    it('should get current step', () => {
      const engine = new ElicitationEngine(simpleFlow);
      
      expect(engine.getCurrentStep()).toBeNull(); // Not started
      
      engine.start();
      expect(engine.getCurrentStep()?.id).toBe('name');
      
      engine.answer('name', 'John');
      expect(engine.getCurrentStep()?.id).toBe('age');
    });
  });

  describe('conditional branching', () => {
    it('should show conditional step when condition is true', () => {
      const engine = new ElicitationEngine(conditionalFlow);
      
      engine.start();
      const step2 = engine.answer('has_feature', true);
      
      expect(step2).not.toBeNull();
      expect(step2?.id).toBe('feature_name');
    });

    it('should skip conditional step when condition is false', () => {
      const engine = new ElicitationEngine(conditionalFlow);
      
      engine.start();
      const step2 = engine.answer('has_feature', false);
      
      expect(step2).not.toBeNull();
      expect(step2?.id).toBe('done'); // Skipped feature_name
      
      const result = engine.getResult();
      expect(result.metadata.skipped).toContain('feature_name');
    });
  });

  describe('validation', () => {
    it('should enforce required fields', () => {
      const engine = new ElicitationEngine(simpleFlow);
      engine.start();

      expect(() => engine.answer('name', '')).toThrow('required');
      expect(() => engine.answer('name', null)).toThrow('required');
    });

    it('should run custom validation', () => {
      const engine = new ElicitationEngine(validationFlow);
      engine.start();

      expect(() => engine.answer('email', 'invalid')).toThrow('Invalid email');
      expect(() => engine.answer('email', 'valid@example.com')).not.toThrow();
    });

    it('should not validate optional fields when empty', () => {
      const engine = new ElicitationEngine(simpleFlow);
      engine.start();
      
      engine.answer('name', 'John');
      expect(() => engine.answer('age', '')).not.toThrow();
    });
  });

  describe('skip behavior', () => {
    it('should allow skipping non-required steps', () => {
      const engine = new ElicitationEngine(simpleFlow);
      
      engine.start();
      engine.answer('name', 'John');
      
      const nextStep = engine.skip('age');
      expect(nextStep).not.toBeNull();
      expect(nextStep?.id).toBe('confirm');
      
      const result = engine.getResult();
      expect(result.metadata.skipped).toContain('age');
    });

    it('should not allow skipping required steps', () => {
      const engine = new ElicitationEngine(simpleFlow);
      engine.start();

      expect(() => engine.skip('name')).toThrow('Cannot skip required');
    });
  });

  describe('completion detection', () => {
    it('should detect when flow is complete', () => {
      const engine = new ElicitationEngine(simpleFlow);
      
      expect(engine.isComplete()).toBe(false);
      
      engine.start();
      expect(engine.isComplete()).toBe(false);
      
      engine.answer('name', 'John');
      expect(engine.isComplete()).toBe(false);
      
      engine.answer('age', '30');
      expect(engine.isComplete()).toBe(false);
      
      engine.answer('confirm', true);
      expect(engine.isComplete()).toBe(true);
    });

    it('should return null when flow is complete', () => {
      const engine = new ElicitationEngine(simpleFlow);
      
      engine.start();
      engine.answer('name', 'John');
      engine.answer('age', '30');
      const result = engine.answer('confirm', true);
      
      expect(result).toBeNull();
    });
  });

  describe('result generation', () => {
    it('should generate complete result', () => {
      const engine = new ElicitationEngine(simpleFlow);
      
      engine.start();
      engine.answer('name', 'John');
      engine.answer('age', '30');
      engine.answer('confirm', true);
      
      const result = engine.getResult();
      
      expect(result.flowId).toBe('test-flow');
      expect(result.answers).toEqual({
        name: 'John',
        age: '30',
        confirm: true,
      });
      expect(result.metadata.startedAt).toBeInstanceOf(Date);
      expect(result.metadata.completedAt).toBeInstanceOf(Date);
      expect(result.metadata.skipped).toEqual([]);
    });

    it('should track skipped steps in result', () => {
      const engine = new ElicitationEngine(simpleFlow);
      
      engine.start();
      engine.answer('name', 'John');
      engine.skip('age');
      engine.answer('confirm', true);
      
      const result = engine.getResult();
      expect(result.metadata.skipped).toContain('age');
    });

    it('should throw if result requested before start', () => {
      const engine = new ElicitationEngine(simpleFlow);
      expect(() => engine.getResult()).toThrow('has not been started');
    });
  });

  describe('error handling', () => {
    it('should throw on invalid step id', () => {
      const engine = new ElicitationEngine(simpleFlow);
      engine.start();

      expect(() => engine.answer('invalid', 'value')).toThrow('Step not found');
    });

    it('should throw when skipping invalid step id', () => {
      const engine = new ElicitationEngine(simpleFlow);
      engine.start();

      expect(() => engine.skip('invalid')).toThrow('Step not found');
    });
  });
});
