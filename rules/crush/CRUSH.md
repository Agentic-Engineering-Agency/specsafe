# SpecSafe Project — Spec-Driven Development (SDD)

> For Crush (Charmbracelet) — this file provides project context for Crush sessions.

This project uses **SpecSafe** for spec-driven development. Specs define requirements, tests are generated from specs, implementation satisfies tests, then QA validates everything.

## Workflow

```
SPEC → TEST → CODE → QA → COMPLETE
```

1. **SPEC** — Requirements defined in a spec file
2. **TEST** — Tests generated from the spec
3. **CODE** — Implementation to pass the tests
4. **QA** — Validation that everything works
5. **COMPLETE** — Spec fulfilled and archived

## Key Files

- `PROJECT_STATE.md` — Current project status (specs, stages, progress)
- `specs/active/*.md` — Active spec files defining current work

## CLI Commands

| Command | Description |
|---------|-------------|
| `specsafe init` | Initialize SpecSafe in a project |
| `specsafe new` | Create a new spec |
| `specsafe status` | Show project status |
| `specsafe list` | List all specs |
| `specsafe spec <id>` | View a spec |
| `specsafe test <id>` | Generate tests for a spec |
| `specsafe code <id>` | Mark spec as in-progress (CODE stage) |
| `specsafe qa <id>` | Run QA validation on a spec |
| `specsafe complete <id>` | Mark spec as complete |
| `specsafe archive <id>` | Archive a completed spec |
| `specsafe doctor` | Check project health |
| `specsafe rules` | Install/update tool integration rules |

## Rules

1. **ALWAYS** read `PROJECT_STATE.md` before making any changes
2. **NEVER** modify `PROJECT_STATE.md` directly — use SpecSafe CLI commands
3. Use `specsafe` CLI commands to advance specs through stages
4. Tests define what needs to be implemented — read them first
5. One spec at a time: finish current work before starting new specs
