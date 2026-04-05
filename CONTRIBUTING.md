# Contributing to SpecSafe

## Two-Phase Workflow

SpecSafe follows a two-phase model: **Planning** then **Development**.

### Phase 1: Planning

Reduces ambiguity before any code is written. Steps:

1. **Brainstorm** — divergent exploration of possibilities
2. **Principles** — stable decision-making guidance (non-goals required)
3. **Brief** — concise business/product framing
4. **PRD** — testable requirements document
5. **UX** — user-perspective behavior design (before architecture)
6. **Architecture** — technical design serving product and UX
7. **Readiness** — gate check (GO / NEEDS REVISION / BLOCKED)

### Phase 2: Development

Begins only after planning is sufficient. Steps:

1. **Spec slice** — smallest valuable coherent dev unit
2. **Tests first** — executable behavior checks before implementation
3. **Implementation** — minimal code to satisfy tests
4. **Verify/QA/review** — independent validation (PASS / FAIL → loop back)
5. **Complete/archive** — mark done with evidence

## Adding a Planning Skill

1. Create directory: `canonical/skills/<skill-name>/`
2. Create `SKILL.md` with YAML frontmatter:
   ```yaml
   ---
   name: specsafe-<skill-name>
   description: '<what this skill does>'
   disable-model-invocation: true
   ---
   ```
3. Create `workflow.md` with required sections:
   - **Persona block** — who runs this skill
   - **Preconditions** — what must exist before this skill runs
   - **Workflow** — numbered steps
   - **Guardrails** — constraints and invariants
   - **Handoff** — what to pass to the next stage
   - **State Changes** — what files/state this skill creates or modifies
4. Tests are auto-discovered from `canonical/skills/` — no manual test registration needed.

## Adding a Persona

1. Create file: `canonical/personas/<archetype>-<name>.md`
2. Include required sections:
   - `## Identity` — name, role, archetype, stages
   - `## Communication Style` — how the persona communicates
   - `## Principles` — numbered list of guiding principles
   - `## Guardrails` — NEVER/ALWAYS constraints

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

| Type | Description |
|------|-------------|
| `feat` | New features |
| `fix` | Bug fixes |
| `docs` | Documentation changes |
| `refactor` | Code refactoring |
| `test` | Test changes |
| `chore` | Build/dependency changes |
| `ci` | CI/CD changes |

## Branch Naming

Use `<type>/<description>` in kebab-case. Examples:

```
feat/cli-init-command
fix/validate-spec-id
docs/contributing-guide
```

## Test Expectations

Before submitting:

```bash
pnpm test          # all tests must pass
npx tsc --noEmit   # must be clean (no type errors)
```

## Questions?

Open an issue if you have questions about contributing.
