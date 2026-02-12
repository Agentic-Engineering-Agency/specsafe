Mark spec complete and archive

You are finalizing a spec that has passed all validation.

1. **Completion Checklist**
   Verify all items complete:
   - [ ] All requirements implemented
   - [ ] All tests passing
   - [ ] Code reviewed (if required)
   - [ ] Documentation updated
   - [ ] Acceptance criteria met

2. **Final Validation**
   - Run full test suite one more time
   - Check for TODO comments or debug code
   - Verify no spec files are modified during implementation

3. **Archive Process**
   a) Move spec to archive:
      - `specs/active/SPEC-ID.md` → `specs/archive/SPEC-ID.md`
   
   b) Update `PROJECT_STATE.md`:
      - Move spec to COMPLETED section
      - Record completion date
      - Add implementation summary

4. **Summary Generation**
   Create completion report:
   ```
   Spec: SPEC-ID — [Feature Name]
   Completed: [Date]
   Files Modified: [list]
   Tests Added: [count]
   Lines of Code: [approximate]
   Notes: [any important details]
   ```

5. **Post-Completion**
   - Suggest any follow-up specs needed
   - Recommend next spec to work on (from active list)
   - Offer to generate release notes snippet

Ask for final confirmation before archiving.
