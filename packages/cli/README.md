# @specsafe/cli

<p align="center">
  <img src="https://img.shields.io/npm/v/@specsafe/cli.svg" alt="npm version">
  <img src="https://img.shields.io/npm/l/@specsafe/cli.svg" alt="license">
</p>

**SpecSafe** is a spec-driven development framework for AI-assisted engineering. It provides a structured workflow for turning specifications into tested, production-ready code with full traceability from requirements to implementation.

## Installation

### Global Installation
```bash
npm install -g @specsafe/cli
```

### Using npx (no installation)
```bash
npx @specsafe/cli <command>
```

## Quick Start

The SpecSafe workflow follows a 7-step cycle:

```bash
# 1. Initialize a new SpecSafe project
specsafe init my-project

# 2. Create a new spec
specsafe new login-feature

# 3. Write the specification (creates specs/active/login-feature.spec.md)
# ... edit the spec file with your requirements

# 4. Generate tests from the spec
specsafe spec specs/active/login-feature.spec.md

# 5. Move to implementation phase
specsafe test login-feature

# 6. Write your code, then mark as ready for QA
specsafe code login-feature

# 7. Mark as complete and archive
specsafe qa login-feature      # Or skip with --force
specsafe complete login-feature
specsafe archive login-feature
```

## Commands

### `init [directory]`
Initialize a new SpecSafe project.

```bash
specsafe init my-project
cd my-project
```

Creates the following structure:
```
my-project/
├── specs/
│   ├── active/       # Active specifications
│   ├── completed/    # Completed specs
│   └── archived/     # Archived specs
├── src/
│   ├── specs/        # Generated test files
│   └── impl/         # Implementation files
├── specsafe.config.json
└── package.json
```

**Options:**
- `-f, --force` - Overwrite existing directory

---

### `new <spec-id>`
Create a new specification file.

```bash
specsafe new user-authentication
```

Creates `specs/active/user-authentication.spec.md` with a template structure including:
- Title and description
- Requirements section
- Acceptance criteria
- Technical notes

---

### `spec <spec-file>`
Parse a specification and generate tests.

```bash
# Parse a spec and generate tests
specsafe spec specs/active/login-feature.spec.md

# Output to a specific directory
specsafe spec specs/active/login-feature.spec.md --output ./tests

# Use Jest instead of Vitest
specsafe spec specs/active/login-feature.spec.md --framework jest
```

**Options:**
- `-o, --output <dir>` - Output directory for generated tests
- `-f, --framework <framework>` - Test framework (vitest|jest, default: vitest)
- `-w, --watch` - Watch mode for continuous regeneration

---

### `test <spec-id>`
Move a specification to the "test" phase.

```bash
specsafe test login-feature
```

This updates the spec status and prepares it for implementation.

---

### `code <spec-id>`
Move a specification to the "code" phase.

```bash
specsafe code login-feature
```

Indicates that implementation is in progress.

---

### `qa <spec-id>`
Move a specification to QA or mark QA as complete.

```bash
# Normal QA flow
specsafe qa login-feature

# Skip QA (with flag)
specsafe qa login-feature --force
```

**Options:**
- `-f, --force` - Skip QA phase

---

### `complete <spec-id>`
Mark a specification as complete.

```bash
specsafe complete login-feature
```

Moves the spec from active to completed status.

---

### `archive <spec-id>`
Archive a completed specification.

```bash
specsafe archive login-feature
```

Moves the spec from completed to archived status.

---

### `status [spec-id]`
Show the status of specs.

```bash
# Show all specs and their status
specsafe status

# Show status of a specific spec
specsafe status login-feature
```

---

### `list [phase]`
List specifications by phase.

```bash
# List all specs
specsafe list

# List specs in specific phase
specsafe list active
specsafe list completed
specsafe list archived
specsafe list test
specsafe list code
specsafe list qa
```

---

### `validate <spec-id>`
Validate a specification file for correctness.

```bash
specsafe validate login-feature
```

Checks:
- Required sections present
- Valid requirement IDs
- Proper markdown structure
- Schema compliance

---

## Configuration

Create a `specsafe.config.json` file in your project root:

```json
{
  "projectName": "My Project",
  "specsDir": "./specs",
  "srcDir": "./src",
  "testDir": "./src/specs",
  "implDir": "./src/impl",
  "defaultFramework": "vitest",
  "templates": {
    "spec": "./templates/custom-spec.md"
  },
  "phases": {
    "autoArchive": true,
    "requireQA": false
  }
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `projectName` | string | `"SpecSafe Project"` | Project name for generated files |
| `specsDir` | string | `"./specs"` | Directory for specification files |
| `srcDir` | string | `"./src"` | Source code directory |
| `testDir` | string | `"./src/specs"` | Test file output directory |
| `implDir` | string | `"./src/impl"` | Implementation directory |
| `defaultFramework` | string | `"vitest"` | Default test framework |
| `templates.spec` | string | - | Path to custom spec template |
| `phases.autoArchive` | boolean | `false` | Auto-archive on complete |
| `phases.requireQA` | boolean | `true` | Require QA phase before complete |

## Project Structure

A typical SpecSafe project:

```
my-project/
├── specs/
│   ├── active/
│   │   └── login-feature.spec.md
│   ├── completed/
│   └── archived/
├── src/
│   ├── specs/
│   │   └── login-feature.spec.ts
│   └── impl/
│       └── login-feature.ts
├── specsafe.config.json
└── package.json
```

## Related Packages

- [@specsafe/core](../core/) - Core workflow engine and types
- [@specsafe/test-gen](../test-gen/) - Test generation library

## Specification Format

Specifications are markdown files with a specific structure:

```markdown
# Feature Title

## Description
Brief description of the feature.

## Requirements

### REQ-001: Requirement Title
**Given** initial context
**When** action is performed
**Then** expected result

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Technical Notes
Implementation hints and notes.
```

## License

MIT © Agentic Engineering
