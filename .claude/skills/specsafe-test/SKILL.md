---
name: specsafe-test
description: Create tests from scenarios. Moves spec from SPEC to TEST stage.
disable-model-invocation: true
---

Generate tests from spec scenarios (SPEC → TEST stage).

**When to use:**
- Spec requirements are complete
- Ready to generate test code
- Starting TDD cycle

**Input**: The spec ID (e.g., SPEC-20260211-001)

**Steps**

1. **Validate spec is ready**

   Check `specs/active/<spec-id>.md`:
   - Status must be SPEC stage
   - Requirements have acceptance criteria
   - Scenarios are defined
   - If incomplete, prompt to complete with `/specsafe:spec`

2. **Analyze tech stack**

   Read spec for testing framework:
   - Unit test framework (Vitest/Jest/Mocha)
   - E2E framework (Playwright/Cypress)
   - Mocking approach
   - Coverage requirements

3. **Generate test structure**

   Create test file(s) in appropriate location:
   ```
   tests/
   ├── unit/<feature-name>.test.ts       # Unit tests
   ├── integration/<feature-name>.test.ts # Integration tests
   └── e2e/<feature-name>.spec.ts        # E2E tests
   ```

4. **Convert scenarios to tests**

   For each scenario in the spec:
   - Create test case with descriptive name
   - Write failing test (RED phase of TDD)
   - Include Given-When-Then in test comments
   - Reference requirement ID in test

   Example:
   ```typescript
   // Requirement: FR-1 - User login
   // Scenario: Valid credentials
   describe('User Authentication', () => {
     it('should grant access with valid credentials', () => {
       // Given: User has valid credentials
       const credentials = { username: 'test', password: 'valid' };
       
       // When: Login is requested
       const result = auth.login(credentials);
       
       // Then: Access is granted
       expect(result.success).toBe(true);
       expect(result.token).toBeDefined();
     });
   });
   ```

5. **Create test utilities**

   Generate helpers if needed:
   - Mock data factories
   - Test fixtures
   - Setup/teardown helpers
   - Custom matchers

6. **Move to TEST stage**

   ```bash
   specsafe test "<spec-id>"
   ```

   This:
   - Updates spec status to TEST
   - Records test file locations
   - Updates PROJECT_STATE.md

7. **Show test summary**

   Display:
   - Number of tests created
   - Test file locations
   - Coverage target
   - Next command: `/specsafe:dev <id>`

**Output**

After test generation:
- ✅ Test files created (all tests failing initially)
- ✅ Scenarios converted to test cases
- ✅ Test utilities/helpers created
- ✅ Status: TEST stage
- 📋 Prompt: "Tests are ready. Run `/specsafe:dev <id>` to implement"

**Guardrails**
- All tests must initially FAIL (TDD principle)
- Each test maps to a specific requirement
- Tests should be independent (no shared state)
- Include both positive and negative test cases
- Mock external dependencies appropriately
- Do NOT write implementation code at this stage

**Example**
```
User: /specsafe:test SPEC-20260211-004
→ Generates 12 test cases from scenarios
→ Creates tests/unit/auth.test.ts
→ Creates tests/integration/auth.api.test.ts
→ All tests failing (as expected for TDD)
→ Status: TEST
→ Next: /specsafe:dev SPEC-20260211-004
```
