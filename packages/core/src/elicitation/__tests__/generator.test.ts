import { describe, it, expect } from 'vitest';
import { generateSpec } from '../generator.js';
import type { ElicitationResult } from '../types.js';

describe('generateSpec', () => {
  describe('quick flow', () => {
    it('should generate spec from quick flow result', () => {
      const result: ElicitationResult = {
        flowId: 'quick',
        answers: {
          name: 'User Authentication',
          description: 'Implement JWT-based authentication',
          type: 'feature',
          priority: 'high',
          requirements: 'Support email/password login\nGenerate JWT tokens\nValidate tokens on requests',
        },
        metadata: {
          startedAt: new Date('2024-01-01T10:00:00Z'),
          completedAt: new Date('2024-01-01T10:05:00Z'),
          skipped: [],
        },
      };

      const spec = generateSpec(result);

      expect(spec).toContain('# User Authentication');
      expect(spec).toContain('**Type**: feature');
      expect(spec).toContain('**Priority**: high');
      expect(spec).toContain('## Requirements');
      expect(spec).toContain('- Support email/password login');
      expect(spec).toContain('- Generate JWT tokens');
      expect(spec).toContain('- Validate tokens on requests');
      expect(spec).toContain('## Testing Strategy');
      expect(spec).toContain('Created via SpecSafe quick flow');
    });

    it('should include spec ID and date', () => {
      const result: ElicitationResult = {
        flowId: 'quick',
        answers: {
          name: 'Test Feature',
          description: 'Test',
          type: 'feature',
          priority: 'low',
          requirements: 'Req 1',
        },
        metadata: {
          startedAt: new Date(),
          completedAt: new Date(),
          skipped: [],
        },
      };

      const spec = generateSpec(result);

      expect(spec).toMatch(/\*\*Spec ID\*\*: SPEC-\d{8}-\d{3}/);
      expect(spec).toMatch(/\*\*Created\*\*: \d{4}-\d{2}-\d{2}/);
    });
  });

  describe('full flow', () => {
    it('should generate comprehensive spec from full flow result', () => {
      const result: ElicitationResult = {
        flowId: 'full',
        answers: {
          name: 'Payment Integration',
          description: 'Integrate Stripe payment processing',
          type: 'feature',
          priority: 'critical',
          scope: 'Backend API and checkout flow',
          stakeholders: 'Product Team, Finance Team, Engineering',
          requirements: 'Accept credit card payments\nHandle webhooks\nStore transaction history',
          has_security: true,
          security_considerations: 'PCI compliance required\nEncrypt sensitive data',
          testing_strategy: 'Unit tests for API\nIntegration tests with Stripe test mode',
          has_performance: true,
          performance_requirements: 'Payment processing < 2s\n99.9% uptime',
          dependencies: 'Stripe API v2023\nPostgreSQL database',
          timeline: '2 weeks development, 1 week testing',
          risks: 'API rate limits\nCompliance issues',
          acceptance_criteria: 'All payment types accepted\nWebhooks processed correctly\nFull audit trail',
          notes: 'Coordinate with finance team for testing',
        },
        metadata: {
          startedAt: new Date(),
          completedAt: new Date(),
          skipped: [],
        },
      };

      const spec = generateSpec(result);

      expect(spec).toContain('# Payment Integration');
      expect(spec).toContain('## Scope');
      expect(spec).toContain('Backend API and checkout flow');
      expect(spec).toContain('## Stakeholders');
      expect(spec).toContain('- Product Team');
      expect(spec).toContain('## Security Considerations');
      expect(spec).toContain('PCI compliance required');
      expect(spec).toContain('## Performance Requirements');
      expect(spec).toContain('Payment processing < 2s');
      expect(spec).toContain('## Dependencies');
      expect(spec).toContain('- Stripe API v2023');
      expect(spec).toContain('## Timeline');
      expect(spec).toContain('## Risks');
      expect(spec).toContain('- API rate limits');
      expect(spec).toContain('## Acceptance Criteria');
      expect(spec).toContain('## Notes');
    });

    it('should omit optional sections when not provided', () => {
      const result: ElicitationResult = {
        flowId: 'full',
        answers: {
          name: 'Simple Feature',
          description: 'A simple feature',
          type: 'feature',
          priority: 'low',
          requirements: 'Requirement 1',
          has_security: false,
          testing_strategy: 'Basic unit tests',
          has_performance: false,
          acceptance_criteria: 'Feature works',
        },
        metadata: {
          startedAt: new Date(),
          completedAt: new Date(),
          skipped: ['scope', 'stakeholders', 'dependencies', 'timeline', 'risks', 'notes'],
        },
      };

      const spec = generateSpec(result);

      expect(spec).not.toContain('## Scope');
      expect(spec).not.toContain('## Stakeholders');
      expect(spec).not.toContain('## Security Considerations');
      expect(spec).not.toContain('## Performance Requirements');
      expect(spec).not.toContain('## Dependencies');
      expect(spec).not.toContain('## Timeline');
      expect(spec).not.toContain('## Risks');
      expect(spec).not.toContain('## Notes');
    });
  });

  describe('EARS flow', () => {
    it('should generate EARS-formatted spec', () => {
      const result: ElicitationResult = {
        flowId: 'ears',
        answers: {
          name: 'Login System',
          description: 'User login with EARS requirements',
          req_count: '3',
          req_1_type: 'ubiquitous',
          req_1_response: 'validate user credentials against the database',
          req_2_type: 'event',
          req_2_trigger: 'user enters invalid credentials',
          req_2_response: 'display an error message',
          req_3_type: 'state',
          req_3_precondition: 'user is authenticated',
          req_3_response: 'grant access to protected resources',
        },
        metadata: {
          startedAt: new Date(),
          completedAt: new Date(),
          skipped: [],
        },
      };

      const spec = generateSpec(result);

      expect(spec).toContain('# Login System');
      expect(spec).toContain('**Format**: EARS');
      expect(spec).toContain('## Requirements (EARS Format)');
      
      // Check ubiquitous requirement
      expect(spec).toContain('### REQ-001');
      expect(spec).toContain('**Type**: Ubiquitous');
      expect(spec).toContain('The system shall validate user credentials against the database');
      
      // Check event-driven requirement
      expect(spec).toContain('### REQ-002');
      expect(spec).toContain('**Type**: Event-driven');
      expect(spec).toContain('WHEN user enters invalid credentials, the system shall display an error message');
      
      // Check state-driven requirement
      expect(spec).toContain('### REQ-003');
      expect(spec).toContain('**Type**: State-driven');
      expect(spec).toContain('WHILE user is authenticated, the system shall grant access to protected resources');
    });

    it('should handle optional EARS requirements', () => {
      const result: ElicitationResult = {
        flowId: 'ears',
        answers: {
          name: 'Optional Feature',
          description: 'Feature with optional requirements',
          req_count: '2',
          req_1_type: 'optional',
          req_1_precondition: 'premium subscription is active',
          req_1_response: 'enable advanced features',
          req_2_type: 'unwanted',
          req_2_response: 'log the error and notify administrators',
        },
        metadata: {
          startedAt: new Date(),
          completedAt: new Date(),
          skipped: [],
        },
      };

      const spec = generateSpec(result);

      expect(spec).toContain('**Type**: Optional');
      expect(spec).toContain('WHERE premium subscription is active, the system shall enable advanced features');
      expect(spec).toContain('**Type**: Unwanted behavior');
      expect(spec).toContain('IF [unwanted condition], then the system shall log the error and notify administrators');
    });
  });

  describe('error handling', () => {
    it('should throw on unknown flow ID', () => {
      const result: ElicitationResult = {
        flowId: 'unknown',
        answers: {},
        metadata: {
          startedAt: new Date(),
          completedAt: new Date(),
          skipped: [],
        },
      };

      expect(() => generateSpec(result)).toThrow('Unknown flow ID: unknown');
    });
  });
});
