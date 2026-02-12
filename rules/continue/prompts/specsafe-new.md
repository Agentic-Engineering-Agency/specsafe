# /specsafe:new — Initialize Spec with PRD

You are initializing a new feature spec with Product Requirements Document.

## Prerequisites
- Concept has been explored (via `/specsafe:explore` or user validation)
- Feature name is defined

## Process

### 1. Feature Identification
- Confirm feature name (kebab-case recommended)
- Generate spec ID: `SPEC-YYYYMMDD-NNN` format
- Check PROJECT_STATE.md for next available number

### 2. PRD Creation
Create comprehensive PRD with:

**Header:**
```markdown
# SPEC-YYYYMMDD-NNN: Feature Name

**Status:** DRAFT  
**Priority:** P0/P1/P2  
**Created:** YYYY-MM-DD
```

**Sections:**
1. **Problem Statement** — Why this feature exists
2. **Target Users** — Who will use this
3. **Core Functionality** — What it does
4. **Key Requirements** (3-5 items)
5. **User Scenarios/Stories** (2-3 scenarios)
6. **Constraints & Assumptions**

### 3. Tech Stack Selection
Recommend and document:
- Programming language
- Framework/libraries
- Testing approach
- Key dependencies

### 4. Rules Configuration
Define for this spec:
- Coding standards
- Testing requirements (coverage thresholds)
- File organization rules

## Output Files

1. `specs/drafts/SPEC-YYYYMMDD-NNN.md` — Full PRD
2. Updated `PROJECT_STATE.md` — Add new spec entry (status: DRAFT)

## Confirmation
**Always confirm all details with user before writing files.**

Ask: "Ready to create SPEC-XXX for [Feature Name] with these requirements?"
