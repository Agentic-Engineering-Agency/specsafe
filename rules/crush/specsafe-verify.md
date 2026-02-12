Verify Implementation and Iterate Until Tests Pass

Run tests and iterate until implementation is correct.

**Step 1: Run Test Suite**
```bash
npm test -- SPEC-ID
```

**Step 2: Analyze Failures**
For each failing test:
- Identify the failing assertion
- Map to the specific requirement
- Determine: bug vs. test expectation issue

**Step 3: Fix Iteratively**
- **Golden rule:** Fix the code, not the test (unless confirmed wrong)
- Make targeted fixes
- Re-run tests
- Iterate: `Run → Analyze → Fix → Run` until all pass

**Step 4: Validation**
- Check coverage meets spec requirements
- Run full suite for regressions
- Verify against acceptance criteria

**Step 5: Report**
- Pass rate percentage
- Coverage percentage
- Any remaining issues or concerns

**Update State:**
- Update PROJECT_STATE.md: TEST-APPLY → VERIFY stage

Ask: "Should I run verification for [SPEC-ID]?" if not specified.
