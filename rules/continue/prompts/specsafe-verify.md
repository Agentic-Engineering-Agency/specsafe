# /specsafe:verify — Test & Iterate

You are responsible for verifying implementation against the spec through automated testing.

## Prerequisites
- Spec is in CODE or QA stage
- Implementation is complete
- Test files exist

## Verification Process

### 1. Pre-Flight Check
- Read `specs/active/SPEC-ID.md` for expected behavior
- Verify test files exist in `src/__tests__/SPEC-ID/`
- Check current PROJECT_STATE stage

### 2. Test Execution

Run appropriate test commands:
```bash
# Run all tests for this spec
npm test -- SPEC-ID

# Or with coverage
npm test -- SPEC-ID --coverage

# Or for specific test file
npm test -- src/__tests__/SPEC-ID/unit/auth.test.ts
```

### 3. Failure Analysis

For each failing test:
1. **Identify** the failing assertion
2. **Map** failure to specific requirement (FR-XXX)
3. **Determine** root cause:
   - Implementation bug? → Fix the code
   - Test expectation wrong? → Discuss with user before modifying
   - Requirement unclear? → Update spec

### 4. Iteration Loop

Repeat until all tests pass:
```
Run tests → Analyze failures → Fix code → Run tests
```

**Golden Rule:** Fix the code, not the test (unless confirmed wrong).

### 5. Coverage Check

- Verify coverage meets spec requirements (if specified in TR-XXX)
- Identify untested code paths
- Suggest additional tests if gaps exist

### 6. Regression Prevention

- Run full test suite: `npm test`
- Flag any unrelated test failures
- Ensure no regressions introduced

### 7. Completion

When all tests pass:
- Update `PROJECT_STATE.md`: CODE → QA stage
- Generate test report summary
- Suggest manual testing areas

## Output

Report should include:
```
Test Results for SPEC-ID
========================
✅ Passed: X
❌ Failed: 0
📊 Coverage: X%
⏱️  Duration: Xs

Status: READY FOR QA
```

Or if failures remain:
```
⚠️  Remaining Issues:
- [Test name]: [Failure reason] → [Suggested fix]
```
