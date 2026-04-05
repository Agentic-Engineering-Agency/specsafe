# SpecSafe Codebase Audit Report

**Date:** 2026-04-04
**Tools used:** CodeRabbit AI, Adversarial 3-Layer Review, Semgrep SAST, Biome Linter/Formatter
**Scope:** Full codebase — `generators/src/`, `canonical/`, `tests/`, `generators/__tests__/`

---

## Executive Summary

SpecSafe is architecturally sound with clean separation of concerns, a working CI pipeline, and 102 passing tests. However, multiple review layers uncovered **1 critical bug, 7 high-severity issues, 10 medium issues, and 12 low issues**. The automated security scan (Semgrep, 849 rules) found **zero vulnerabilities**. The new Biome linter found **48 style issues** (37 auto-fixable).

### Scorecard

| Area | Rating | Notes |
|------|--------|-------|
| **Security** | Good | Semgrep: 0 findings. Path traversal protection in install.ts is well-implemented. Minor injection risks in TOML/YAML generation. |
| **Correctness** | Needs Work | Critical interface mismatch, wrong `__dirname` fallback, config overwrite bugs. |
| **Test Coverage** | Incomplete | 102 tests pass, but only 12/18 skills and 6/8 personas are tested. 6 skills have zero validation. |
| **Code Quality** | Fair | TypeScript strict mode, clean architecture. But: hand-rolled YAML parser, duplicate frontmatter parsing, `any` types, sync I/O. |
| **Tooling** | Minimal | No linter, formatter, or pre-commit hooks were configured (Biome now installed). |

---

## Critical Findings (Must Fix)

### C1. `ToolAdapter.generate()` parameter name mismatch
- **File:** `generators/src/adapters/types.ts:35`
- **Found by:** Adversarial Review + CodeRabbit (independently confirmed)
- **Issue:** Interface declares `projectRoot: string` but every caller passes `canonicalDir` and every implementation uses it as `canonicalDir`. Works by accident (TypeScript doesn't enforce param names). Any new adapter author reading the interface will write code against the wrong directory.
- **Fix:** Rename `projectRoot` to `canonicalDir` in the `ToolAdapter` interface.

---

## High-Severity Findings

### H1. Wrong `__dirname` fallback on Node < 21.2
- **File:** `generators/src/init.ts:8`, `install.ts:11`, `update.ts:8`
- **Found by:** Adversarial Review + CodeRabbit
- **Issue:** `resolve(__filename, '..')` does NOT compute the directory — it resolves against cwd. Should be `dirname(__filename)`. On Node 18-20 (which the project supports via CI matrix), canonical skill loading would fail.
- **Fix:** Replace `resolve(__filename, '..')` with `dirname(__filename)`.

### H2. Hand-rolled YAML parser silently corrupts data
- **File:** `generators/src/adapters/utils.ts:6-25`
- **Found by:** Adversarial Review
- **Issue:** `parseFrontmatter()` only handles simple `key: value`. Descriptions containing colons are silently truncated (e.g., `description: HTTP: a protocol` → only `HTTP` is captured). No support for multi-line values, arrays, quotes, or comments.
- **Fix:** Use `yaml` or `js-yaml` package, or add strict validation and document constraints.

### H3. Test suite only covers 12/18 skills and 6/8 personas
- **File:** `tests/skills.test.ts:7-21`, `tests/personas.test.ts:7-14`
- **Found by:** CodeRabbit + Project Documentation
- **Issue:** 6 canonical skills (`specsafe-architecture`, `specsafe-brief`, `specsafe-context`, `specsafe-prd`, `specsafe-skill-creator`, `specsafe-ux`) and 2 personas (`sage-nolan`, `prism-aria`) receive zero test validation. Regressions in these are invisible.
- **Fix:** Update test arrays to enumerate all canonical skills/personas dynamically (read from filesystem).

### H4. Zed and Aider adapters overwrite user config without merging
- **File:** `generators/src/adapters/zed.ts:22-37`, `aider.ts:16-19`
- **Found by:** Adversarial Review
- **Issue:** Both adapters generate complete config files (`.zed/settings.json`, `.aider.conf.yml`) that overwrite any existing user configuration (themes, keybindings, API keys, model settings) on every install/update.
- **Fix:** Merge with existing config or write to a specsafe-specific section/file.

### H5. Gemini adapter TOML injection via unescaped values
- **File:** `generators/src/adapters/gemini.ts:32-33`
- **Found by:** Adversarial Review + CodeRabbit
- **Issue:** `skill.description` is interpolated into double-quoted TOML without escaping `"`, `\`, or newlines. A description containing quotes produces broken TOML files.
- **Fix:** Escape special characters in interpolated values.

### H6. Temp directory leaks in adapter tests
- **File:** `generators/__tests__/adapters/*.test.ts`
- **Found by:** CodeRabbit
- **Issue:** Adapter tests create temp directories but never clean up (unlike command-level tests which properly use `afterEach`). Risks CI disk exhaustion.
- **Fix:** Add `afterEach` cleanup to all adapter test files.

### H7. Version mismatch and wrong package.json resolution
- **File:** Root `package.json` v2.1.0 vs `generators/package.json` v2.0.0, `generators/src/index.ts:9`
- **Found by:** Adversarial Review + CodeRabbit
- **Issue:** `join(__dirname, '..', '..', 'package.json')` resolves to the root package.json (v2.1.0), not the generators package.json (v2.0.0). Users see the wrong version. Config template also hardcodes `specsafeVersion: "2.0.0"`.
- **Fix:** Synchronize versions or embed version at build time.

---

## Medium-Severity Findings

| # | Issue | File | Found By |
|---|-------|------|----------|
| M1 | Spinner starts before validation; never stopped on error | `install.ts:45` | CodeRabbit |
| M2 | `catch (err: any)` in strict-mode codebase | `doctor.ts:37` | CodeRabbit |
| M3 | `reconstructSkillMd()` drops extra frontmatter keys on round-trip | `utils.ts:65-74` | Adversarial |
| M4 | Symlink traversal bypasses path containment check | `install.ts:51-57` | Adversarial |
| M5 | OpenCode adapter YAML description not quoted/escaped | `opencode.ts:33` | Adversarial |
| M6 | Continue adapter naive `displayName` formatting (Qa not QA) | `continue.ts:23-25` | Adversarial |
| M7 | `doctor` doesn't validate tool names against `TOOL_NAMES` | `doctor.ts:62-76` | Adversarial |
| M8 | Duplicate `parseFrontmatter` implementations (utils.ts vs tests) | `utils.ts` + `skills.test.ts` | CodeRabbit |
| M9 | `init.ts` config template injection if project name has `"` | `init.ts:174` | CodeRabbit |
| M10 | `update()` runs install sequentially with per-tool spinners | `update.ts:47-49` | Adversarial |

---

## Low-Severity Findings

| # | Issue | File |
|---|-------|------|
| L1 | No project name sanitization in init | `init.ts:60` |
| L2 | `process.exit(0)` on cancel bypasses cleanup | `init.ts:111-114` |
| L3 | `readCanonicalRule` returns empty string for missing files silently | `utils.ts:59-62` |
| L4 | Frontmatter regex requires trailing newline | `utils.ts:9` |
| L5 | Antigravity writes same content to two locations | `antigravity.ts:35-36` |
| L6 | Claude Code adapter overwrites root CLAUDE.md | `claude-code.ts:30-33` |
| L7 | No validation that `canonicalDir/skills` directory exists | `utils.ts:29` |
| L8 | `doctor` uses `readdir` for existence checking instead of `access` | `doctor.ts:1` |
| L9 | Zed adapter hardcodes specific Claude model version | `zed.ts:30` |
| L10 | Aider and Zed adapters silently ignore skills parameter | `aider.ts:14`, `zed.ts:14` |
| L11 | Test helper uses `.` presence to distinguish files from dirs | `helpers.ts:13-14` |
| L12 | Sync filesystem APIs in `loadCanonicalSkills()` | `utils.ts:28-56` |

---

## Security Scan Results (Semgrep)

| Scan | Target | Rules Applied | Findings |
|------|--------|---------------|----------|
| Auto config | `generators/src/` (17 files) | 381 | **0** |
| p/javascript + p/typescript + p/security-audit + p/owasp-top-ten | `generators/src/` (17 files) | 335 | **0** |
| Auto config | `canonical/` + `tests/` (51 files) | 133 | **0** |
| **Total** | **68 files** | **849 rules** | **0 findings** |

The codebase has no known security vulnerabilities detectable by Semgrep's community and pro rule sets, including OWASP Top Ten checks. The manual review did identify injection risks in TOML/YAML generation (H5, M5) that are data-dependent and wouldn't trigger pattern-based SAST.

---

## Biome Linter/Formatter Results

**Biome v2.4.10** installed and configured at workspace root.

| Category | Rule | Count | Auto-fixable |
|----------|------|-------|-------------|
| Import organization | `assist/source/organizeImports` | 19 | Yes |
| Formatting | Various whitespace/wrapping | 13 files | Yes |
| No non-null assertion | `lint/style/noNonNullAssertion` | 9 | No (manual) |
| Use template literals | `lint/style/useTemplate` | 5 | Yes |
| No explicit any | `lint/suspicious/noExplicitAny` | 2 | No (manual) |
| **Total** | | **48** | **37 yes / 11 no** |

**Quick fix:** `npx @biomejs/biome check --fix generators/src/ tests/` will resolve 37 of 48 issues.

---

## Positive Observations

1. **Path traversal protection** in `install.ts` is well-implemented with resolve + containment check
2. **Clean adapter pattern** — adding a new tool is a single file + registry entry
3. **TypeScript strict mode** enabled and passing
4. **CI matrix** tests across Node 18, 20, 22
5. **Separation of canonical content from code** is architecturally sound
6. **E2E test** validates the full init-install-doctor lifecycle
7. **Security posture** is clean — zero Semgrep findings across 849 rules

---

## Recommended Priority Actions

### Immediate (before next release)
1. Fix C1: Rename `projectRoot` → `canonicalDir` in `ToolAdapter` interface
2. Fix H1: Replace `resolve(__filename, '..')` with `dirname(__filename)` in 3 files
3. Fix H3: Update test arrays to cover all 18 skills and 8 personas
4. Fix H7: Synchronize package versions

### Short-term (next sprint)
5. Fix H2: Replace hand-rolled YAML parser with `js-yaml`
6. Fix H4: Merge adapter configs instead of overwriting
7. Fix H5: Escape TOML interpolated values
8. Fix H6: Add temp dir cleanup to adapter tests
9. Run `npx @biomejs/biome check --fix` to auto-fix 37 style issues
10. Add Biome check to CI pipeline

### Medium-term (quality improvement)
11. Add Stryker mutation testing to validate test effectiveness
12. Add GitLeaks to CI for secrets detection
13. Add Snyk or Trivy for dependency vulnerability scanning
14. Address remaining 11 medium + 12 low findings
15. Add pre-commit hooks (Biome lint + Semgrep)

---

## Appendix: Tools & Agents Used

| Agent | Tool/Method | Duration | Files Analyzed |
|-------|-------------|----------|---------------|
| CodeRabbit AI | Structural code review with pattern analysis | ~3.5 min | All source + tests |
| Adversarial Review | 3-layer manual review (Blind Hunter, Edge Case Hunter, Acceptance Auditor) | ~2.5 min | All source files |
| Semgrep | SAST with 849 rules (auto, JS/TS, security-audit, OWASP) | ~3 min | 68 files |
| Biome | Lint + format check (200+ rules) | ~3 min | 21 files |
| Project Documenter | Full codebase comprehension and documentation | ~8 min | All files |
