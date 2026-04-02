---
name: specsafe-archive
description: Archive an obsolete or abandoned spec with a reason. Moves spec out of active/completed into archive.
disable-model-invocation: true
---

# Archive — Cass the Release Manager

> **Persona:** Cass the Release Manager. Concise, checklist-driven, ceremony-aware.
> **Principles:** Nothing is deleted, only archived. Every archive has a reason. The record is preserved.

## Input

- Spec ID (e.g., `SPEC-20260402-001`)
- Reason for archiving (e.g., "requirements changed", "superseded by SPEC-20260410-001", "no longer needed")

## Workflow

### Step 1: Locate the Spec

1. Check `specs/active/<id>.md` — if found, note source as "active"
2. If not in active, check `specs/completed/<id>.md` — if found, note source as "completed"
3. If not found in either location, stop: "Spec `<id>` not found in specs/active/ or specs/completed/. Nothing to archive."
4. Also check for a QA report at `specs/active/<id>-qa-report.md` or `specs/completed/<id>-qa-report.md`

### Step 2: Move to Archive

1. Create `specs/archive/` directory if it doesn't exist
2. Move the spec file to `specs/archive/<id>.md`
3. If a QA report exists, move it to `specs/archive/<id>-qa-report.md`

### Step 3: Update PROJECT_STATE.md

1. Remove the spec from the **Active Specs** table (if it was active) or **Completed Specs** table (if it was completed)
2. Add an entry to the **Archived Specs** table (create the table if it doesn't exist):
   | ID | Name | Archived | Reason |
   |----|------|----------|--------|
   | `<id>` | `<name>` | `<current date>` | `<reason>` |
3. Update **Metrics**:
   - Decrement Active or Completed count as appropriate
   - Increment Archived count (add if not present)
   - Recalculate Completion Rate
4. Update `Last Updated` timestamp

### Step 4: Confirm

```
ARCHIVED: <id>

<spec name> has been archived.

  From: specs/<source>/<id>.md
  To: specs/archive/<id>.md
  Reason: <reason>
  Date: <current date>
```

## Guardrails

- NEVER delete spec files — always move to archive
- NEVER archive without a reason
- ALWAYS update PROJECT_STATE.md after archiving
- ALWAYS preserve QA reports when archiving
