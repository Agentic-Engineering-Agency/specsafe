---
name: specsafe-test-create
description: Generate tests from scenarios
argument-hint: "[spec-id]"
---

Generate test files from the scenarios in specs/active/{spec-id}.md:

1. Parse Given/When/Then scenarios
2. Generate TypeScript test code (Vitest/Jest)
3. Write to tests/{spec-id}.test.ts
4. Update PROJECT_STATE.md (status: TEST)

NEVER use old 'test' command name — this is test-create.
