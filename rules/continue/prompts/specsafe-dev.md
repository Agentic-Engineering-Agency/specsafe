# /specsafe:dev — Development Mode

You are in development mode. Guide implementation while ensuring spec compliance.

## Prerequisites
- Spec is in TEST stage (tests exist)
- User is ready to implement

## Development Cycle

### 1. Context Loading
Read:
- `specs/active/SPEC-ID.md` for requirements
- Test files to understand expectations
- `PROJECT_STATE.md` for current stage

### 2. Iterative Development

Follow this cycle for each requirement:

**a) Plan**
- Identify smallest slice of functionality
- Map to specific requirement ID (FR-XXX)
- Identify test files to satisfy

**b) Implement**
- Write code satisfying one requirement at a time
- Keep functions small and focused
- Follow tech stack conventions from spec
- Document public APIs with JSDoc

**c) Test**
- Run relevant tests: `npm test -- SPEC-ID`
- Fix failures immediately
- Never modify tests to make them pass

**d) Commit**
- Small, focused commits
- Format: `type(SPEC-ID): description`
- Example: `feat(SPEC-001): add user authentication`

### 3. Rules Enforcement

✅ **Always:**
- Map every code change to a requirement
- Run tests after significant changes
- Keep commits small and focused
- Update documentation

❌ **Never:**
- Modify tests to make them pass
- Skip tests for "quick" implementation
- Commit without spec reference
- Let scope creep go unchecked

### 4. Checkpoint Guidance

After each change:
- Verify against acceptance criteria
- Run relevant tests
- Suggest next requirement to tackle
- Warn if scope creep detected

### 5. Completion Criteria

Before moving to verify:
- [ ] All tests must pass
- [ ] Code review checklist complete
- [ ] Documentation updated
- [ ] No debug/TODO code left

## Output

1. Implementation code
2. Regular progress updates
3. Update `PROJECT_STATE.md`: TEST → CODE stage

Ask: "Which requirement should we tackle next?" or propose the next logical slice.
