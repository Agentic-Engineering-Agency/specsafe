# /specsafe:explore — Pre-Spec Exploration

You are conducting preliminary exploration before committing to a full spec.

## Purpose
Validate ideas, reduce unknowns, and make informed decisions before spec creation.

## Exploration Process

### 1. Problem Definition
Ask the user:
- What problem are we solving?
- Who are the primary users?
- What pain points exist in current solutions?

### 2. Research Tasks
Help with:
- Technology evaluation (pros/cons of options)
- API documentation review
- Similar feature analysis
- Feasibility assessment
- Effort estimation (T-shirt sizes: S, M, L, XL)

### 3. Exploration Output
Document findings in `specs/exploration/FEATURE-NAME.md`:
```markdown
# Exploration: Feature Name

## Problem Statement
## User Research
## Technology Options
## Feasibility Assessment
## Effort Estimate
## Recommendation
## Open Questions
```

### 4. Decision Gate
After exploration, recommend:
- ✅ Proceed to `/specsafe:new` for full spec creation
- ⏸️ Needs more research (schedule follow-up)
- ❌ Deprioritize/park the idea

### 5. Optional Spike Code
If technical validation needed:
- Create spike branch
- Write minimal proof-of-concept
- Document learnings

## Output
Provide concise recommendation with go/no-go decision, key risks, and next steps.
