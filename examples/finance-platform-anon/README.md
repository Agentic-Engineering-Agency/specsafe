# Finance Platform (Anonymized) — SpecSafe Demo Pack

This folder contains an anonymized, reusable demo package showing how to run **SpecSafe** on a bilingual (Spanish-first) finance product scope that combines:

- **B2C** personal finance (tracker, dashboard, calculators, financial education chatbot)
- **B2B** business operations via ERP integration (invoicing, contacts, accounting actions)

The source material was transformed into neutral documentation suitable for demos, onboarding, and internal training.

## What this demo is

A realistic product documentation set for:

1. generating and validating requirements,
2. planning implementation phases,
3. defining manual and automated E2E validation,
4. demonstrating safe handling of sensitive source documents.

It is intended for teams evaluating SpecSafe workflows such as:

- requirement normalization,
- change control,
- test traceability,
- redaction-aware documentation handoffs.

## Redaction / anonymization policy

This package follows a strict anonymization policy:

- Removed all personal names and replaced with role-based placeholders.
- Removed organization, school, and private company names; replaced with generic labels (e.g., `Organization A`, `Academic Partner`, `Platform Team`).
- Removed direct identifiers and private links.
- Preserved business intent, technical scope, architecture choices, and delivery sequencing.
- Retained public-domain ecosystem references only when required for technical meaning (e.g., generic regulator, central bank, ERP categories).
- Added `redaction-map.md` for full traceability of generalizations.

## How to run this demo with SpecSafe

From repo root:

```bash
cd specsafe
```

### 1) Review demo docs

```bash
ls examples/finance-platform-anon
```

### 2) Create/align a spec change from anonymized docs

Use your normal SpecSafe flow (new change → requirement/spec drafting → verify).

Suggested input order:
1. `prd-anonymized.md`
2. `requirements-ears.md`
3. `design-outline.md`
4. `tasks-plan.md`
5. `e2e-test-guide.md`
6. `e2e-playwright-outline.md`

### 3) Validate requirement quality

Checklist:
- Each EARS requirement is testable.
- Priority and risk coverage are balanced.
- B2C and B2B scopes are both represented.
- Data/privacy controls are represented in both design and tests.

### 4) Connect tests to requirements

- Map manual script steps to requirement IDs in `requirements-ears.md`.
- Map Playwright flows to same IDs.
- Store screenshots/evidence using conventions in `e2e-test-guide.md`.

### 5) Perform redaction audit

Cross-check `redaction-map.md` before sharing outside your internal environment.

---

## Package contents

- `prd-anonymized.md` — anonymized product brief and scope
- `requirements-ears.md` — 28 EARS-format requirements
- `design-outline.md` — architecture, modules, data model, API surface, risks
- `tasks-plan.md` — phased implementation plan with dependencies
- `e2e-test-guide.md` — manual test script and evidence conventions
- `e2e-playwright-outline.md` — automation scope and expected outputs
- `redaction-map.md` — anonymization decisions and transformations
