/**
 * Parser Tests
 */

import { describe, it, expect } from 'vitest';
import { parseSpec } from '../parser.js';

describe('parseSpec', () => {
  it('should parse spec ID from markdown content', () => {
    const content = `
# My Specification

**Spec ID:** SPEC-20260212-001

## Metadata

| Field | Value |
|-------|-------|
| Stage | spec |
| Created | 2026-02-12 |
| Updated | 2026-02-12 |
`;
    const spec = parseSpec(content);
    expect(spec.id).toBe('SPEC-20260212-001');
  });

  it('should parse spec name from heading', () => {
    const content = `
# User Authentication Feature

**Spec ID:** SPEC-20260212-001
`;
    const spec = parseSpec(content);
    expect(spec.name).toBe('User Authentication Feature');
  });

  it('should parse description', () => {
    const content = `
# My Spec

This is a description of the spec.

**Spec ID:** SPEC-20260212-001
`;
    const spec = parseSpec(content);
    expect(spec.description).toBe('This is a description of the spec.');
  });

  it('should parse stage from metadata table', () => {
    const content = `
# My Spec

**Spec ID:** SPEC-20260212-001

## Metadata

| Field | Value |
|-------|-------|
| Stage | qa |
`;
    const spec = parseSpec(content);
    expect(spec.stage).toBe('qa');
  });

  it('should parse dates from metadata table', () => {
    const content = `
# My Spec

**Spec ID:** SPEC-20260212-001

## Metadata

| Field | Value |
|-------|-------|
| Created | 2026-02-10 |
| Updated | 2026-02-12 |
| Completed | 2026-02-15 |
`;
    const spec = parseSpec(content);
    expect(spec.createdAt).toEqual(new Date('2026-02-10'));
    expect(spec.updatedAt).toEqual(new Date('2026-02-12'));
    expect(spec.completedAt).toEqual(new Date('2026-02-15'));
  });

  it('should parse author and project from metadata table', () => {
    const content = `
# My Spec

**Spec ID:** SPEC-20260212-001

## Metadata

| Field | Value |
|-------|-------|
| Author | John Doe |
| Project | MyProject |
`;
    const spec = parseSpec(content);
    expect(spec.metadata.author).toBe('John Doe');
    expect(spec.metadata.project).toBe('MyProject');
  });

  it('should parse tags from metadata table', () => {
    const content = `
# My Spec

**Spec ID:** SPEC-20260212-001

## Metadata

| Field | Value |
|-------|-------|
| Tags | auth, security, api |
`;
    const spec = parseSpec(content);
    expect(spec.metadata.tags).toEqual(['auth', 'security', 'api']);
  });

  it('should parse PRD section', () => {
    const content = `
# My Spec

**Spec ID:** SPEC-20260212-001

## Product Requirements Document (PRD)

### Problem Statement
Users need to authenticate securely.

### User Stories
- As a user, I want to log in securely
- As a user, I want to reset my password

### Acceptance Criteria
- [ ] User can log in with valid credentials
- [ ] User sees error message with invalid credentials

### Technical Considerations
Use JWT tokens for authentication.
`;
    const spec = parseSpec(content);
    expect(spec.prd).toBeDefined();
    expect(spec.prd?.problemStatement).toBe('Users need to authenticate securely.');
    expect(spec.prd?.userStories).toHaveLength(2);
    expect(spec.prd?.acceptanceCriteria).toHaveLength(2);
    expect(spec.prd?.technicalConsiderations).toBe('Use JWT tokens for authentication.');
  });

  it('should parse requirements from table', () => {
    const content = `
# My Spec

**Spec ID:** SPEC-20260212-001

## Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | User login feature | P0 |
| FR-2 | Password reset | P1 |
| FR-3 | OAuth support | P2 |
`;
    const spec = parseSpec(content);
    expect(spec.requirements).toBeDefined();
    expect(spec.requirements).toHaveLength(3);
    expect(spec.requirements?.[0].id).toBe('FR-1');
    expect(spec.requirements?.[0].priority).toBe('P0');
    expect(spec.requirements?.[2].priority).toBe('P2');
  });

  it('should parse architecture section', () => {
    const content = `
# My Spec

**Spec ID:** SPEC-20260212-001

## Architecture

### Overview
The system uses a microservices architecture.

### Components
- Authentication Service
- User Service
- API Gateway

### APIs

| Name | Method | Endpoint | Description |
|------|--------|----------|-------------|
| Login | POST | /api/auth/login | Authenticates user |
| Logout | POST | /api/auth/logout | Logs out user |

### Data Models
- User
- Session
- Token
`;
    const spec = parseSpec(content);
    expect(spec.architecture).toBeDefined();
    expect(spec.architecture?.overview).toBe('The system uses a microservices architecture.');
    expect(spec.architecture?.components).toHaveLength(3);
    expect(spec.architecture?.apis).toHaveLength(2);
    expect(spec.architecture?.dataModels).toHaveLength(3);
  });

  it('should parse scenarios section', () => {
    const content = `
# My Spec

**Spec ID:** SPEC-20260212-001

## Scenarios

### Successful Login
- **Given** I am on the login page
- **When** I enter valid credentials
- **Then** I should be redirected to dashboard

### Failed Login
- **Given** I am on the login page
- **When** I enter invalid credentials
- **Then** I should see an error message
`;
    const spec = parseSpec(content);
    expect(spec.scenarios).toBeDefined();
    expect(spec.scenarios).toHaveLength(2);
    expect(spec.scenarios?.[0].name).toBe('Successful Login');
    expect(spec.scenarios?.[0].given).toBe('I am on the login page');
  });

  it('should parse design section', () => {
    const content = `
# My Spec

**Spec ID:** SPEC-20260212-001

## Design

### UX Flows
1. User navigates to login page
2. User enters credentials
3. User clicks submit

### UI Requirements
- Login form with email and password fields
- Remember me checkbox
- Forgot password link

### Accessibility
- All form inputs have labels
- Keyboard navigation support
- ARIA labels for screen readers
`;
    const spec = parseSpec(content);
    expect(spec.design).toBeDefined();
    expect(spec.design?.uxFlows).toHaveLength(3);
    expect(spec.design?.uiRequirements).toHaveLength(3);
    expect(spec.design?.accessibility).toHaveLength(3);
  });

  it('should parse test results section', () => {
    const content = `
# My Spec

**Spec ID:** SPEC-20260212-001

## Test Results

| Status | Count |
|--------|-------|
| ✅ Passed | 15 |
| ❌ Failed | 2 |
| ⏭️ Skipped | 1 |

### Coverage

| Type | Percentage |
|------|------------|
| Statements | 95% |
| Branches | 85% |
| Functions | 90% |
| Lines | 94% |
`;
    const spec = parseSpec(content);
    expect(spec.testResults).toBeDefined();
    expect(spec.testResults?.passed).toBe(15);
    expect(spec.testResults?.failed).toBe(2);
    expect(spec.testResults?.skipped).toBe(1);
    expect(spec.testResults?.coverage).toBeDefined();
    expect(spec.testResults?.coverage?.statements).toBe(95);
  });

  it('should parse risks section', () => {
    const content = `
# My Spec

**Spec ID:** SPEC-20260212-001

## Risks

⚠️ Authentication may be vulnerable to timing attacks
⚠️ Session management complexity
⚠️ Dependency on external OAuth providers
`;
    const spec = parseSpec(content);
    expect(spec.risks).toBeDefined();
    expect(spec.risks).toHaveLength(3);
    expect(spec.risks?.[0]).toContain('timing attacks');
  });

  it('should parse timeline section', () => {
    const content = `
# My Spec

**Spec ID:** SPEC-20260212-001

## Timeline

**Estimated Duration:** 2 weeks

### Milestones
1. Design phase complete
2. Authentication API implemented
3. Testing complete
4. Deployment to production
`;
    const spec = parseSpec(content);
    expect(spec.timeline).toBeDefined();
    expect(spec.timeline?.estimatedDuration).toBe('2 weeks');
    expect(spec.timeline?.milestones).toHaveLength(4);
  });

  it('should handle minimal spec content', () => {
    const content = `
# My Spec

**Spec ID:** SPEC-20260212-001
`;
    const spec = parseSpec(content);
    expect(spec.id).toBe('SPEC-20260212-001');
    expect(spec.name).toBe('My Spec');
    expect(spec.stage).toBe('spec'); // default
  });
});
