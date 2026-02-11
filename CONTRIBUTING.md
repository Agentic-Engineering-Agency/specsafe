# Contributing to SpecSafe

Thank you for your interest in contributing to SpecSafe! This document provides guidelines for contributing to this project.

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/) to maintain a clear and organized commit history. This enables us to automatically generate changelogs and determine version bumps.

### Commit Message Format

```
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

## Workflow

1. Create a feature branch from `main`
2. Make your changes with clear, atomic commits
3. Ensure all tests pass: `pnpm test`
4. Push your branch and open a Pull Request

## Questions?

Feel free to open an issue if you have any questions about contributing.
