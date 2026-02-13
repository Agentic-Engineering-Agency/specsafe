# E2E Playwright Outline (Anonymized Demo)

## 1) Objective

Automate high-value user journeys and produce repeatable evidence mapped to requirement IDs.

## 2) Proposed Test Suites

### Suite S1: Auth + Onboarding
- Create new individual account
- Complete onboarding
- Assert persisted profile state
- Requirement mapping: FR-01, FR-02, FR-03

### Suite S2: Tracker CRUD + Recurring
- Create/update/delete transactions
- Configure recurring entry and verify generation
- Requirement mapping: FR-04, FR-05, FR-06

### Suite S3: Conversational Entry Confirmation
- Submit NL transaction phrase
- Assert extracted fields panel
- Confirm write and verify record
- Requirement mapping: FR-07, FR-08, FR-09

### Suite S4: Calculators
- Execute 5 calculators with fixture inputs
- Assert response schema and key output ranges
- Requirement mapping: FR-10

### Suite S5: Chat RAG + Citations
- Submit in-scope query and assert citations
- Submit out-of-scope query and assert fallback
- Requirement mapping: FR-17, FR-18, FR-20

### Suite S6: ERP Business Flow
- Configure ERP connection
- Perform read action (list invoices)
- Perform write action (create invoice)
- Assert audit logging
- Requirement mapping: FR-12, FR-13, FR-14, FR-15, FR-16, NFR-24

### Suite S7: Security Guards
- Attempt cross-tenant access
- Attempt repeated failed auth
- Requirement mapping: NFR-21, NFR-25

## 3) Test Data Strategy

- Use seeded fixtures with deterministic values.
- Isolate tenant data per test worker.
- Reset ERP sandbox objects after each suite.
- Avoid production-like personal data.

## 4) Execution Modes

- `smoke`: S1 + S2 + S5 (PR checks)
- `regression`: S1–S7 (nightly)
- `release-candidate`: regression + trace artifact export

## 5) Expected Outputs

For each run, generate:

1. JUnit/JSON test report
2. Playwright HTML report
3. Trace/video for failures
4. Screenshot bundle per suite
5. Requirement coverage matrix:
   - `requirement-id`
   - `test-suite`
   - `status`

## 6) Recommended Folder Structure

```text
tests/e2e/
  auth/
  tracker/
  chat/
  calculators/
  erp/
  security/
fixtures/
  users.json
  transactions.json
  erp-payloads.json
reports/
  latest/
```

## 7) Quality Gates

- Zero failed tests in smoke suite for PR merge.
- >=95% pass rate in nightly regression.
- 100% mapping coverage for P0 requirements before release sign-off.
