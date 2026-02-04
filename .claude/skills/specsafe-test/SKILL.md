---
name: specsafe-test
description: Generate tests from a SpecSafe specification. Moves spec from SPEC stage to TEST stage.
license: MIT
metadata:
  author: Agentic Engineering
  version: "1.0"
---

Generate tests from a SpecSafe specification (SPEC → TEST stage).

**When to use:**
- Requirements are defined and ready for test generation
- Moving from SPEC to TEST stage
- Creating test skeletons from scenarios

**Input**: The spec ID (e.g., SPEC-20240204-001)

**Steps**

1. **Validate the spec exists and is in SPEC stage**

   Check that the spec file exists in `specs/active/`.
   Verify it has requirements defined.

2. **Move to TEST stage and generate tests**

   ```bash
   specsafe test "<spec-id>"
   ```

   This:
   - Validates requirements are present
   - Generates test files from scenarios
   - Creates `.skip` tests for unimplemented features
   - Updates PROJECT_STATE.md

3. **Show test generation results**

   Summarize:
   - Test files created
   - Number of tests generated
   - Location of test files
   - Next steps

**Output**

After generating tests:
- Test files location
- Number of tests created
- Reminder: Tests are marked with `.skip`
- Prompt: "Implement the tests to make them pass. Ready? Run `/specsafe-code <id>`"

**Guardrails**
- Spec must be in SPEC stage
- Requirements must be defined (at least one)
- Do NOT proceed if no requirements found