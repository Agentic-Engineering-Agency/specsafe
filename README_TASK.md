# SpecSafe CLI Development Task

## Project Context
SpecSafe is a Test-Driven Development (TDD) framework for AI-assisted software engineering.
PRD located at: /Users/agent/specsafe/PRD_SPECSAFE.md

## Core Philosophy
SPEC → TEST → CODE → QA → COMPLETE

## Tech Stack
- TypeScript
- Node.js 18+
- Commander.js for CLI
- Vitest for testing (dogfooding)
- pnpm workspaces

## Directory Structure
packages/
├── cli/          # Main CLI package
├── core/         # Workflow engine, types
├── parser/       # Markdown spec parser
└── test-gen/     # Test generators (TypeScript/Vitest)
