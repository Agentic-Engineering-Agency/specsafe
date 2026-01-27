# SpecSafe

> Test-Driven Development (TDD) framework designed for AI-assisted software engineering

[![npm version](https://img.shields.io/npm/v/specsafe.svg)](https://www.npmjs.com/package/specsafe)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**SpecSafe enforces a strict SPEC → TEST → CODE → QA → COMPLETE workflow where specifications drive test creation, tests drive implementation, QA validates quality, and humans approve before production.**

## 🚀 Quick Start

```bash
npm install -g specsafe

cd your-project
specsafe init

# Start developing with enforced TDD
specsafe:spec user-authentication
specsafe:test user-authentication
specsafe:dev user-authentication
specsafe:qa user-authentication
specsafe:complete user-authentication
```

## 📋 What is SpecSafe?

SpecSafe transforms AI-assisted development by:

1. **Enforcing TDD** - Making it impossible to write code without tests
2. **Automating Specs → Tests** - Converting specifications directly into test skeletons
3. **Tracking Everything** - Building a complete historical record automatically
4. **Multi-Agent Orchestration** - Specialized AI agents for each development phase
5. **Quality Gates** - Formal GO/NO-GO checkpoints before code integration

## 🎯 Workflow

```
SPEC → TEST → CODE → QA → COMPLETE
```

| Phase | Command | Description |
|-------|---------|-------------|
| **SPEC** | `specsafe:spec` | Create specifications with user stories & scenarios |
| **TEST** | `specsafe:test` | Auto-generate test skeletons from specs |
| **CODE** | `specsafe:dev` | TDD implementation (red-green-refactor) |
| **QA** | `specsafe:qa` | Run tests, generate report with GO/NO-GO |
| **COMPLETE** | `specsafe:complete` | Human approval, move to production |

## 🏗️ Installation

```bash
# npm (recommended)
npm install -g specsafe

# Or locally
npm install --save-dev specsafe
```

## 📖 Documentation

- [Full Documentation](https://github.com/AgenticEngineering/specsafe/wiki)
- [Product Requirements Document](./PRD_SPECSAFE.md)
- [Contributing](./CONTRIBUTING.md)

## 🤝 Contributing

Contributions welcome! Please read our [Contributing Guide](./CONTRIBUTING.md).

## 📄 License

MIT © [Agentic Engineering](https://agenticengineering.agency)

## 🙏 Acknowledgments

Inspired by [OpenSpec](https://github.com/Fission-AI/OpenSpec), [Eigent.ai](https://github.com/eigent-ai/eigent), and Anthropic's best practices for agentic development.
