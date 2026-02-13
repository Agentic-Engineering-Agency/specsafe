# Contributing to SpecSafe

Thank you for your interest in contributing to SpecSafe! This document provides guidelines for contributing to this project.

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/) to maintain a clear and organized commit history. This enables us to automatically generate changelogs and determine version bumps.

### Commit Message Format

```text
<type>: <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New features |
| `fix` | Bug fixes |
| `docs` | Documentation changes |
| `style` | Code style changes (formatting, semicolons, no functional change) |
| `refactor` | Code refactoring (neither fixes bug nor adds feature) |
| `test` | Test changes (adding missing tests, correcting existing tests) |
| `chore` | Build/dependency changes, maintenance tasks |

### Examples

```bash
# Feature
feat: add dry-run flag to spec command

# Bug fix
fix: validate spec ID before file operations

# Documentation
docs: update README with installation instructions

# Style (formatting)
style: format code with prettier

# Refactoring
refactor: extract validation logic to separate module

# Tests
test: add unit tests for validateSpecId

# Build/dependency changes
chore: bump typescript to 5.4.0
```

## Branch Naming Conventions

All branches must follow these naming patterns:

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feat/` | New features | `feat/dry-run-flag` |
| `fix/` | Bug fixes | `fix/spec-id-validation` |
| `docs/` | Documentation updates | `docs/api-reference` |
| `refactor/` | Code refactoring | `refactor/validation-logic` |
| `test/` | Test additions/changes | `test/auth-unit-tests` |
| `chore/` | Maintenance tasks | `chore/update-dependencies` |
| `ci/` | CI/CD changes | `ci/add-security-scan` |
| `hotfix/` | Critical production fixes | `hotfix/security-patch` |

### Rules

1. **Always branch from `main`**: `git checkout -b feat/your-feature-name`
2. **Use kebab-case**: lowercase with hyphens (e.g., `feat/my-new-feature`)
3. **Be descriptive**: Branch name should indicate what the change does
4. **Include issue number**: If applicable, include issue reference (e.g., `feat/42-user-auth`)
5. **Keep it concise**: Maximum 50 characters after prefix

### Examples

```bash
# Good branch names
git checkout -b feat/cli-init-command
git checkout -b fix/validate-spec-id
git checkout -b docs/contributing-guide
git checkout -b ci/add-audit-check

# Bad branch names (don't do this)
git checkout -b my-feature          # Missing prefix
git checkout -b feature_branch      # Underscores instead of hyphens
git checkout -b fix                 # Too vague
git checkout -b feat/AwesomeStuff   # Uppercase letters
```

## Workflow

1. Create a feature branch from `main` using the naming convention above
2. Make your changes with clear, atomic commits following Conventional Commits
3. Ensure all checks pass locally:
   - `pnpm lint` - Code linting
   - `pnpm typecheck` - Type checking
   - `pnpm test` - Run tests
   - `pnpm audit --audit-level moderate` - Security audit
4. Push your branch and open a Pull Request using the provided template
5. Wait for CI checks to pass and at least 1 code review approval
6. Squash merge if requested by maintainers

## Questions?

Feel free to open an issue if you have any questions about contributing.
