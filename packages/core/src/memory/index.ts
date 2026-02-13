/**
 * Project Memory & Steering System
 * Maintains project context across spec sessions
 */

// Types
export type {
  ProjectMemory,
  Decision,
  Pattern,
  PatternExample,
  MemoryConstraint,
  HistoryEntry,
  SteeringInput,
  SteeringOutput,
  Warning,
  Recommendation
} from './types.js';

// Core classes
export { ProjectMemoryManager } from './memory.js';
export { SteeringEngine } from './steering.js';

// Validation utilities
export {
  validateProjectMemory,
  validateDecision,
  validatePattern,
  validateConstraint,
  validateHistoryEntry,
  isValidSpecId as validateSpecId,
  validateProjectId,
  sanitizeString,
  sanitizePath,
  redactSensitiveInfo
} from './validation.js';
