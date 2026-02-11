# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-02-11

### Added
- Initial release of SpecSafe CLI and core libraries
- `specsafe init` — Initialize a new SpecSafe project
- `specsafe new` — Create a new spec from template
- `specsafe status` — Show project status
- `specsafe list` — List all specs with filtering
- `specsafe spec <id>` — Validate requirements and move to SPEC stage
- `specsafe test <id>` — Generate tests from spec (SPEC → TEST)
- `specsafe code <id>` — Start implementation (TEST → CODE)
- `specsafe qa <id>` — Run QA validation (CODE → QA)
- `specsafe complete <id>` — Complete spec (QA → COMPLETE)
- `specsafe archive <id>` — Archive completed specs
- `specsafe doctor` — Validate project setup
- `--dry-run` flag on mutation commands
- Configuration file support (specsafe.config.json)
- TypeScript support with strict mode
- Test generation for vitest and jest
- 139 passing tests across all packages
- CI/CD pipelines for automated testing and publishing

### Security
- Input validation on all spec IDs (`validateSpecId`)
- Path traversal protection
- QA report schema validation
- Committed lockfile for reproducible builds

## Package Releases

- `@specsafe/core@0.1.0` — Core workflow engine and types
- `@specsafe/cli@0.1.0` — Command-line interface
- `@specsafe/test-gen@0.1.0` — Test generation library
