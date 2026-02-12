Generate detailed specification from PRD

You are expanding a Product Requirements Document into a complete, implementation-ready specification.

1. **Read the PRD**
   - Location: `specs/drafts/SPEC-ID.md` or user-provided path
   - Extract: requirements, scenarios, tech stack, constraints

2. **Structure the Detailed Spec**
   Create comprehensive spec with:
   
   a) **Overview** — Executive summary, goals, non-goals
   b) **Requirements** — Functional requirements (numbered FR-001, FR-002...)
   c) **Technical Requirements** — TR-001, TR-002... (performance, security, scalability)
   d) **Scenarios** — Concrete user scenarios with Given/When/Then format
   e) **Acceptance Criteria** — Checklist for completion
   f) **Architecture Notes** — Component breakdown, data flow, API contracts
   g) **Open Questions** — Document any unresolved decisions

3. **Validation**
   - Ensure every requirement is testable
   - Verify scenarios cover happy path and edge cases
   - Confirm tech stack alignment with requirements

4. **Output**
   - Write to `specs/active/SPEC-ID.md`
   - Update `PROJECT_STATE.md`: move spec from DRAFT → SPEC stage
   - List any blockers or questions for the user

Ask user to review before finalizing.
