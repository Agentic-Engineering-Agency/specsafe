/**
 * EARS Template Generator
 * Creates spec templates with EARS requirement format
 */

/**
 * Generate an EARS-formatted spec template
 */
export function generateEARSTemplate(
  id: string,
  name: string,
  author: string,
  priority: 'P0' | 'P1' | 'P2' = 'P1'
): string {
  const today = new Date().toISOString().split('T')[0];
  
  return `# ${name} Specification (EARS Format)

**ID:** ${id}
**Status:** SPEC
**Created:** ${today}
**Author:** ${author}
**Priority:** ${priority}

---

## EARS Guide

This spec uses **EARS (Easy Approach to Requirements Syntax)** for testable requirements.

### EARS Patterns

#### 🌐 Ubiquitous (Always Active)
**Pattern:** "The system shall [action]"  
**Use when:** Requirement applies at all times, no conditions

**Example:**
- The system shall encrypt all data at rest using AES-256
- The system shall log all authentication attempts

---

#### ⚡ Event-Driven (Triggered by Events)
**Pattern:** "When [event], the system shall [action]"  
**Use when:** Requirement is triggered by a specific event

**Example:**
- When user clicks "Submit", the system shall validate all form fields
- When payment is received, the system shall send a confirmation email

---

#### 🔄 State-Driven (Active During State)
**Pattern:** "While [state], the system shall [action]"  
**Use when:** Requirement applies during a specific state

**Example:**
- While user session is active, the system shall refresh the authentication token every 30 minutes
- While processing a transaction, the system shall prevent duplicate submissions

---

#### 🔀 Optional (Feature Available)
**Pattern:** "Where [condition], the system shall [action]"  
**Use when:** Requirement applies when optional feature/condition is present

**Example:**
- Where user has admin privileges, the system shall display the settings menu
- Where GPS is enabled, the system shall track location history

---

#### 🚫 Unwanted Behavior (Error Handling)
**Pattern:** "If [unwanted condition], then the system shall [action]"  
**Use when:** Requirement handles errors or unwanted states

**Example:**
- If network connection is lost, then the system shall queue requests for retry
- If user enters invalid credentials 3 times, then the system shall lock the account

---

#### 🔗 Complex (Multiple Conditions)
**Pattern:** "When [event], while [state], the system shall [action]"  
**Use when:** Multiple conditions must be met

**Example:**
- When user uploads a file, while file size exceeds 10MB, the system shall compress the file
- Where user has premium subscription, when downloading content, the system shall allow offline access

---

## PRD (Product Requirements Document)

### Problem Statement
<!-- Describe the problem this feature solves -->

### User Stories
\`\`\`
As a [type of user]
I want [some goal]
So that [some reason]
\`\`\`

### Success Criteria
- [ ] All requirements follow EARS patterns
- [ ] All requirements are testable
- [ ] All tests pass

---

## Requirements (EARS Format)

### Functional Requirements

| ID | EARS Pattern | Requirement | Priority |
|----|--------------|-------------|----------|
| FR-1 | Ubiquitous | The system shall [action] | P0 |
| FR-2 | Event | When [event], the system shall [action] | P0 |
| FR-3 | State | While [state], the system shall [action] | P1 |
| FR-4 | Optional | Where [condition], the system shall [action] | P1 |
| FR-5 | Unwanted | If [error], then the system shall [action] | P2 |

**Example Requirements:**
- **Ubiquitous:** The system shall store all user data in encrypted format
- **Event-driven:** When user completes checkout, the system shall generate an order confirmation
- **State-driven:** While user is in offline mode, the system shall cache all changes locally
- **Optional:** Where user enables notifications, the system shall send real-time alerts
- **Unwanted:** If API request fails, then the system shall retry with exponential backoff

### Non-Functional Requirements

| ID | EARS Pattern | Requirement | Metric |
|----|--------------|-------------|--------|
| NFR-1 | Ubiquitous | The system shall respond to requests | < 200ms (p95) |
| NFR-2 | State | While under peak load, the system shall maintain availability | > 99.9% |

**Example Requirements:**
- The system shall handle up to 10,000 concurrent users
- While processing batch jobs, the system shall maintain CPU usage below 80%

---

## Scenarios (Given/When/Then)

EARS requirements naturally map to test scenarios:

### Scenario 1: [EARS Pattern Type]
**Requirement:** [Copy EARS requirement here]

- **Given** [initial state/context]
- **When** [action/event occurs]
- **Then** [expected outcome matching the EARS action]

**Example:**
**Requirement:** When user submits payment form, the system shall validate credit card number

- **Given** user has entered payment information
- **When** user clicks "Pay Now" button
- **Then** system validates card number format
- **And** system displays validation errors if invalid
- **And** system processes payment if valid

---

### Scenario 2: [Another Pattern]
**Requirement:** [Another EARS requirement]

- **Given** [context]
- **When** [trigger]
- **Then** [outcome]

---

## Technical Approach

### Implementation Checklist
For each EARS requirement:
- [ ] Write unit test matching the EARS action
- [ ] Implement the action handler
- [ ] Add integration test for the complete flow
- [ ] Verify error handling (for "unwanted" patterns)

### Testing Strategy

**Event-driven requirements:**
- Test the event trigger
- Test the action execution
- Test edge cases (event occurs multiple times, etc.)

**State-driven requirements:**
- Test state entry/exit
- Test action during state
- Test behavior outside the state

**Unwanted behavior requirements:**
- Test the error condition
- Test the recovery action
- Test system state after recovery

---

## EARS Quality Checklist

Before moving to TEST stage, verify:

- [ ] All requirements use EARS patterns (ubiquitous, event, state, optional, unwanted, or complex)
- [ ] Each requirement has exactly one "shall" statement
- [ ] Each requirement is testable (can write pass/fail test)
- [ ] No ambiguous words (should, may, might, could)
- [ ] No vague terms (appropriate, reasonable, user-friendly)
- [ ] Modal verbs are consistent (shall/must/will, not mixed)
- [ ] Requirements are atomic (one requirement = one capability)
- [ ] Complex requirements are justified (can't be split)

Run: \`specsafe qa ${id} --ears\` to validate EARS compliance

---

## Notes

### EARS Benefits
1. **Testability:** Each pattern directly maps to test scenarios
2. **Clarity:** Explicit triggers and conditions
3. **Completeness:** Forces you to think about edge cases (unwanted behavior)
4. **Consistency:** Standardized language across team

### Common Mistakes
- ❌ "The system should validate input" → Use "shall" not "should"
- ❌ "The system shall be fast" → Specify measurable criteria
- ❌ "When user clicks button, system processes data" → Add "the system shall"
- ❌ "The system shall validate and save data" → Split into two requirements

---

*Generated by SpecSafe with EARS format*
`;
}

/**
 * Generate EARS examples for a specific domain
 */
export function generateEARSExamples(domain: 'web' | 'mobile' | 'api' | 'embedded'): {
  ubiquitous: string[];
  event: string[];
  state: string[];
  optional: string[];
  unwanted: string[];
  complex: string[];
} {
  const examples = {
    web: {
      ubiquitous: [
        'The system shall use HTTPS for all connections',
        'The system shall validate all user inputs before processing',
        'The system shall maintain session state using secure cookies'
      ],
      event: [
        'When user submits the form, the system shall validate all required fields',
        'When page load time exceeds 3 seconds, the system shall display a loading indicator',
        'When user clicks logout, the system shall clear all session data'
      ],
      state: [
        'While user is authenticated, the system shall display the user dashboard',
        'While form validation is in progress, the system shall disable the submit button',
        'While processing payment, the system shall prevent duplicate submissions'
      ],
      optional: [
        'Where user has enabled dark mode, the system shall apply dark color scheme',
        'Where user has admin role, the system shall display administrative controls',
        'Where browser supports service workers, the system shall enable offline mode'
      ],
      unwanted: [
        'If session expires, then the system shall redirect to login page',
        'If API request fails, then the system shall display error message to user',
        'If user enters invalid email format, then the system shall show format hint'
      ],
      complex: [
        'When user uploads a file, while file size exceeds 5MB, the system shall compress the file before upload',
        'Where user has premium subscription, when downloading content, the system shall allow offline access'
      ]
    },
    mobile: {
      ubiquitous: [
        'The system shall support iOS 15.0 and later',
        'The system shall cache user preferences locally',
        'The system shall request user permission before accessing location data'
      ],
      event: [
        'When app enters background, the system shall save current state',
        'When user pulls to refresh, the system shall reload content from server',
        'When notification is received, the system shall display badge count'
      ],
      state: [
        'While app is in offline mode, the system shall queue all network requests',
        'While device battery is below 20%, the system shall reduce background sync frequency',
        'While user is viewing media, the system shall prevent screen lock'
      ],
      optional: [
        'Where device supports biometric authentication, the system shall offer fingerprint login',
        'Where user grants camera permission, the system shall enable photo upload',
        'Where device supports push notifications, the system shall enable real-time alerts'
      ],
      unwanted: [
        'If network connection is lost, then the system shall display offline banner',
        'If location permission is denied, then the system shall use default location',
        'If app crashes, then the system shall restore previous state on relaunch'
      ],
      complex: [
        'When user takes a photo, while storage is nearly full, the system shall compress image quality',
        'Where user has disabled cellular data, when uploading content, the system shall wait for WiFi connection'
      ]
    },
    api: {
      ubiquitous: [
        'The system shall authenticate all API requests using JWT tokens',
        'The system shall rate limit requests to 100 per minute per API key',
        'The system shall log all API requests with timestamp and user ID'
      ],
      event: [
        'When API receives POST request, the system shall validate request body schema',
        'When rate limit is exceeded, the system shall return 429 Too Many Requests',
        'When authentication fails, the system shall return 401 Unauthorized'
      ],
      state: [
        'While maintenance mode is active, the system shall return 503 Service Unavailable',
        'While processing webhook, the system shall prevent concurrent processing of same event',
        'While database connection is unavailable, the system shall return 503 with retry-after header'
      ],
      optional: [
        'Where client provides API version header, the system shall use specified API version',
        'Where request includes pagination parameters, the system shall return paginated results',
        'Where client supports compression, the system shall compress response with gzip'
      ],
      unwanted: [
        'If request payload exceeds 10MB, then the system shall return 413 Payload Too Large',
        'If database query times out, then the system shall return 504 Gateway Timeout',
        'If request contains invalid JSON, then the system shall return 400 Bad Request with error details'
      ],
      complex: [
        'When API receives file upload, while file type is not allowed, the system shall return 415 Unsupported Media Type',
        'Where request includes webhook callback URL, when processing completes, the system shall POST results to callback'
      ]
    },
    embedded: {
      ubiquitous: [
        'The system shall monitor sensor readings every 100ms',
        'The system shall maintain operation within temperature range -40°C to 85°C',
        'The system shall consume less than 500mW in active mode'
      ],
      event: [
        'When button is pressed, the system shall debounce input for 50ms',
        'When power supply drops below 3.3V, the system shall trigger low battery warning',
        'When sensor detects motion, the system shall activate recording mode'
      ],
      state: [
        'While in sleep mode, the system shall reduce power consumption to < 10μW',
        'While calibrating sensors, the system shall ignore external inputs',
        'While firmware update is in progress, the system shall disable all other operations'
      ],
      optional: [
        'Where external RTC is available, the system shall use hardware clock',
        'Where temperature sensor is connected, the system shall log temperature data',
        'Where SD card is inserted, the system shall store logs to external storage'
      ],
      unwanted: [
        'If watchdog timer expires, then the system shall perform hardware reset',
        'If sensor reading is out of range, then the system shall use last known good value',
        'If memory allocation fails, then the system shall log error and continue with reduced functionality'
      ],
      complex: [
        'When motion is detected, while device is in power-save mode, the system shall wake up and begin recording',
        'Where battery level is below 10%, when sensor reading is requested, the system shall reduce sampling rate to conserve power'
      ]
    }
  };
  
  return examples[domain];
}
