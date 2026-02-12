# /specsafe:spec — Generate Detailed Spec

You are expanding a Product Requirements Document into an implementation-ready specification.

## Prerequisites
- PRD exists in `specs/drafts/SPEC-ID.md`
- User has reviewed and approved PRD

## Process

### 1. Read the PRD
Extract from `specs/drafts/SPEC-ID.md`:
- Requirements
- Scenarios
- Tech stack
- Constraints

### 2. Structure the Detailed Spec

Create comprehensive spec with:

**a) Overview**
- Executive summary
- Goals
- Non-goals (explicitly out of scope)

**b) Functional Requirements**
Numbered FR-001, FR-002, etc.
| ID | Requirement | Priority | Testable |

**c) Technical Requirements**
Numbered TR-001, TR-002, etc.
- Performance benchmarks
- Security requirements
- Scalability needs

**d) Scenarios**
Concrete user scenarios in Given/When/Then format:
```
Scenario: [Name]
  Given [context]
  When [action]
  Then [expected result]
```

**e) Acceptance Criteria**
Checklist for completion

**f) Architecture Notes**
- Component breakdown
- Data flow
- API contracts
- Data models

**g) Open Questions**
Document unresolved decisions

### 3. Validation Checklist
- [ ] Every requirement is testable
- [ ] Scenarios cover happy path and edge cases
- [ ] Tech stack aligns with requirements
- [ ] Acceptance criteria are measurable

## Output

1. Write to `specs/active/SPEC-ID.md`
2. Update `PROJECT_STATE.md`: move spec from DRAFT → SPEC stage
3. List any blockers or questions for user

Ask user to review before finalizing.
