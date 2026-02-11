---
name: specsafe-new
description: Create a new SpecSafe specification. Use when starting a new feature, fix, or modification following the SpecSafe TDD workflow.
license: MIT
metadata:
  author: Agentic Engineering
  version: "1.0"
---

Create a new SpecSafe specification using the SPEC → TEST → CODE → QA → COMPLETE workflow.

**When to use:**
- Starting a new feature
- Beginning a bug fix with TDD
- Creating a new project specification

**Input**: The user's request should include a spec name (kebab-case) OR a description of what they want to build.

**Steps**

1. **If no clear input provided, ask what they want to build**

   Ask:
   > "What spec do you want to create? Describe what you want to build or fix."

   From their description, derive a kebab-case name (e.g., "add user authentication" → `add-user-auth`).

2. **Validate the specsafe project is initialized**

   Check if `specsafe.config.json` exists in the current directory.
   If not, advise: "Run `specsafe init` first to initialize a SpecSafe project."

3. **Create the spec**

   ```bash
   specsafe new "<name>"
   ```

   This creates a scaffolded spec at `specs/active/SPEC-{DATE}-XXX.md`.

4. **Show the spec location and next steps**

   Summarize:
   - Spec ID and location
   - Current stage: SPEC
   - Next: Edit the spec to add requirements
   - Then: Run `specsafe test` to generate tests and proceed to TEST stage

**Output**

After creating the spec:
- Spec ID and file location
- Reminder to define requirements using SHALL/MUST language
- Prompt: "Edit the spec file to add requirements and scenarios. Ready to generate tests? Run `specsafe test <id>`"

**Guardrails**
- Do NOT proceed without a valid kebab-case name
- Ensure specsafe project is initialized first
- If a spec with similar name exists, ask if they want to continue that one instead