# @specsafe/test-gen

<p align="center">
  <img src="https://img.shields.io/npm/v/@specsafe/test-gen.svg" alt="npm version">
  <img src="https://img.shields.io/npm/l/@specsafe/test-gen.svg" alt="license">
</p>

Test generation library for the SpecSafe spec-driven development framework. Parses specifications and generates TypeScript test files.

## Installation

```bash
npm install @specsafe/test-gen
```

## What It Provides

- **ScenarioParser** - Parse requirement scenarios from spec files
- **TypeScriptTestGenerator** - Generate TypeScript test files from parsed requirements
- **Framework Support** - Vitest (default) and Jest

## API Reference

### ScenarioParser

Parses specification files and extracts requirements.

```typescript
import { ScenarioParser } from '@specsafe/test-gen';

const parser = new ScenarioParser();
```

#### `parseRequirements(specContent: string): Requirement[]`

Parse requirements from spec content.

```typescript
const specContent = `
## Requirements

### REQ-001: User Login
**Given** a registered user with email "user@example.com"
**When** they enter the correct password
**Then** they should be redirected to the dashboard

### REQ-002: Invalid Password
**Given** a registered user
**When** they enter an incorrect password
**Then** an error message should be displayed
`;

const requirements = parser.parseRequirements(specContent);
console.log(requirements);
// [
//   {
//     id: 'REQ-001',
//     title: 'User Login',
//     given: 'a registered user with email "user@example.com"',
//     when: 'they enter the correct password',
//     then: 'they should be redirected to the dashboard'
//   },
//   ...
// ]
```

---

### TypeScriptTestGenerator

Generates TypeScript test files from requirements.

```typescript
import { TypeScriptTestGenerator } from '@specsafe/test-gen';

const generator = new TypeScriptTestGenerator({
  framework: 'vitest',  // or 'jest'
  specId: 'user-authentication'
});
```

#### `generate(requirements: Requirement[]): string`

Generate test file content.

```typescript
const requirements = [
  {
    id: 'REQ-001',
    title: 'User Login',
    given: 'a registered user',
    when: 'they enter valid credentials',
    then: 'they should be logged in'
  }
];

const testCode = generator.generate(requirements);
console.log(testCode);
// Output:
// import { describe, it, expect } from 'vitest';
// 
// describe('User Authentication', () => {
//   it('REQ-001: User Login', () => {
//     // Given: a registered user
//     // When: they enter valid credentials
//     // Then: they should be logged in
//     expect(true).toBe(true);
//   });
// });
```

---

## Framework Support

### Vitest (Default)

```typescript
const generator = new TypeScriptTestGenerator({
  framework: 'vitest',
  specId: 'my-feature'
});
```

Generates tests using Vitest's `describe`, `it`, and `expect`:

```typescript
import { describe, it, expect } from 'vitest';

describe('My Feature', () => {
  it('REQ-001: Requirement Title', () => {
    // Test implementation
  });
});
```

### Jest

```typescript
const generator = new TypeScriptTestGenerator({
  framework: 'jest',
  specId: 'my-feature'
});
```

Generates tests using Jest's globals:

```typescript
describe('My Feature', () => {
  it('REQ-001: Requirement Title', () => {
    // Test implementation
  });
});
```

---

## Usage Examples

### Basic Usage

```typescript
import { ScenarioParser, TypeScriptTestGenerator } from '@specsafe/test-gen';
import { readFileSync, writeFileSync } from 'fs';

// Read spec file
const specContent = readFileSync('./specs/active/login.spec.md', 'utf-8');

// Parse requirements
const parser = new ScenarioParser();
const requirements = parser.parseRequirements(specContent);

// Generate tests
const generator = new TypeScriptTestGenerator({
  framework: 'vitest',
  specId: 'login'
});

const testCode = generator.generate(requirements);

// Write to file
writeFileSync('./src/specs/login.spec.ts', testCode);
```

### Custom Test Body

The generated tests include comments based on the Gherkin-style requirements:

```typescript
// Given: a registered user with valid credentials
// When: they submit the login form
// Then: they should be authenticated
```

You fill in the actual test implementation:

```typescript
it('REQ-001: User Login', () => {
  // Given: a registered user with valid credentials
  const user = createUser({ email: 'test@example.com', password: 'secret' });
  
  // When: they submit the login form
  const result = login(user.email, user.password);
  
  // Then: they should be authenticated
  expect(result.authenticated).toBe(true);
});
```

### Processing Multiple Specs

```typescript
import { ScenarioParser, TypeScriptTestGenerator } from '@specsafe/test-gen';
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const parser = new ScenarioParser();
const specsDir = './specs/active';
const outputDir = './src/specs';

const specFiles = readdirSync(specsDir).filter(f => f.endsWith('.spec.md'));

for (const file of specFiles) {
  const specId = file.replace('.spec.md', '');
  const content = readFileSync(join(specsDir, file), 'utf-8');
  
  const requirements = parser.parseRequirements(content);
  
  const generator = new TypeScriptTestGenerator({
    framework: 'vitest',
    specId
  });
  
  const testCode = generator.generate(requirements);
  writeFileSync(join(outputDir, `${specId}.spec.ts`), testCode);
  
  console.log(`Generated tests for ${specId}`);
}
```

---

## Specification Format

Requirements should follow this format in your spec files:

```markdown
## Requirements

### REQ-XXX: Requirement Title
**Given** [context]
**When** [action]
**Then** [expected result]
```

Where:
- `REQ-XXX` is a unique requirement ID (e.g., REQ-001, REQ-002)
- **Given** describes the initial context/state
- **When** describes the action taken
- **Then** describes the expected outcome

---

## License

MIT © Agentic Engineering
