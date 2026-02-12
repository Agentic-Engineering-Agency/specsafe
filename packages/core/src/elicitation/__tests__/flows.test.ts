import { describe, it, expect } from 'vitest';
import { quickFlow, fullFlow, earsFlow } from '../flows.js';
import type { ElicitationFlow } from '../types.js';

function validateFlowStructure(flow: ElicitationFlow): void {
  expect(flow).toBeDefined();
  expect(flow.id).toBeTruthy();
  expect(flow.name).toBeTruthy();
  expect(flow.description).toBeTruthy();
  expect(Array.isArray(flow.steps)).toBe(true);
  expect(flow.steps.length).toBeGreaterThan(0);
}

function validateSteps(flow: ElicitationFlow): void {
  const stepIds = new Set<string>();

  for (const step of flow.steps) {
    // Each step must have an ID
    expect(step.id).toBeTruthy();
    
    // Step IDs must be unique
    expect(stepIds.has(step.id)).toBe(false);
    stepIds.add(step.id);
    
    // Each step must have a prompt
    expect(step.prompt).toBeTruthy();
    
    // Each step must have a valid type
    expect(['text', 'choice', 'multi-choice', 'confirm', 'conditional']).toContain(step.type);
    
    // Choice types must have choices
    if (step.type === 'choice' || step.type === 'multi-choice') {
      expect(Array.isArray(step.choices)).toBe(true);
      expect(step.choices!.length).toBeGreaterThan(0);
    }
    
    // Validate required field
    if (step.required !== undefined) {
      expect(typeof step.required).toBe('boolean');
    }
  }
}

describe('Built-in Flows', () => {
  describe('quickFlow', () => {
    it('should have valid structure', () => {
      validateFlowStructure(quickFlow);
      expect(quickFlow.id).toBe('quick');
    });

    it('should have exactly 5 steps', () => {
      expect(quickFlow.steps.length).toBe(5);
    });

    it('should have all required fields', () => {
      validateSteps(quickFlow);
    });

    it('should include essential fields', () => {
      const stepIds = quickFlow.steps.map(s => s.id);
      
      expect(stepIds).toContain('name');
      expect(stepIds).toContain('description');
      expect(stepIds).toContain('type');
      expect(stepIds).toContain('priority');
      expect(stepIds).toContain('requirements');
    });

    it('should have type choices', () => {
      const typeStep = quickFlow.steps.find(s => s.id === 'type');
      expect(typeStep).toBeDefined();
      expect(typeStep?.type).toBe('choice');
      expect(typeStep?.choices).toContain('feature');
      expect(typeStep?.choices).toContain('bugfix');
      expect(typeStep?.choices).toContain('migration');
      expect(typeStep?.choices).toContain('security');
    });

    it('should have priority choices', () => {
      const priorityStep = quickFlow.steps.find(s => s.id === 'priority');
      expect(priorityStep).toBeDefined();
      expect(priorityStep?.type).toBe('choice');
      expect(priorityStep?.choices).toContain('critical');
      expect(priorityStep?.choices).toContain('high');
      expect(priorityStep?.choices).toContain('medium');
      expect(priorityStep?.choices).toContain('low');
    });

    it('should have validation on name field', () => {
      const nameStep = quickFlow.steps.find(s => s.id === 'name');
      expect(nameStep?.validate).toBeDefined();
      expect(nameStep?.validate!('')).not.toBe(true);
      expect(nameStep?.validate!('ab')).not.toBe(true); // Too short
      expect(nameStep?.validate!('Valid Name')).toBe(true);
    });
  });

  describe('fullFlow', () => {
    it('should have valid structure', () => {
      validateFlowStructure(fullFlow);
      expect(fullFlow.id).toBe('full');
    });

    it('should have at least 15 steps', () => {
      expect(fullFlow.steps.length).toBeGreaterThanOrEqual(15);
    });

    it('should have all required fields', () => {
      validateSteps(fullFlow);
    });

    it('should include comprehensive fields', () => {
      const stepIds = fullFlow.steps.map(s => s.id);
      
      expect(stepIds).toContain('name');
      expect(stepIds).toContain('description');
      expect(stepIds).toContain('type');
      expect(stepIds).toContain('priority');
      expect(stepIds).toContain('scope');
      expect(stepIds).toContain('stakeholders');
      expect(stepIds).toContain('requirements');
      expect(stepIds).toContain('testing_strategy');
      expect(stepIds).toContain('acceptance_criteria');
    });

    it('should have conditional security step', () => {
      const hasSecurityStep = fullFlow.steps.find(s => s.id === 'has_security');
      const securityStep = fullFlow.steps.find(s => s.id === 'security_considerations');
      
      expect(hasSecurityStep).toBeDefined();
      expect(hasSecurityStep?.type).toBe('confirm');
      
      expect(securityStep).toBeDefined();
      expect(securityStep?.condition).toBeDefined();
      
      // Test condition
      expect(securityStep?.condition!({ has_security: true })).toBe(true);
      expect(securityStep?.condition!({ has_security: false })).toBe(false);
    });

    it('should have conditional performance step', () => {
      const hasPerformanceStep = fullFlow.steps.find(s => s.id === 'has_performance');
      const performanceStep = fullFlow.steps.find(s => s.id === 'performance_requirements');
      
      expect(hasPerformanceStep).toBeDefined();
      expect(hasPerformanceStep?.type).toBe('confirm');
      
      expect(performanceStep).toBeDefined();
      expect(performanceStep?.condition).toBeDefined();
      
      // Test condition
      expect(performanceStep?.condition!({ has_performance: true })).toBe(true);
      expect(performanceStep?.condition!({ has_performance: false })).toBe(false);
    });
  });

  describe('earsFlow', () => {
    it('should have valid structure', () => {
      validateFlowStructure(earsFlow);
      expect(earsFlow.id).toBe('ears');
    });

    it('should have all required fields', () => {
      validateSteps(earsFlow);
    });

    it('should include EARS-specific fields', () => {
      const stepIds = earsFlow.steps.map(s => s.id);
      
      expect(stepIds).toContain('name');
      expect(stepIds).toContain('description');
      expect(stepIds).toContain('req_count');
    });

    it('should have requirement count validation', () => {
      const reqCountStep = earsFlow.steps.find(s => s.id === 'req_count');
      expect(reqCountStep?.validate).toBeDefined();
      
      // Test validation
      expect(reqCountStep?.validate!('0')).not.toBe(true);
      expect(reqCountStep?.validate!('25')).not.toBe(true); // Too many
      expect(reqCountStep?.validate!('abc')).not.toBe(true); // Not a number
      expect(reqCountStep?.validate!('5')).toBe(true);
    });

    it('should have EARS type choices', () => {
      const typeStep = earsFlow.steps.find(s => s.id === 'req_1_type');
      expect(typeStep).toBeDefined();
      expect(typeStep?.type).toBe('choice');
      expect(typeStep?.choices).toContain('ubiquitous');
      expect(typeStep?.choices).toContain('event');
      expect(typeStep?.choices).toContain('state');
      expect(typeStep?.choices).toContain('optional');
      expect(typeStep?.choices).toContain('unwanted');
    });

    it('should have conditional trigger step for event type', () => {
      const triggerStep = earsFlow.steps.find(s => s.id === 'req_1_trigger');
      expect(triggerStep).toBeDefined();
      expect(triggerStep?.condition).toBeDefined();
      
      // Test condition
      expect(triggerStep?.condition!({ req_1_type: 'event' })).toBe(true);
      expect(triggerStep?.condition!({ req_1_type: 'ubiquitous' })).toBe(false);
    });

    it('should have conditional precondition step for state/optional types', () => {
      const preconditionStep = earsFlow.steps.find(s => s.id === 'req_1_precondition');
      expect(preconditionStep).toBeDefined();
      expect(preconditionStep?.condition).toBeDefined();
      
      // Test condition
      expect(preconditionStep?.condition!({ req_1_type: 'state' })).toBe(true);
      expect(preconditionStep?.condition!({ req_1_type: 'optional' })).toBe(true);
      expect(preconditionStep?.condition!({ req_1_type: 'event' })).toBe(false);
      expect(preconditionStep?.condition!({ req_1_type: 'ubiquitous' })).toBe(false);
    });

    it('should support multiple requirements', () => {
      const stepIds = earsFlow.steps.map(s => s.id);
      
      // Should have steps for at least 3 requirements
      expect(stepIds).toContain('req_1_type');
      expect(stepIds).toContain('req_1_response');
      expect(stepIds).toContain('req_2_type');
      expect(stepIds).toContain('req_2_response');
      expect(stepIds).toContain('req_3_type');
      expect(stepIds).toContain('req_3_response');
    });
  });
});
