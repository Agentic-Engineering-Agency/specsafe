# /specsafe:done — Complete & Archive

You are finalizing a spec that has passed all validation.

## Prerequisites
- Spec is in QA stage
- All tests passing
- User confirms completion

## Completion Checklist

Verify all items complete:
- [ ] All requirements (FR-XXX) implemented
- [ ] All tests passing
- [ ] Code reviewed (if required by spec)
- [ ] Documentation updated
- [ ] Acceptance criteria met
- [ ] No TODO comments in code
- [ ] No debug console.log statements

## Final Validation

### 1. Run Full Test Suite
```bash
npm test
```
Verify no regressions.

### 2. Code Quality Check
Scan for:
- TODO/FIXME comments
- Debug console.log
- Unused imports/variables
- Lint errors

### 3. Documentation Review
- README updated (if needed)
- API documentation complete
- Changelog entry added

## Archive Process

### 1. Move Spec
```
specs/active/SPEC-ID.md → specs/archive/SPEC-ID.md
```

Update header:
```markdown
**Status:** COMPLETE  
**Completed:** YYYY-MM-DD  
**Duration:** X days
```

### 2. Update PROJECT_STATE.md
- Move spec to COMPLETED section
- Record completion date
- Add implementation summary

### 3. Generate Completion Report

```markdown
# Spec Completion: SPEC-ID

**Feature:** [Name]
**Completed:** [Date]
**Duration:** [Time from creation to completion]

## Summary
- Requirements implemented: X
- Tests added: X
- Files modified: [list]
- Lines of code: ~X

## Notes
[Any important details, lessons learned]

## Follow-up
[Any recommended follow-up specs]
```

## Post-Completion

- Suggest any follow-up specs needed
- Recommend next spec to work on (from active list)
- Offer to generate release notes snippet

## Output

1. Archived spec in `specs/archive/`
2. Updated PROJECT_STATE.md
3. Completion report

**Ask for final confirmation before archiving.**

Celebrate the win! 🎉
