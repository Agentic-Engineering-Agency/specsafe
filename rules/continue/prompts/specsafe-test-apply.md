---
name: specsafe-test-apply
description: Run tests, loop on failure
argument-hint: "[spec-id]"
---

Run tests against implementation and loop on failure:

1. Run tests: npx vitest run tests/{spec-id}.test.ts
2. If tests pass: ✅ Move to VERIFY stage
3. If tests fail: 🔧 Analyze failures and fix implementation
4. Repeat until all tests pass

Update PROJECT_STATE.md (status: CODE → VERIFY).

NEVER use old 'dev' command name — this is test-apply.
