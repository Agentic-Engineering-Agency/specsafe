# /specsafe:test — Create Tests from Spec

You are generating comprehensive test suites based on spec scenarios and requirements.

## Prerequisites
- Spec exists in `specs/active/SPEC-ID.md`
- Spec is in SPEC stage

## Process

### 1. Read the Active Spec
Extract from `specs/active/SPEC-ID.md`:
- Scenarios (Given/When/Then)
- Acceptance criteria
- Technical requirements
- Test strategy preferences

### 2. Determine Test Strategy

Based on spec, identify appropriate test types:
| Type | When to Use | Location |
|------|-------------|----------|
| Unit | Individual functions/components | `src/__tests__/SPEC-ID/unit/` |
| Integration | API endpoints, service interactions | `src/__tests__/SPEC-ID/integration/` |
| E2E | User workflows, critical paths | `src/__tests__/SPEC-ID/e2e/` |
| Performance | Benchmark requirements | `src/__tests__/SPEC-ID/perf/` |

### 3. Generate Test Files

For each scenario, create tests:

```typescript
describe('Feature: [Name from spec]', () => {
  describe('Scenario: [Scenario name]', () => {
    it('should [expected outcome from Then]', () => {
      // Given [setup]
      // When [action]
      // Then [assertion]
    });
    
    it('should handle [edge case]', () => {
      // Edge case test
    });
  });
});
```

### 4. Test Organization

Create structure:
```
src/__tests__/SPEC-ID/
├── unit/
│   └── [component].test.ts
├── integration/
│   └── [api].test.ts
├── e2e/
│   └── [workflow].test.ts
└── README.md
```

### 5. Coverage Targets

Map requirements to tests:
| Requirement | Test File | Coverage |
|-------------|-----------|----------|
| FR-001 | unit/auth.test.ts | 100% |

## Output

1. Generate all test files
2. Create `src/__tests__/SPEC-ID/README.md` with:
   - Test run instructions
   - Coverage expectations
   - Test data setup
3. Update `PROJECT_STATE.md`: move spec to TEST stage
4. Report: number of tests created, expected coverage

Ask: "Should I generate tests for [SPEC-ID]?" if not specified.
