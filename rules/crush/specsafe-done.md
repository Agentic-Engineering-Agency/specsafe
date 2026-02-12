Complete and Archive Spec

Finalize a spec after all tests pass and archive it.

**Completion Checklist:**
- [ ] All requirements implemented
- [ ] All tests passing
- [ ] Code reviewed (if required)
- [ ] Documentation updated
- [ ] No TODO/debug code remaining
- [ ] Acceptance criteria satisfied

**Final Verification:**
- Run final test suite
- Confirm coverage meets requirements

**Archive Process:**
1. Move: `specs/active/SPEC-ID.md` → `specs/archive/SPEC-ID.md`
2. Update PROJECT_STATE.md:
   - Move spec to COMPLETED section
   - Update timestamp
3. Generate completion summary:
   - Completion date
   - Files changed
   - Test count and pass rate
   - LOC added/modified
   - Notes/lessons learned

**Next Steps:**
- Suggest next spec from active list
- Ask for confirmation before archiving

Ask: "Should I complete and archive [SPEC-ID]?" if not specified.
