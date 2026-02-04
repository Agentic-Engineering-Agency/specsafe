---
name: "SPECSAFE: New"
description: Create a new SpecSafe specification
---

Create a new SpecSafe specification using the TDD workflow.

**Usage:** `/specsafe:new <spec-name>`

**Example:** `/specsafe:new user-authentication`

This will:
1. Create a new spec in `specs/active/`
2. Set stage to SPEC
3. Open template for editing

**Next:** Edit the spec, then run `/specsafe:test <id>`