Generate Detailed Spec from PRD

Convert a Product Requirements Document into an implementation-ready specification.

**Input:**
- Read PRD from `specs/drafts/SPEC-ID.md`

**Output Structure:**
1. **Overview:** Executive summary, goals, non-goals
2. **Functional Requirements:** FR-001, FR-002... (numbered, testable)
3. **Technical Requirements:** TR-001, TR-002... (performance, security, scale)
4. **Scenarios:** Given/When/Then format for each user flow
5. **Acceptance Criteria:** Checklist for completion
6. **Architecture Notes:** Components, data flow, APIs, diagrams
7. **Open Questions:** Document unresolved decisions

**Validation:**
- Every requirement must be testable
- Each scenario maps to at least one requirement
- Acceptance criteria are measurable

**File Operations:**
- Move: `specs/drafts/SPEC-ID.md` → `specs/active/SPEC-ID.md`
- Update PROJECT_STATE.md: DRAFT → SPEC stage

Ask: "Which draft spec should I detail?" if not specified.
