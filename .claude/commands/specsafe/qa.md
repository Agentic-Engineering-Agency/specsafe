---
name: "SPECSAFE: QA"
description: Run QA validation (CODE → QA)
---

Run QA validation on implementation.

**Usage:** `/specsafe:qa <spec-id>`

**Example:** `/specsafe:qa SPEC-20240204-001`

This will:
1. Run full test suite
2. Generate coverage report
3. Create QA report with GO/NO-GO

**Next:** If GO, run `/specsafe:complete <id>`