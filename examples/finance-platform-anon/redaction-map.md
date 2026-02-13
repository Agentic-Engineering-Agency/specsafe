# Redaction Map: Finance Demo Package

This file documents how source content was generalized for safe demo distribution.

## 1) Identity Redactions

- Personal author names -> replaced with role labels (`Lead Developer`, `Project Manager`, `Content Lead`, `QA Analyst`).
- Team-specific assistant names -> generalized to `AI Assistant`.

## 2) Organization Redactions

- Private company names -> replaced with `Organization A` / `Platform Team` where context required.
- Academic institution names -> replaced with `Academic Partner`.
- Internal group branding -> removed unless needed for architecture meaning.

## 3) Direct Identifier Redactions

- Removed explicit private links, private channels, and direct contact references.
- Removed unique references that could identify individuals or specific cohorts.

## 4) Kept/Generalized Technical References

Kept (as generic ecosystem/technical context):
- Framework categories (web framework, serverless backend, AI orchestration).
- Public integration categories (ERP, regulator/tax domain, central bank/rates API concepts).
- Publicly known standards (RAG, vector embeddings, audit logs, multi-tenant controls).

Generalized:
- Product codename -> `Finance Platform`.
- Named partner or sponsor references -> category-level descriptions.
- Timeline framing retained but stripped of institution-specific milestone labels.

## 5) Content Preservation Rules Applied

- Preserved business intent (B2C + B2B dual model).
- Preserved core MVP features and priorities.
- Preserved architecture and delivery sequence.
- Preserved measurable targets in normalized form.
- Removed only identity-bearing data; retained technical scope.

## 6) Residual Risk Check

Reviewed for:
- Personal names
- Private organization names
- Direct identifiers
- Private URLs

Result: No direct personal or private organizational identifiers remain in this package.
