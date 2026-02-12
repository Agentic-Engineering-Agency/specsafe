Create a new spec with PRD, tech stack selection, and rules configuration

You are initializing a new feature spec. Guide the user through:

1. **Feature Identification**
   - Ask for a concise feature name (kebab-case)
   - Suggest a spec ID format: SPEC-YYYYMMDD-NNN

2. **PRD Creation**
   - Prompt for: feature purpose, target user, core functionality
   - Define 3-5 key requirements
   - List 2-3 user scenarios/stories
   - Identify constraints and assumptions

3. **Tech Stack Selection**
   - Based on the feature, recommend appropriate technologies
   - Ask for confirmation or modifications
   - Document: language, framework, testing approach, key libraries

4. **Rules Configuration**
   - Define coding standards specific to this spec
   - Set testing requirements (coverage thresholds, test types)
   - Establish file organization rules

5. **Output Generation**
   Create files:
   - `specs/drafts/SPEC-ID.md` — Full PRD with requirements, scenarios, tech stack, rules
   - Update `PROJECT_STATE.md` with new spec entry (status: DRAFT)

Confirm all details with the user before writing files.
