---
name: specsafe-new
description: Create spec with PRD + BRD
argument-hint: "[feature-name]"
---

Create a new spec with PRD and BRD sections.

**PRD (Product Requirements Document):**
- Problem Statement
- User Stories  
- Acceptance Criteria
- Technical Requirements

**BRD (Business Requirements Document):**
- Business Justification
- Success Metrics
- Stakeholders
- Timeline

**Steps:**
1. Generate spec ID: SPEC-YYYYMMDD-NNN
2. Create PRD and BRD sections
3. Output to specs/active/SPEC-ID.md
4. Update PROJECT_STATE.md (status: SPEC)

Always confirm with user before writing files.
