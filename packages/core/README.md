# @specsafe/core

<p align="center">
  <img src="https://img.shields.io/npm/v/@specsafe/core.svg" alt="npm version">
  <img src="https://img.shields.io/npm/l/@specsafe/core.svg" alt="license">
</p>

Core workflow engine, types, and utilities for the SpecSafe spec-driven development framework.

## Installation

```bash
npm install @specsafe/core
```

## What It Provides

- **Workflow Engine** - Manage spec lifecycle from creation to archive
- **ProjectTracker** - Track project state and spec metadata
- **TypeScript Types** - Full type definitions for specs, requirements, and reports
- **Validation Utilities** - Schema validation and ID validation

## API Reference

### Workflow Class

The main class for managing spec workflows.

```typescript
import { Workflow } from '@specsafe/core';

const workflow = new Workflow({
  specsDir: './specs',
  projectName: 'My Project'
});
```

#### `createSpec(specId: string, content: string): Promise<Spec>`

Create a new specification.

```typescript
const spec = await workflow.createSpec('user-auth', `# User Authentication

## Requirements

### REQ-001: Login
**Given** a registered user
**When** they enter valid credentials
**Then** they should be logged in
`);
```

#### `moveToTest(specId: string): Promise<Spec>`

Move a spec to the "test" phase.

```typescript
const spec = await workflow.moveToTest('user-auth');
```

#### `moveToCode(specId: string): Promise<Spec>`

Move a spec to the "code" phase.

```typescript
const spec = await workflow.moveToCode('user-auth');
```

#### `moveToQA(specId: string, report?: QAReport): Promise<Spec>`

Transition a spec into QA review or mark QA as complete. Optionally accepts a QAReport to record results.

```typescript
const spec = await workflow.moveToQA('user-auth', {
  passed: true,
  notes: 'All tests passing'
});
```

#### `complete(specId: string): Promise<Spec>`

Mark a spec as complete.

```typescript
const spec = await workflow.complete('user-auth');
```

#### `archive(specId: string): Promise<Spec>`

Archive a completed spec.

```typescript
const spec = await workflow.archive('user-auth');
```

#### `getSpec(specId: string): Promise<Spec | null>`

Get a spec by ID.

```typescript
const spec = await workflow.getSpec('user-auth');
```

#### `listSpecs(phase?: Phase): Promise<Spec[]>`

List all specs or filter by phase.

```typescript
// All specs
const allSpecs = await workflow.listSpecs();

// Only active specs
const activeSpecs = await workflow.listSpecs('active');
```

---

### ProjectTracker Class

Track project-level state and metadata.

```typescript
import { ProjectTracker } from '@specsafe/core';

const tracker = new ProjectTracker('./specs');
```

#### `getProjectState(): Promise<ProjectState>`

Get the current project state.

```typescript
const state = await tracker.getProjectState();
console.log(state.activeSpecs.length);
console.log(state.completedSpecs.length);
```

#### `updateSpecStatus(specId: string, status: SpecStatus): Promise<void>`

Update the status of a spec.

```typescript
await tracker.updateSpecStatus('user-auth', 'in-progress');
```

---

### Validation Utilities

#### `validateSpecId(specId: string): boolean`

Validate a spec ID format.

```typescript
import { validateSpecId } from '@specsafe/core';

validateSpecId('user-auth');     // true
validateSpecId('user_auth');     // false (underscores not allowed)
validateSpecId('user-auth-123'); // true
```

---

## TypeScript Types

### Spec

```typescript
interface Spec {
  id: string;
  title: string;
  description: string;
  phase: Phase;
  status: SpecStatus;
  requirements: Requirement[];
  acceptanceCriteria: string[];
  technicalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  qaReport?: QAReport;
}
```

### Requirement

```typescript
interface Requirement {
  id: string;
  title: string;
  given: string;
  when: string;
  then: string;
}
```

### QAReport

```typescript
interface QAReport {
  passed: boolean;
  notes?: string;
  testedAt: Date;
  testedBy?: string;
}
```

### Phase

```typescript
type Phase = 'draft' | 'active' | 'test' | 'code' | 'qa' | 'completed' | 'archived';
```

### SpecStatus

```typescript
type SpecStatus = 'pending' | 'in-progress' | 'blocked' | 'completed';
```

---

## Usage Examples

### Basic Workflow

```typescript
import { Workflow } from '@specsafe/core';

async function main() {
  const workflow = new Workflow({
    specsDir: './specs',
    projectName: 'My App'
  });

  // Create a spec
  await workflow.createSpec('email-validation', `
# Email Validation

## Requirements

### REQ-001: Valid Email Format
**Given** an email input field
**When** the user enters "user@example.com"
**Then** the email should be marked as valid

### REQ-002: Invalid Email Format
**Given** an email input field
**When** the user enters "invalid-email"
**Then** an error message should be shown
`);

  // Move through phases
  await workflow.moveToTest('email-validation');
  await workflow.moveToCode('email-validation');
  await workflow.moveToQA('email-validation', { passed: true });
  await workflow.complete('email-validation');
}

main();
```

### Project Statistics

```typescript
import { ProjectTracker } from '@specsafe/core';

async function printStats() {
  const tracker = new ProjectTracker('./specs');
  const state = await tracker.getProjectState();

  console.log(`Active specs: ${state.activeSpecs.length}`);
  console.log(`Completed: ${state.completedSpecs.length}`);
  console.log(`Archived: ${state.archivedSpecs.length}`);
}
```

---

## License

MIT © Agentic Engineering
