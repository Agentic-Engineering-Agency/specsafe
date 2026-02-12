/**
 * Built-in Elicitation Flows
 * Provides pre-configured flows for common spec creation scenarios
 */

import type { ElicitationFlow } from './types.js';

/**
 * Quick flow: 5 essential questions for rapid spec creation
 */
export const quickFlow: ElicitationFlow = {
  id: 'quick',
  name: 'Quick Spec',
  description: 'Fast spec creation with minimal questions (5 steps)',
  steps: [
    {
      id: 'name',
      prompt: 'What is the name of this feature or change?',
      type: 'text',
      required: true,
      validate: (value) => {
        if (typeof value !== 'string' || value.trim().length === 0) {
          return 'Name is required';
        }
        if (value.trim().length < 3) {
          return 'Name must be at least 3 characters';
        }
        return true;
      },
    },
    {
      id: 'description',
      prompt: 'Provide a brief description',
      type: 'text',
      required: true,
      validate: (value) => {
        if (typeof value !== 'string' || value.trim().length === 0) {
          return 'Description is required';
        }
        return true;
      },
    },
    {
      id: 'type',
      prompt: 'What type of change is this?',
      type: 'choice',
      choices: ['feature', 'bugfix', 'migration', 'security'],
      default: 'feature',
      required: true,
    },
    {
      id: 'priority',
      prompt: 'What is the priority?',
      type: 'choice',
      choices: ['critical', 'high', 'medium', 'low'],
      default: 'medium',
      required: true,
    },
    {
      id: 'requirements',
      prompt: 'List the key requirements (one per line)',
      type: 'text',
      required: true,
      validate: (value) => {
        if (typeof value !== 'string' || value.trim().length === 0) {
          return 'At least one requirement is needed';
        }
        return true;
      },
    },
  ],
};

/**
 * Full flow: Comprehensive spec elicitation (15+ steps)
 */
export const fullFlow: ElicitationFlow = {
  id: 'full',
  name: 'Full Spec',
  description: 'Complete spec creation with comprehensive questions',
  steps: [
    {
      id: 'name',
      prompt: 'What is the name of this feature or change?',
      type: 'text',
      required: true,
      validate: (value) => {
        if (typeof value !== 'string' || value.trim().length === 0) {
          return 'Name is required';
        }
        if (value.trim().length < 3) {
          return 'Name must be at least 3 characters';
        }
        return true;
      },
    },
    {
      id: 'description',
      prompt: 'Provide a detailed description',
      type: 'text',
      required: true,
    },
    {
      id: 'type',
      prompt: 'What type of change is this?',
      type: 'choice',
      choices: ['feature', 'bugfix', 'migration', 'security', 'performance', 'refactoring'],
      default: 'feature',
      required: true,
    },
    {
      id: 'priority',
      prompt: 'What is the priority?',
      type: 'choice',
      choices: ['critical', 'high', 'medium', 'low'],
      default: 'medium',
      required: true,
    },
    {
      id: 'scope',
      prompt: 'What is the scope of this change?',
      type: 'text',
      required: false,
    },
    {
      id: 'stakeholders',
      prompt: 'Who are the stakeholders? (comma-separated)',
      type: 'text',
      required: false,
    },
    {
      id: 'requirements',
      prompt: 'List the detailed requirements (one per line)',
      type: 'text',
      required: true,
    },
    {
      id: 'has_security',
      prompt: 'Does this have security implications?',
      type: 'confirm',
      default: false,
      required: true,
    },
    {
      id: 'security_considerations',
      prompt: 'What are the security considerations?',
      type: 'text',
      required: true,
      condition: (answers) => answers.has_security === true,
    },
    {
      id: 'testing_strategy',
      prompt: 'Describe the testing strategy',
      type: 'text',
      required: true,
    },
    {
      id: 'has_performance',
      prompt: 'Are there specific performance requirements?',
      type: 'confirm',
      default: false,
      required: true,
    },
    {
      id: 'performance_requirements',
      prompt: 'What are the performance requirements?',
      type: 'text',
      required: true,
      condition: (answers) => answers.has_performance === true,
    },
    {
      id: 'dependencies',
      prompt: 'List any dependencies (systems, APIs, libraries)',
      type: 'text',
      required: false,
    },
    {
      id: 'timeline',
      prompt: 'What is the estimated timeline?',
      type: 'text',
      required: false,
    },
    {
      id: 'risks',
      prompt: 'What are the potential risks?',
      type: 'text',
      required: false,
    },
    {
      id: 'acceptance_criteria',
      prompt: 'What are the acceptance criteria?',
      type: 'text',
      required: true,
    },
    {
      id: 'notes',
      prompt: 'Any additional notes or context?',
      type: 'text',
      required: false,
    },
  ],
};

/**
 * EARS flow: EARS-focused requirement elicitation
 */
export const earsFlow: ElicitationFlow = {
  id: 'ears',
  name: 'EARS Spec',
  description: 'EARS-formatted specification with structured requirements',
  steps: [
    {
      id: 'name',
      prompt: 'What is the name of this feature?',
      type: 'text',
      required: true,
      validate: (value) => {
        if (typeof value !== 'string' || value.trim().length === 0) {
          return 'Name is required';
        }
        return true;
      },
    },
    {
      id: 'description',
      prompt: 'Provide a description',
      type: 'text',
      required: true,
    },
    {
      id: 'req_count',
      prompt: 'How many requirements do you want to define?',
      type: 'text',
      required: true,
      default: '3',
      validate: (value) => {
        const num = parseInt(value, 10);
        if (isNaN(num) || num < 1 || num > 20) {
          return 'Please enter a number between 1 and 20';
        }
        return true;
      },
    },
    {
      id: 'req_1_type',
      prompt: 'Requirement 1 - Type',
      type: 'choice',
      choices: ['ubiquitous', 'event', 'state', 'optional', 'unwanted'],
      default: 'ubiquitous',
      required: true,
      condition: (answers) => parseInt(answers.req_count, 10) >= 1,
    },
    {
      id: 'req_1_trigger',
      prompt: 'Requirement 1 - What is the trigger/event?',
      type: 'text',
      required: true,
      condition: (answers) => answers.req_1_type === 'event',
    },
    {
      id: 'req_1_precondition',
      prompt: 'Requirement 1 - What is the precondition/state?',
      type: 'text',
      required: true,
      condition: (answers) => answers.req_1_type === 'state' || answers.req_1_type === 'optional',
    },
    {
      id: 'req_1_response',
      prompt: 'Requirement 1 - What should the system do?',
      type: 'text',
      required: true,
      condition: (answers) => parseInt(answers.req_count, 10) >= 1,
    },
    {
      id: 'req_2_type',
      prompt: 'Requirement 2 - Type',
      type: 'choice',
      choices: ['ubiquitous', 'event', 'state', 'optional', 'unwanted'],
      default: 'ubiquitous',
      required: true,
      condition: (answers) => parseInt(answers.req_count, 10) >= 2,
    },
    {
      id: 'req_2_trigger',
      prompt: 'Requirement 2 - What is the trigger/event?',
      type: 'text',
      required: true,
      condition: (answers) => answers.req_2_type === 'event' && parseInt(answers.req_count, 10) >= 2,
    },
    {
      id: 'req_2_precondition',
      prompt: 'Requirement 2 - What is the precondition/state?',
      type: 'text',
      required: true,
      condition: (answers) => (answers.req_2_type === 'state' || answers.req_2_type === 'optional') && parseInt(answers.req_count, 10) >= 2,
    },
    {
      id: 'req_2_response',
      prompt: 'Requirement 2 - What should the system do?',
      type: 'text',
      required: true,
      condition: (answers) => parseInt(answers.req_count, 10) >= 2,
    },
    {
      id: 'req_3_type',
      prompt: 'Requirement 3 - Type',
      type: 'choice',
      choices: ['ubiquitous', 'event', 'state', 'optional', 'unwanted'],
      default: 'ubiquitous',
      required: true,
      condition: (answers) => parseInt(answers.req_count, 10) >= 3,
    },
    {
      id: 'req_3_trigger',
      prompt: 'Requirement 3 - What is the trigger/event?',
      type: 'text',
      required: true,
      condition: (answers) => answers.req_3_type === 'event' && parseInt(answers.req_count, 10) >= 3,
    },
    {
      id: 'req_3_precondition',
      prompt: 'Requirement 3 - What is the precondition/state?',
      type: 'text',
      required: true,
      condition: (answers) => (answers.req_3_type === 'state' || answers.req_3_type === 'optional') && parseInt(answers.req_count, 10) >= 3,
    },
    {
      id: 'req_3_response',
      prompt: 'Requirement 3 - What should the system do?',
      type: 'text',
      required: true,
      condition: (answers) => parseInt(answers.req_count, 10) >= 3,
    },
  ],
};
