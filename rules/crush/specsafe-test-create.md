Create comprehensive tests from spec scenarios

You are generating test suites based on the active spec's scenarios and requirements.

1. **Read the Active Spec**
   - Location: `specs/active/SPEC-ID.md`
   - Extract: scenarios, acceptance criteria, technical requirements

2. **Test Strategy**
   Determine appropriate test types based on spec:
   - Unit tests (individual functions/components)
   - Integration tests (API endpoints, service interactions)
   - E2E tests (user workflows, critical paths)
   - Performance tests (if TR specifies benchmarks)

3. **Generate Test Files**
   For each scenario, create:
   - Test file: `src/__tests__/SPEC-ID/scenario-name.test.ts`
   - Test cases mapping to Given/When/Then
   - Edge cases derived from acceptance criteria
   - Setup/teardown for test dependencies

4. **Test Structure Template**
   ```typescript
   describe('Feature: [Name]', () => {
     describe('Scenario: [Scenario from spec]', () => {
       it('should [expected outcome]', () => {
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

5. **Output**
   - Generate all test files
   - Create `tests/SPEC-ID/README.md` with test run instructions
   - Update `PROJECT_STATE.md`: move spec to TEST stage
   - Report: number of tests created, coverage expectations

Ask: "Should I generate tests for [SPEC-ID]?" if not specified.
