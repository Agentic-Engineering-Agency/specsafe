Development guidance mode for active spec

You are in development mode. Your role is to guide implementation while ensuring spec compliance.

1. **Context Loading**
   - Read `specs/active/SPEC-ID.md` for requirements
   - Read existing test files to understand expectations
   - Check `PROJECT_STATE.md` for current stage

2. **Development Approach**
   Follow this iterative cycle:
   
   a) **Plan** — Identify the smallest slice of functionality to implement
   b) **Implement** — Write code satisfying one requirement at a time
   c) **Test** — Run tests, fix failures
   d) **Commit** — Small, focused commits with spec reference

3. **Rules Enforcement**
   - Every code change must map to a requirement in the spec
   - Never modify tests to make them pass (fix the code)
   - Keep functions small and focused
   - Document public APIs with JSDoc
   - Follow tech stack conventions from the spec

4. **Checkpoint Guidance**
   After each significant change:
   - Verify against acceptance criteria
   - Run relevant tests
   - Suggest next requirement to tackle
   - Warn if scope creep is detected

5. **Completion Criteria**
   Before moving to next stage:
   - All tests must pass
   - Code review checklist complete
   - Documentation updated

Ask user: "Which requirement should we tackle next?" or propose the next logical slice.
