/**
 * Stakeholder Bundle Tests
 */

import { describe, it, expect } from 'vitest';
import { generateStakeholderBundle, generateStakeholderView } from '../exporters/stakeholder.js';
import type { ParsedSpec } from '../types.js';

describe('Stakeholder Bundle Generator', () => {
  const mockSpec: ParsedSpec = {
    id: 'SPEC-20260212-001',
    name: 'User Authentication System',
    description: 'Secure authentication with OAuth and JWT tokens',
    stage: 'qa',
    createdAt: new Date('2026-02-10'),
    updatedAt: new Date('2026-02-12'),
    completedAt: new Date('2026-02-15'),
    metadata: {
      author: 'Alice Developer',
      project: 'SecureAuth',
      tags: ['auth', 'security', 'oauth'],
    },
    prd: {
      problemStatement: 'Users need secure access to their accounts with modern authentication methods',
      userStories: [
        'As a user, I want to log in with email and password',
        'As a user, I want to reset my password via email',
        'As a user, I want to log in with Google OAuth',
      ],
      acceptanceCriteria: [
        'Users can log in with valid credentials',
        'Password reset emails are sent within 30 seconds',
        'OAuth login works with Google provider',
        'Invalid credentials show clear error messages',
      ],
      technicalConsiderations: 'Use JWT tokens with RS256 signing. Implement rate limiting to prevent brute force attacks.',
    },
    requirements: [
      {
        id: 'FR-1',
        text: 'User login with email/password',
        priority: 'P0',
        scenarios: [
          {
            id: 'SCENARIO-001',
            given: 'User is on login page',
            when: 'User enters valid email and password',
            thenOutcome: 'User is authenticated and redirected to dashboard',
          },
        ],
      },
      {
        id: 'FR-2',
        text: 'Password reset functionality',
        priority: 'P0',
      },
      {
        id: 'FR-3',
        text: 'Google OAuth integration',
        priority: 'P1',
      },
      {
        id: 'FR-4',
        text: 'Session management',
        priority: 'P1',
      },
      {
        id: 'FR-5',
        text: 'Remember me functionality',
        priority: 'P2',
      },
    ],
    architecture: {
      overview: 'Microservices architecture with separate authentication and user services',
      components: [
        'Authentication Service',
        'User Service',
        'OAuth Provider Integration',
        'Token Service',
        'API Gateway',
      ],
      apis: [
        {
          name: 'Login',
          method: 'POST',
          endpoint: '/api/v1/auth/login',
          description: 'Authenticates user with email/password and returns JWT token',
        },
        {
          name: 'OAuth Login',
          method: 'POST',
          endpoint: '/api/v1/auth/oauth/google',
          description: 'Initiates Google OAuth flow',
        },
        {
          name: 'Refresh Token',
          method: 'POST',
          endpoint: '/api/v1/auth/refresh',
          description: 'Refreshes JWT token using refresh token',
        },
        {
          name: 'Logout',
          method: 'POST',
          endpoint: '/api/v1/auth/logout',
          description: 'Invalidates current session',
        },
      ],
      dataModels: [
        'User { id, email, passwordHash, createdAt }',
        'Session { id, userId, token, expiresAt }',
        'OAuthConnection { id, userId, provider, providerId }',
      ],
    },
    scenarios: [
      {
        id: 'SCENARIO-001',
        name: 'Successful Login',
        given: 'User has a valid account',
        when: 'User submits correct credentials',
        thenOutcome: 'User is logged in and redirected',
      },
      {
        id: 'SCENARIO-002',
        name: 'Failed Login',
        given: 'User has an account',
        when: 'User submits incorrect password',
        thenOutcome: 'User sees error message and remains on login page',
      },
    ],
    design: {
      uxFlows: [
        'User navigates to login page',
        'User enters email and password',
        'User clicks login button',
        'On success: redirect to dashboard',
        'On failure: show error message and stay on page',
      ],
      uiRequirements: [
        'Login form with email and password fields',
        'Password visibility toggle',
        'Remember me checkbox',
        'Forgot password link',
        'Social login buttons (Google)',
        'Error message display area',
      ],
      accessibility: [
        'All form inputs have associated labels',
        'Keyboard navigation supported for all actions',
        'ARIA labels for screen readers',
        'Color contrast meets WCAG AA standards',
        'Focus indicators visible on all interactive elements',
      ],
    },
    testResults: {
      passed: 45,
      failed: 2,
      skipped: 3,
      coverage: {
        statements: 92,
        branches: 88,
        functions: 90,
        lines: 91,
      },
    },
    risks: [
      'JWT token theft via XSS attacks',
      'OAuth provider dependency',
      'Rate limiting may affect legitimate users',
      'Password reset email delivery issues',
      'Session management complexity in distributed system',
    ],
    timeline: {
      estimatedDuration: '4 weeks',
      milestones: [
        'Week 1: Design and architecture review',
        'Week 2: Core authentication API implementation',
        'Week 3: OAuth integration and testing',
        'Week 4: QA, bug fixes, and deployment',
      ],
    },
  };

  describe('generateStakeholderBundle', () => {
    it('should generate all four stakeholder views', () => {
      const bundle = generateStakeholderBundle(mockSpec);

      expect(bundle).toBeDefined();
      expect(bundle.executive).toBeDefined();
      expect(bundle.technical).toBeDefined();
      expect(bundle.qa).toBeDefined();
      expect(bundle.design).toBeDefined();
    });

    it('should return ExportResult for each view', () => {
      const bundle = generateStakeholderBundle(mockSpec);

      Object.values(bundle).forEach(view => {
        expect(view.content).toBeDefined();
        expect(view.filename).toBeDefined();
        expect(view.mimeType).toBe('text/markdown');
        expect(view.size).toBeGreaterThan(0);
      });
    });

    it('should have correct filenames for each view', () => {
      const bundle = generateStakeholderBundle(mockSpec);

      expect(bundle.executive.filename).toBe('spec-20260212-001-executive-summary.md');
      expect(bundle.technical.filename).toBe('spec-20260212-001-technical-spec.md');
      expect(bundle.qa.filename).toBe('spec-20260212-001-qa-spec.md');
      expect(bundle.design.filename).toBe('spec-20260212-001-design-spec.md');
    });
  });

  describe('Executive Summary', () => {
    it('should contain business-focused content', () => {
      const view = generateStakeholderView(mockSpec, 'executive');
      const content = view.content as string;

      expect(content).toContain('# Executive Summary');
      expect(content).toContain('## Business Goals');
      expect(content).toContain('## Timeline');
      expect(content).toContain('## Risks & Mitigation');
    });

    it('should include problem statement', () => {
      const view = generateStakeholderView(mockSpec, 'executive');
      const content = view.content as string;

      expect(content).toContain('### Problem Statement');
      expect(content).toContain(mockSpec.prd?.problemStatement);
    });

    it('should include user stories', () => {
      const view = generateStakeholderView(mockSpec, 'executive');
      const content = view.content as string;

      expect(content).toContain('### User Stories');
      expect(content).toContain('As a user, I want to log in');
    });

    it('should include requirements summary with counts', () => {
      const view = generateStakeholderView(mockSpec, 'executive');
      const content = view.content as string;

      expect(content).toContain('## Requirements Summary');
      expect(content).toContain('**Critical (P0):** 2');
      expect(content).toContain('**High (P1):** 2');
      expect(content).toContain('**Medium (P2):** 1');
    });

    it('should include key requirements', () => {
      const view = generateStakeholderView(mockSpec, 'executive');
      const content = view.content as string;

      expect(content).toContain('### Key Requirements');
      expect(content).toContain('User login with email/password');
    });

    it('should include timeline with milestones', () => {
      const view = generateStakeholderView(mockSpec, 'executive');
      const content = view.content as string;

      expect(content).toContain('### Milestones');
      expect(content).toContain('Week 1: Design and architecture review');
    });

    it('should include risks', () => {
      const view = generateStakeholderView(mockSpec, 'executive');
      const content = view.content as string;

      expect(content).toContain('⚠️ JWT token theft');
      expect(content).toContain('⚠️ OAuth provider dependency');
    });

    it('should exclude technical details', () => {
      const view = generateStakeholderView(mockSpec, 'executive');
      const content = view.content as string;

      expect(content).not.toContain('## Architecture');
      expect(content).not.toContain('API Specification');
      expect(content).not.toContain('Data Models');
    });
  });

  describe('Technical Specification', () => {
    it('should contain technical-focused content', () => {
      const view = generateStakeholderView(mockSpec, 'technical');
      const content = view.content as string;

      expect(content).toContain('# Technical Specification');
      expect(content).toContain('## Architecture');
      expect(content).toContain('## API Specification');
      expect(content).toContain('## Technical Requirements');
    });

    it('should include architecture overview', () => {
      const view = generateStakeholderView(mockSpec, 'technical');
      const content = view.content as string;

      expect(content).toContain('### Overview');
      expect(content).toContain(mockSpec.architecture?.overview);
    });

    it('should include components', () => {
      const view = generateStakeholderView(mockSpec, 'technical');
      const content = view.content as string;

      expect(content).toContain('### Components');
      expect(content).toContain('Authentication Service');
      expect(content).toContain('User Service');
    });

    it('should include APIs with endpoints', () => {
      const view = generateStakeholderView(mockSpec, 'technical');
      const content = view.content as string;

      expect(content).toContain('### Login');
      expect(content).toContain('`POST`');
      expect(content).toContain('/api/v1/auth/login');
    });

    it('should include data models', () => {
      const view = generateStakeholderView(mockSpec, 'technical');
      const content = view.content as string;

      expect(content).toContain('### Data Models');
      expect(content).toContain('`User { id, email, passwordHash, createdAt }`');
    });

    it('should include test scenarios', () => {
      const view = generateStakeholderView(mockSpec, 'technical');
      const content = view.content as string;

      expect(content).toContain('## Test Scenarios');
      expect(content).toContain('### SCENARIO-001');
    });

    it('should include technical considerations', () => {
      const view = generateStakeholderView(mockSpec, 'technical');
      const content = view.content as string;

      expect(content).toContain('## Technical Considerations');
      expect(content).toContain('JWT tokens');
    });

    it('should exclude business context', () => {
      const view = generateStakeholderView(mockSpec, 'technical');
      const content = view.content as string;

      expect(content).not.toContain('## Business Goals');
      expect(content).not.toContain('## Timeline');
      expect(content).not.toContain('Risks & Mitigation');
    });
  });

  describe('QA Specification', () => {
    it('should contain QA-focused content', () => {
      const view = generateStakeholderView(mockSpec, 'qa');
      const content = view.content as string;

      expect(content).toContain('# QA Specification');
      expect(content).toContain('## Requirements');
      expect(content).toContain('## Acceptance Criteria');
      expect(content).toContain('## Test Scenarios');
    });

    it('should group requirements by priority', () => {
      const view = generateStakeholderView(mockSpec, 'qa');
      const content = view.content as string;

      expect(content).toContain('### P0 (Critical) Requirements');
      expect(content).toContain('### P1 (High) Requirements');
      expect(content).toContain('### P2 (Medium) Requirements');
    });

    it('should include acceptance criteria', () => {
      const view = generateStakeholderView(mockSpec, 'qa');
      const content = view.content as string;

      expect(content).toContain('## Acceptance Criteria');
      expect(content).toContain('Users can log in with valid credentials');
    });

    it('should include test scenarios', () => {
      const view = generateStakeholderView(mockSpec, 'qa');
      const content = view.content as string;

      expect(content).toContain('## Test Scenarios');
      expect(content).toContain('### SCENARIO-001: Successful Login');
    });

    it('should include test results', () => {
      const view = generateStakeholderView(mockSpec, 'qa');
      const content = view.content as string;

      expect(content).toContain('## Test Results');
      expect(content).toContain('✅ Passed | 45');
      expect(content).toContain('❌ Failed | 2');
      expect(content).toContain('⏭️ Skipped | 3');
    });

    it('should include coverage', () => {
      const view = generateStakeholderView(mockSpec, 'qa');
      const content = view.content as string;

      expect(content).toContain('### Coverage');
      expect(content).toContain('Statements | 92%');
      expect(content).toContain('Branches | 88%');
    });

    it('should include user stories for QA testing', () => {
      const view = generateStakeholderView(mockSpec, 'qa');
      const content = view.content as string;

      expect(content).toContain('## User Stories for QA');
    });
  });

  describe('Design Specification', () => {
    it('should contain design-focused content', () => {
      const view = generateStakeholderView(mockSpec, 'design');
      const content = view.content as string;

      expect(content).toContain('# Design Specification');
      expect(content).toContain('## UX Flows');
      expect(content).toContain('## UI Requirements');
      expect(content).toContain('## Accessibility');
    });

    it('should include UX flows', () => {
      const view = generateStakeholderView(mockSpec, 'design');
      const content = view.content as string;

      expect(content).toContain('## UX Flows');
      expect(content).toContain('User navigates to login page');
      expect(content).toContain('User enters email and password');
    });

    it('should include UI requirements', () => {
      const view = generateStakeholderView(mockSpec, 'design');
      const content = view.content as string;

      expect(content).toContain('## UI Requirements');
      expect(content).toContain('Login form with email and password fields');
      expect(content).toContain('Password visibility toggle');
    });

    it('should include accessibility standards', () => {
      const view = generateStakeholderView(mockSpec, 'design');
      const content = view.content as string;

      expect(content).toContain('## Accessibility');
      expect(content).toContain('All form inputs have associated labels');
      expect(content).toContain('WCAG 2.1 Level AA');
    });

    it('should include user stories context', () => {
      const view = generateStakeholderView(mockSpec, 'design');
      const content = view.content as string;

      expect(content).toContain('## User Stories');
      expect(content).toContain('These user stories inform the design decisions:');
    });

    it('should include user scenarios for UX context', () => {
      const view = generateStakeholderView(mockSpec, 'design');
      const content = view.content as string;

      expect(content).toContain('## User Scenarios (UX Context)');
      expect(content).toContain('User Intent:');
    });

    it('should include WCAG standards section', () => {
      const view = generateStakeholderView(mockSpec, 'design');
      const content = view.content as string;

      expect(content).toContain('## Accessibility Standards');
      expect(content).toContain('Perceivable');
      expect(content).toContain('Operable');
      expect(content).toContain('Understandable');
      expect(content).toContain('Robust');
    });
  });

  describe('Edge Cases', () => {
    it('should handle spec with minimal data', () => {
      const minimalSpec: ParsedSpec = {
        id: 'SPEC-001',
        name: 'Minimal Spec',
        description: '',
        stage: 'spec',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { author: '', project: '', tags: [] },
      };

      const bundle = generateStakeholderBundle(minimalSpec);

      expect(bundle.executive.content).toBeDefined();
      expect(bundle.technical.content).toBeDefined();
      expect(bundle.qa.content).toBeDefined();
      expect(bundle.design.content).toBeDefined();
    });

    it('should handle spec without PRD', () => {
      const specWithoutPRD: ParsedSpec = {
        ...mockSpec,
        prd: undefined,
      };

      const view = generateStakeholderView(specWithoutPRD, 'executive');
      const content = view.content as string;

      expect(content).toBeDefined();
      expect(view.size).toBeGreaterThan(0);
    });

    it('should handle spec without architecture', () => {
      const specWithoutArch: ParsedSpec = {
        ...mockSpec,
        architecture: undefined,
      };

      const view = generateStakeholderView(specWithoutArch, 'technical');
      const content = view.content as string;

      expect(content).toBeDefined();
      expect(view.size).toBeGreaterThan(0);
    });

    it('should handle spec without design section', () => {
      const specWithoutDesign: ParsedSpec = {
        ...mockSpec,
        design: undefined,
      };

      const view = generateStakeholderView(specWithoutDesign, 'design');
      const content = view.content as string;

      expect(content).toBeDefined();
      expect(view.size).toBeGreaterThan(0);
    });

    it('should handle spec with no test results', () => {
      const specWithoutTestResults: ParsedSpec = {
        ...mockSpec,
        testResults: undefined,
      };

      const view = generateStakeholderView(specWithoutTestResults, 'qa');
      const content = view.content as string;

      expect(content).toBeDefined();
      expect(view.size).toBeGreaterThan(0);
    });
  });
});
