/**
 * Memory Validation
 * Validates memory structure and data integrity
 */

import { normalize, resolve, sep } from 'path';
import type {
  ProjectMemory,
  Decision,
  Pattern,
  MemoryConstraint,
  HistoryEntry
} from './types.js';

/**
 * Sanitize a string to prevent injection attacks
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }
  // Remove null bytes and control characters except whitespace
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
}

/**
 * Validate a date object
 */
export function isValidDate(value: any): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Validate spec ID format (basic validation)
 */
export function isValidSpecId(specId: string): boolean {
  if (typeof specId !== 'string') {
    return false;
  }
  // Basic format: SPEC-YYYYMMDD-NNN or similar
  const specIdPattern = /^[A-Za-z0-9\-_]+$/;
  return specIdPattern.test(sanitizeString(specId)) && specId.length > 0 && specId.length <= 100;
}

/**
 * Validate decision object
 */
export function validateDecision(decision: any): decision is Decision {
  return (
    typeof decision === 'object' &&
    typeof decision.id === 'string' &&
    isValidSpecId(decision.specId) &&
    typeof decision.decision === 'string' &&
    typeof decision.rationale === 'string' &&
    Array.isArray(decision.alternatives) &&
    decision.alternatives.every((alt: any) => typeof alt === 'string') &&
    isValidDate(decision.timestamp) &&
    sanitizeString(decision.decision).length <= 1000 &&
    sanitizeString(decision.rationale).length <= 5000
  );
}

/**
 * Validate pattern example object
 */
export function validatePatternExample(example: any): example is { specId: string; context: string; snippet?: string } {
  if (typeof example !== 'object') {
    return false;
  }
  if (!isValidSpecId(example.specId)) {
    return false;
  }
  if (typeof example.context !== 'string' || example.context.length > 500) {
    return false;
  }
  if (example.snippet !== undefined && typeof example.snippet !== 'string') {
    return false;
  }
  return true;
}

/**
 * Validate pattern object
 */
export function validatePattern(pattern: any): pattern is Pattern {
  return (
    typeof pattern === 'object' &&
    typeof pattern.id === 'string' &&
    typeof pattern.name === 'string' &&
    typeof pattern.description === 'string' &&
    Array.isArray(pattern.examples) &&
    pattern.examples.every(validatePatternExample) &&
    typeof pattern.usageCount === 'number' &&
    pattern.usageCount >= 0 &&
    sanitizeString(pattern.name).length <= 100 &&
    sanitizeString(pattern.description).length <= 1000
  );
}

/**
 * Validate constraint object
 */
export function validateConstraint(constraint: any): constraint is MemoryConstraint {
  return (
    typeof constraint === 'object' &&
    typeof constraint.id === 'string' &&
    ['technical', 'business', 'architectural'].includes(constraint.type) &&
    typeof constraint.description === 'string' &&
    (constraint.source === undefined || typeof constraint.source === 'string') &&
    (constraint.specId === undefined || isValidSpecId(constraint.specId)) &&
    sanitizeString(constraint.description).length <= 500
  );
}

/**
 * Validate history entry object
 */
export function validateHistoryEntry(entry: any): entry is HistoryEntry {
  return (
    typeof entry === 'object' &&
    isValidDate(entry.timestamp) &&
    isValidSpecId(entry.specId) &&
    ['created', 'updated', 'completed', 'decision', 'pattern'].includes(entry.action) &&
    typeof entry.details === 'string' &&
    entry.details.length <= 1000
  );
}

/**
 * Validate project ID
 */
export function validateProjectId(projectId: string): boolean {
  if (typeof projectId !== 'string') {
    return false;
  }
  const sanitized = sanitizeString(projectId);
  return sanitized.length > 0 && sanitized.length <= 100;
}

/**
 * Validate complete project memory object
 */
export function validateProjectMemory(memory: any): memory is ProjectMemory {
  if (typeof memory !== 'object' || memory === null) {
    return false;
  }

  if (!validateProjectId(memory.projectId)) {
    return false;
  }

  if (!Array.isArray(memory.specs)) {
    return false;
  }
  if (!memory.specs.every((s: any) => isValidSpecId(s))) {
    return false;
  }

  if (!Array.isArray(memory.decisions)) {
    return false;
  }
  if (!memory.decisions.every(validateDecision)) {
    return false;
  }

  if (!Array.isArray(memory.patterns)) {
    return false;
  }
  if (!memory.patterns.every(validatePattern)) {
    return false;
  }

  if (!Array.isArray(memory.constraints)) {
    return false;
  }
  if (!memory.constraints.every(validateConstraint)) {
    return false;
  }

  if (!Array.isArray(memory.history)) {
    return false;
  }
  if (!memory.history.every(validateHistoryEntry)) {
    return false;
  }

  return true;
}

/**
 * Redact sensitive information from strings (basic implementation)
 */
export function redactSensitiveInfo(text: string): string {
  let redacted = text;

  redacted = redacted.replace(/(['"`]?api[_-]?key['"`]?\s*[:=]\s*['"`]?)([a-zA-Z0-9_\-]{10,})(['"`]?)/gi, '$1[REDACTED]$3');
  redacted = redacted.replace(/(sk-[a-zA-Z0-9_\-]{8,})/g, '[REDACTED]');
  redacted = redacted.replace(/(Bearer\s+)(eyJ[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+){0,2})/gi, '$1[REDACTED]');
  redacted = redacted.replace(/(eyJ[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+){0,2})/g, '[REDACTED]');
  redacted = redacted.replace(/(['"`]?password['"`]?\s*[:=]\s*['"`]?)([^'"\s]+)(['"`]?)/gi, '$1[REDACTED]$3');
  redacted = redacted.replace(/(['"`]?secret[_-]?key['"`]?\s*[:=]\s*['"`]?)([a-zA-Z0-9_\-]{10,})(['"`]?)/gi, '$1[REDACTED]$3');

  return redacted;
}

/**
 * Sanitize and validate a file path to prevent directory traversal
 */
export function sanitizePath(basePath: string, relativePath: string): string {
  const normalizedBase = resolve(normalize(basePath));
  const normalizedRelative = normalize(relativePath);

  const resolvedPath = resolve(normalizedBase, normalizedRelative);

  const baseWithSep = normalizedBase.endsWith(sep) ? normalizedBase : `${normalizedBase}${sep}`;
  if (resolvedPath !== normalizedBase && !resolvedPath.startsWith(baseWithSep)) {
    throw new Error('Invalid path: Attempted directory traversal detected');
  }

  return resolvedPath;
}
