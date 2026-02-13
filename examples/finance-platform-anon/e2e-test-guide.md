# E2E Manual Test Guide (Anonymized Demo)

## 1) Purpose

Validate end-to-end business-critical journeys for both individual and business user paths, including conversational actions and ERP integration behavior.

## 2) Test Preconditions

- Test environment deployed and reachable.
- Two test accounts available:
  - `persona-individual-01`
  - `persona-business-01`
- Seeded sample finance data available.
- ERP sandbox instance configured for business tenant.

## 3) Manual Test Script

### Flow A — Individual onboarding + tracker basics
1. Sign up with individual profile.
2. Complete onboarding questionnaire.
3. Create one income and two expense transactions.
4. Create one recurring transaction.
5. Set one category budget.
6. Open dashboard and confirm metrics update.

**Expected:** onboarding completion saved; records persist after page refresh; dashboard values match entries.

### Flow B — Conversational transaction entry
1. Open chat and submit a natural-language expense message.
2. Verify extracted fields are shown for confirmation.
3. Confirm write.
4. Verify transaction appears in tracker and dashboard totals.

**Expected:** no write occurs before confirmation; stored fields match confirmed data.

### Flow C — Calculator validation
1. Run each of the five calculators using known sample inputs.
2. Record outputs.
3. Verify outputs are deterministic for repeated same input.

**Expected:** all calculator APIs return successful responses and sensible values.

### Flow D — Knowledge chatbot with citations
1. Ask 3 domain questions.
2. Verify each response includes at least one citation.
3. Ask one out-of-scope question.

**Expected:** in-scope responses contain citations; out-of-scope response uses uncertainty fallback.

### Flow E — Business onboarding + ERP connection
1. Sign in as business profile.
2. Configure ERP connection settings.
3. Run a connectivity check.

**Expected:** connection status displays success and tenant context.

### Flow F — ERP read/write conversational actions
1. Ask chat to list invoices.
2. Ask chat to create a new invoice using test data.
3. Ask chat to register payment.
4. Verify actions in ERP sandbox.

**Expected:** actions succeed with traceable IDs and appear in audit log.

### Flow G — Security and boundary checks
1. Attempt access to another tenant’s data endpoint (using invalid tenant context).
2. Trigger repeated failed login attempts.

**Expected:** access denied for cross-tenant requests; auth throttling/lock policy enforced.

## 4) Screenshot Submission Conventions

Store evidence under:

```text
specsafe/examples/finance-platform-anon/evidence/
  YYYY-MM-DD/
    run-<tester-id>-<build-tag>/
      A-onboarding/
      B-conversational-entry/
      C-calculators/
      D-chat-citations/
      E-erp-setup/
      F-erp-actions/
      G-security/
```

Filename format:

```text
<flow>-<step>-<result>-<timestamp>.png
```

Example:

```text
F-step2-pass-2026-02-12T20-30-00.png
```

## 5) Evidence Metadata File

Each run folder should include `run-metadata.md` with:
- Build/tag
- Environment URL
- Tester ID
- Start/end times
- Passed/failed counts
- Known issues
- Links to defect tickets

## 6) Exit Criteria

- All P0 flows executed.
- No open critical defects.
- All failed steps linked to tracked issues.
- Evidence package complete and auditable.
