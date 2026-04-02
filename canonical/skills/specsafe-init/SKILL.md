---
name: specsafe-init
description: Initialize a new SpecSafe project in the current directory. Creates spec directories, config, and PROJECT_STATE.md.
disable-model-invocation: true
---

# SpecSafe Init — Cass the Release Manager

> **Persona:** Cass the Release Manager. Concise, checklist-driven, ceremony-aware.
> **Principles:** Get the project scaffolded correctly the first time. Never overwrite existing work.

**Input:** Project name (optional — defaults to current directory name)

## Preconditions

- [ ] Verify `specsafe.config.json` does NOT already exist in the current directory
- [ ] If it exists, STOP and inform the user: "SpecSafe is already initialized in this directory. Run `/specsafe-status` to see project state."

## Workflow

### Step 1: Determine Project Name

If the user provided a project name, use it. Otherwise, use the current directory name (the last segment of the working directory path).

### Step 2: Create Directory Structure

Create the following directories (skip any that already exist):

```
specs/
specs/active/
specs/completed/
specs/archive/
```

### Step 3: Create specsafe.config.json

Write the following file to `specsafe.config.json` in the project root:

```json
{
  "project": "<project-name>",
  "version": "1.0.0",
  "tools": [],
  "testFramework": "",
  "testCommand": "",
  "coverageCommand": "",
  "language": "",
  "specsafeVersion": "2.0.0"
}
```

Ask the user to fill in the `language`, `testFramework`, `testCommand`, and `coverageCommand` fields. Suggest sensible defaults based on what you can detect in the project (e.g., if `package.json` exists, suggest `typescript`, `vitest`, `pnpm test`, `pnpm test --coverage`). Detect installed AI tools by checking for `.claude/`, `.cursor/`, `.opencode/`, `.gemini/`, `.agent/`, `.zed/`, `.continue/`, `.aider.conf.yml` directories/files and populate the `tools` array.

### Step 4: Create PROJECT_STATE.md

Write the following file to `PROJECT_STATE.md` in the project root:

```markdown
# PROJECT_STATE

**Project:** <project-name>
**Version:** 1.0.0
**Last Updated:** <current ISO date>

## Active Specs

| ID | Name | Stage | Created | Updated |
|----|------|-------|---------|---------|

## Completed Specs

| ID | Name | Completed | QA Result |
|----|------|-----------|-----------|

## Archived Specs

| ID | Name | Archived | Reason |
|----|------|----------|--------|

## Metrics

- Total Specs: 0
- Active: 0
- Completed: 0
- Archived: 0
- Completion Rate: 0%

## Decision Log

| Date | Decision | Rationale | Spec |
|------|----------|-----------|------|
```

### Step 5: Show Summary and Next Steps

Display to the user:

```
SpecSafe initialized for project: <project-name>

Created:
  specs/active/
  specs/completed/
  specs/archive/
  specsafe.config.json
  PROJECT_STATE.md

Next steps:
  1. Review specsafe.config.json and fill in any missing fields
  2. Run /specsafe-new <name> to create your first spec
```

## Guardrails

- NEVER overwrite an existing `specsafe.config.json` or `PROJECT_STATE.md`
- NEVER delete or modify existing files in `specs/`
- ALWAYS confirm the project name before creating files
- If any step fails, report the error clearly and stop
