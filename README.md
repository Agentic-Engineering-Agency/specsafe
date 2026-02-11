# SpecSafe

**Test-Driven Development framework for AI-assisted software engineering**

```text
SPEC → TEST → CODE → QA → COMPLETE
  │       │       │      │       │
  │       │       │      │       └─→ Production ready
  │       │       │      └─→ Quality validation
  │       │       └─→ Implementation
  │       └─→ Test generation
  └─→ Requirements definition
```

## Installation

```bash
npm install -g @specsafe/cli
# or
pnpm install -g @specsafe/cli
```

## Quick Start

```bash
# Initialize a new project
specsafe init my-project
cd my-project

# Create a new spec
specsafe new user-authentication

# Edit specs/active/SPEC-YYYYMMDD-001.md
# Add requirements and scenarios

# Generate tests from spec
specsafe test SPEC-YYYYMMDD-001

# Start implementation (TDD cycle)
specsafe code SPEC-YYYYMMDD-001

# Run QA validation
specsafe qa SPEC-YYYYMMDD-001

# Complete when QA passes
specsafe complete SPEC-YYYYMMDD-001
```

## Commands

| Command | Description |
|---------|-------------|
| `specsafe init [name]` | Initialize a new SpecSafe project |
| `specsafe new <name>` | Create a new spec |
| `specsafe status` | Show project status |
| `specsafe spec <id>` | View/edit spec in SPEC stage |
| `specsafe test <id>` | Generate tests (SPEC → TEST) |
| `specsafe code <id>` | Start implementation (TEST → CODE) |
| `specsafe qa <id>` | Run QA validation (CODE → QA) |
| `specsafe complete <id>` | Complete spec (QA → COMPLETE) |

## Philosophy

**"No code without a test. No test without a spec. No work without a log."**

1. **Specs are truth** - Requirements define what to build
2. **Tests are contracts** - Tests validate the requirements
3. **Code is servant** - Implementation exists only to pass tests
4. **History is memory** - Every decision is recorded

## Project Structure

```text
my-project/
├── specs/
│   ├── active/         # Specs being developed
│   ├── completed/      # Production-ready specs
│   └── archive/        # Deprecated specs
├── src/                # Implementation code
├── tests/              # Test files
├── PROJECT_STATE.md    # Auto-generated status
└── specsafe.config.json
```

## Spec Format

```markdown
# Feature Name

**ID:** SPEC-20260211-001  
**Status:** SPEC  
**Priority:** P0

## 1. Purpose (WHY)
One paragraph explaining why this feature exists.

## 2. Scope (WHAT)
### In Scope
- Specific deliverable 1
- Specific deliverable 2

### Out of Scope
- Out of scope item

## 3. Requirements
| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-1 | User shall be able to login | P0 | Given valid credentials, when login requested, then access granted |

## 4. Technical Approach
Architecture and implementation details.

## 5. Test Strategy
Testing approach and coverage targets.

## 6. Implementation Plan
| Phase | Task | Est. | Dependencies |
|-------|------|------|--------------|
| 1 | Setup | 30m | None |
| 2 | Tests | 1h | Phase 1 |

## 7. Success Criteria
- [ ] All P0 requirements met
- [ ] All tests passing
- [ ] Code reviewed

## 8. Risks & Mitigations
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| API changes | Low | High | Mock external deps |

## 9. Notes & References
- Links to related specs
- Documentation references
```

## Packages

- `@specsafe/core` - Types and workflow engine
- `@specsafe/cli` - Command-line interface
- `@specsafe/test-gen` - Test generators

## License

MIT