Run tests and iterate until all pass

You are responsible for verifying implementation against the spec through automated testing.

1. **Pre-Flight Check**
   - Read `specs/active/SPEC-ID.md` for expected behavior
   - Verify test files exist in `src/__tests__/SPEC-ID/`
   - Check current PROJECT_STATE stage (should be CODE or QA)

2. **Test Execution**
   Run appropriate test commands:
   ```bash
   # Run all tests for this spec
   npm test -- SPEC-ID
   
   # Or with coverage
   npm test -- SPEC-ID --coverage
   ```

3. **Failure Analysis**
   For each failing test:
   - Identify the failing assertion
   - Map failure to specific requirement
   - Determine: implementation bug or test expectation issue?
   - If bug: fix the code, not the test
   - If test is wrong: discuss with user before modifying

4. **Iteration Loop**
   Repeat until all tests pass:
   ```
   Run tests → Analyze failures → Fix code → Run tests
   ```

5. **Coverage Check**
   - Verify coverage meets spec requirements (if specified)
   - Identify untested code paths
   - Suggest additional tests if gaps exist

6. **Completion**
   When all tests pass:
   - Update `PROJECT_STATE.md`: move to QA stage
   - Generate test report summary
   - Suggest manual testing areas

7. **Regression Prevention**
   - Run full test suite to check for regressions
   - Flag any unrelated test failures

Report: Pass rate, coverage %, any remaining issues.
