# Tasks Plan: Finance Platform (Anonymized)

## Priority Legend
- **P0** = must-have for MVP
- **P1** = important, can follow MVP stabilization
- **P2** = backlog / post-MVP

## Dependency Legend
- `->` requires completion of

## Phase 1 — Foundation (Weeks 1–2)

1. **T1 (P0)** Project scaffolding (web app, backend, CI)  
   Dependencies: none
2. **T2 (P0)** Authentication and session management  
   Dependencies: T1
3. **T3 (P0)** Baseline schema (users, tenants, transactions, budgets, chat, audit)  
   Dependencies: T1
4. **T4 (P0)** Onboarding flow with profile-type branching  
   Dependencies: T2, T3
5. **T5 (P0)** Localization setup (Spanish default, English fallback)  
   Dependencies: T1

## Phase 2 — Core B2C Experience (Weeks 3–4)

6. **T6 (P0)** Transaction CRUD UI + APIs  
   Dependencies: T3, T4
7. **T7 (P0)** Category and recurring transaction engine  
   Dependencies: T6
8. **T8 (P0)** Budget goals and monthly summary aggregation  
   Dependencies: T6
9. **T9 (P0)** Dashboard charts and trend cards  
   Dependencies: T8
10. **T10 (P1)** Advanced filters/search for transactions  
    Dependencies: T6

## Phase 3 — Knowledge + Integration Base (Weeks 5–6)

11. **T11 (P0)** Knowledge content schema + ingestion pipeline  
    Dependencies: T3
12. **T12 (P0)** Embedding/chunking + retrieval service  
    Dependencies: T11
13. **T13 (P0)** Chat UI with source citation rendering  
    Dependencies: T12
14. **T14 (P0)** ERP connector skeleton + credential management  
    Dependencies: T2, T3
15. **T15 (P1)** External market/rates data adapter  
    Dependencies: T1

## Phase 4 — AI Actions + ERP Operations (Weeks 7–8)

16. **T16 (P0)** Natural language extraction tool for finance entries  
    Dependencies: T13
17. **T17 (P0)** Confirmation workflow before conversational writes  
    Dependencies: T16, T6
18. **T18 (P0)** Calculator toolset (5 calculators)  
    Dependencies: T6
19. **T19 (P0)** ERP read operations (invoices/contacts/accounting)  
    Dependencies: T14
20. **T20 (P0)** ERP write operations with validation and audit logs  
    Dependencies: T19
21. **T21 (P1)** Chat memory and user preference persistence  
    Dependencies: T13

## Phase 5 — Hardening + Launch (Weeks 9–11)

22. **T22 (P0)** E2E test coverage (manual + Playwright baseline)  
    Dependencies: T9, T17, T20
23. **T23 (P0)** Security review (tenant isolation, credential protection, auth abuse controls)  
    Dependencies: T20
24. **T24 (P0)** Performance tuning and latency verification for ERP actions  
    Dependencies: T20
25. **T25 (P0)** Beta release packaging and demo preparation  
    Dependencies: T22, T23, T24
26. **T26 (P1)** Observability dashboard (error rates, integration health)  
    Dependencies: T24

## Post-MVP Backlog

27. **T27 (P1)** Automated banking data import integration  
28. **T28 (P1)** Extended tax workflow automation  
29. **T29 (P2)** Credit profile enhancement tools  
30. **T30 (P2)** Enterprise white-label controls

## Critical Path

T1 -> T2/T3 -> T6 -> T8 -> T9 -> T22 -> T25  
T1 -> T3 -> T11 -> T12 -> T13 -> T16 -> T17 -> T22 -> T25  
T1 -> T2/T3 -> T14 -> T19 -> T20 -> T23/T24 -> T25
