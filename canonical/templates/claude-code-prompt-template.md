# Claude Code Prompt Template

## Objective

- What should Claude Code accomplish?
- What should exist or be true when the task is complete?

## Current Phase

- Phase: `<planning | development>`
- Stage / skill context: `<brainstorm | principles | brief | prd | ux | architecture | readiness | spec | test | code | qa | verify | complete>`

## Spec Slice

- Slice name or ID: `<fill in>`
- Scope: `<the exact unit of work>`
- Acceptance criteria:
  - `<criterion 1>`
  - `<criterion 2>`
  - `<criterion 3>`

## Constraints from Planning

- Product principles: `<relevant principles>`
- UX rules: `<relevant flows, states, accessibility expectations>`
- Architecture decisions: `<relevant boundaries, patterns, interfaces, data-model constraints>`
- Non-goals / scope exclusions: `<what Claude Code must not expand into>`

## Documentation References

- Official docs for named frameworks / SDKs / platforms / tools:
  - `<name>`: `<link or reference>`
  - `<name>`: `<link or reference>`
- MCP references or tool-specific docs:
  - `<MCP or tool>`: `<reference>`

## Testing Requirements

- Tests to write: `<unit / integration / e2e / contract / other>`
- Commands to run:
  - `pnpm test`
  - `<project-specific command>`
- Coverage expectations: `<threshold or expectation>`

## Edge Cases

- `<edge case 1>`
- `<edge case 2>`
- `<failure mode or empty state>`

## Security Considerations

- `<auth / permissions / secrets / input validation / tenancy / data exposure concerns>`
- `<or write "None specific" if not applicable>`

## Quality Bar

Do not mark this task complete unless:

- all tests pass
- lint/typecheck clean
- implementation matches spec
- architecture alignment verified
- edge cases handled
- documentation consulted for named tools
