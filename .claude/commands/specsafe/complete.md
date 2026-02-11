---
name: "SPECSAFE: Complete"
description: Complete spec (QA → COMPLETE)
---

Complete a SpecSafe specification.

**Usage:** `/specsafe:complete <spec-id>`

**Example:** `/specsafe:complete SPEC-20240204-001`

This will:
1. Mark spec as COMPLETE
2. Move to `specs/completed/`
3. Update PROJECT_STATE.md

**Next:** Start new spec with `/specsafe:new`