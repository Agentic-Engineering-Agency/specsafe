---
name: "SPECSAFE: Test"
description: Generate tests from spec (SPEC → TEST)
---

Generate tests from a SpecSafe specification.

**Usage:** `/specsafe:test <spec-id>`

**Example:** `/specsafe:test SPEC-20240204-001`

This will:
1. Validate requirements exist
2. Generate test files from scenarios
3. Move spec to TEST stage

**Next:** Implement code, then run `/specsafe:code <id>`