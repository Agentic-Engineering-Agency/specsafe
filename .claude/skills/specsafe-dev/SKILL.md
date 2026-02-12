---
name: specsafe-dev
description: Development guidance mode. Implements code to pass tests. Moves spec from TEST to CODE stage.
disable-model-invocation: true
---

Development guidance mode - implement code to pass tests (TEST → CODE stage).

**When to use:**
- Tests are generated and failing
- Ready to write implementation
- Following TDD cycle (RED → GREEN → REFACTOR)

**Input**: The spec ID (e.g., SPEC-20260211-001)

**Steps**

1. **Validate test state**

   Check `specs/active/<spec-id>.md`:
   - Status must be TEST stage
   - Test files exist
   - Tests are currently failing

   Run tests to confirm:
   ```bash
   pnpm test  # or npm test / yarn test
   ```

2. **Read requirements**

   Review spec for implementation guidance:
   - Requirements with acceptance criteria
   - Technical approach section
   - Architecture decisions
   - Integration points

3. **Implement to pass tests**

   Follow TDD cycle:
   
   **RED**: Confirm tests fail
   ```bash
   pnpm test
   # Should see failing tests
   ```
   
   **GREEN**: Write minimal code to pass tests
   - Start with simplest implementation
   - Don't over-engineer
   - Focus on making tests pass
   
   **REFACTOR**: Clean up while keeping tests green
   - Improve code quality
   - Extract functions/classes
   - Add documentation
   - Run tests after each change

4. **Track progress**

   For each test file:
   - Run specific test: `pnpm test <pattern>`
   - Fix failing tests one at a time
   - Verify no regressions

5. **Handle edge cases**

   As tests pass, review:
   - Edge case coverage
   - Error handling
   - Input validation
   - Performance considerations

6. **Move to CODE stage**

   When all tests pass:
   ```bash
   specsafe code "<spec-id>"
   ```

   This:
   - Updates spec status to CODE
   - Records implementation files
   - Updates PROJECT_STATE.md

7. **Show implementation summary**

   Display:
   - Files created/modified
   - Test results (all passing)
   - Coverage metrics
   - Next command: `/specsafe:verify <id>`

**Output**

After development:
- ✅ Implementation code written
- ✅ All tests passing
- ✅ Code follows project conventions
- ✅ Status: CODE stage
- 📋 Prompt: "Implementation complete. Run `/specsafe:verify <id>` to validate"

**Guardrails**
- NEVER skip tests to implement faster
- Write only enough code to pass tests
- Keep tests passing throughout refactoring
- Follow existing code style and patterns
- Commit frequently with meaningful messages
- Reference spec ID in commits: `feat(SPEC-001): add user auth`
- If tests need changes, discuss with user first

**Example**
```
User: /specsafe:dev SPEC-20260211-004
→ Runs tests (12 failing)
→ Implements auth service
→ Implements login endpoint
→ All 12 tests passing
→ Code coverage: 94%
→ Status: CODE
→ Next: /specsafe:verify SPEC-20260211-004
```

**TDD Reminders**
- 🔄 RED: Write failing test first
- 🔄 GREEN: Write code to pass
- 🔄 REFACTOR: Clean up with tests green
- 🚫 Never write code without a failing test
- 🚫 Never skip the refactor phase