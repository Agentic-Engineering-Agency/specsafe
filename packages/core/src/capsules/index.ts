/**
 * Capsules Module
 * Story context capsules for attaching contextual stories/notes to specs
 */

// Types
export type {
  Capsule,
  CapsuleCollection,
  CapsuleType,
  CapsuleFilter,
  DateRange,
  CapsuleTemplate,
  TemplateField,
} from './types.js';

// Manager
export { CapsuleManager, type CapsuleManagerOptions } from './capsules.js';

// Templates
export {
  USER_STORY_TEMPLATE,
  TECHNICAL_CONTEXT_TEMPLATE,
  BUSINESS_JUSTIFICATION_TEMPLATE,
  DISCOVERY_NOTE_TEMPLATE,
  BUILTIN_TEMPLATES,
  TEMPLATE_NAMES,
  getTemplate,
  listTemplates,
  isValidTemplateType,
  getTemplateChoices,
  formatContent,
  parseContent,
} from './templates.js';

// Validation
export {
  VALIDATION_LIMITS,
  sanitizeString,
  validateSpecId,
  validateTitle,
  validateAuthor,
  validateContent,
  validateTags,
  validateFilter,
  validateCapsuleType,
  isValidCapsuleType,
} from './validation.js';
