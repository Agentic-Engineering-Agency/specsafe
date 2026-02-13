/**
 * Validation utilities for capsules
 */

import type { CapsuleType } from './types.js';

export const VALIDATION_LIMITS = {
  MAX_TITLE_LENGTH: 200,
  MAX_AUTHOR_LENGTH: 100,
  MAX_CONTENT_LENGTH: 100_000,
  MAX_TAG_LENGTH: 50,
  MAX_TAGS_COUNT: 20,
  MAX_SPEC_ID_LENGTH: 255,
} as const;

export function sanitizeString(input: string, maxLength: number, allowNewlines = false): string {
  if (typeof input !== 'string') return '';

  let sanitized = input.replace(/\x00/g, '');

  if (!allowNewlines) {
    sanitized = sanitized.replace(/[\x00-\x1f\x7f]/g, ' ');
  } else {
    sanitized = sanitized.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, ' ');
  }

  return sanitized.trim().substring(0, maxLength);
}

export function validateSpecId(specId: string): string {
  if (typeof specId !== 'string') throw new Error('Spec ID must be a string');

  const raw = specId.trim();
  if (!raw) throw new Error('Spec ID cannot be empty');
  if (raw.includes('..') || raw.includes('\\')) {
    throw new Error('Spec ID cannot contain path traversal sequences');
  }

  const normalized = raw.split('/').pop() || raw;
  const withoutExt = normalized.replace(/\.md$/i, '');

  if (!withoutExt) throw new Error('Spec ID cannot be empty');
  if (withoutExt.length > VALIDATION_LIMITS.MAX_SPEC_ID_LENGTH) {
    throw new Error(`Spec ID exceeds maximum length of ${VALIDATION_LIMITS.MAX_SPEC_ID_LENGTH}`);
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(withoutExt)) {
    throw new Error('Spec ID can only contain letters, numbers, dots, hyphens, and underscores');
  }

  return withoutExt;
}

export function validateTitle(title: string): string {
  if (typeof title !== 'string') throw new Error('Title must be a string');
  const trimmed = title.trim();
  if (!trimmed) throw new Error('Title cannot be empty');
  if (trimmed.length > VALIDATION_LIMITS.MAX_TITLE_LENGTH) {
    throw new Error(`Title exceeds maximum length of ${VALIDATION_LIMITS.MAX_TITLE_LENGTH}`);
  }
  return sanitizeString(trimmed, VALIDATION_LIMITS.MAX_TITLE_LENGTH, false);
}

export function validateAuthor(author: string): string {
  if (typeof author !== 'string') throw new Error('Author must be a string');
  const trimmed = author.trim();
  if (!trimmed) throw new Error('Author cannot be empty');
  if (trimmed.length > VALIDATION_LIMITS.MAX_AUTHOR_LENGTH) {
    throw new Error(`Author exceeds maximum length of ${VALIDATION_LIMITS.MAX_AUTHOR_LENGTH}`);
  }
  return sanitizeString(trimmed, VALIDATION_LIMITS.MAX_AUTHOR_LENGTH, false);
}

export function validateContent(content: string): string {
  if (typeof content !== 'string') throw new Error('Content must be a string');
  const trimmed = content.trim();
  if (!trimmed) throw new Error('Content cannot be empty');
  if (trimmed.length > VALIDATION_LIMITS.MAX_CONTENT_LENGTH) {
    throw new Error(`Content exceeds maximum length of ${VALIDATION_LIMITS.MAX_CONTENT_LENGTH}`);
  }
  return sanitizeString(content, VALIDATION_LIMITS.MAX_CONTENT_LENGTH, true);
}

export function validateTags(tags: string[]): string[] {
  if (!Array.isArray(tags)) throw new Error('Tags must be an array');
  if (tags.length > VALIDATION_LIMITS.MAX_TAGS_COUNT) {
    throw new Error(`Maximum ${VALIDATION_LIMITS.MAX_TAGS_COUNT} tags allowed`);
  }

  const out: string[] = [];
  for (const tag of tags) {
    if (typeof tag !== 'string') continue;
    const trimmed = tag.trim();
    if (!trimmed) continue;
    if (trimmed.length > VALIDATION_LIMITS.MAX_TAG_LENGTH) {
      throw new Error(`Tag exceeds maximum length of ${VALIDATION_LIMITS.MAX_TAG_LENGTH}`);
    }
    const clean = sanitizeString(trimmed, VALIDATION_LIMITS.MAX_TAG_LENGTH, false);
    if (clean && !out.includes(clean)) out.push(clean);
  }
  return out;
}

export function validateFilter(filter: {
  types?: string[];
  tags?: string[];
  author?: string;
  dateRange?: { from: string; to: string };
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (filter.types) {
    for (const type of filter.types) {
      if (!isValidCapsuleType(type)) errors.push(`Invalid capsule type: ${type}`);
    }
  }

  if (filter.tags) {
    try { validateTags(filter.tags); } catch (e) { errors.push(e instanceof Error ? e.message : 'Invalid tags'); }
  }

  if (filter.author !== undefined) {
    try { validateAuthor(filter.author); } catch (e) { errors.push(e instanceof Error ? e.message : 'Invalid author'); }
  }

  if (filter.dateRange) {
    const from = new Date(filter.dateRange.from);
    const to = new Date(filter.dateRange.to);
    if (Number.isNaN(from.getTime())) errors.push('Invalid date range: "from" is not a valid date');
    if (Number.isNaN(to.getTime())) errors.push('Invalid date range: "to" is not a valid date');
    if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()) && from > to) {
      errors.push('Invalid date range: "from" must be before or equal to "to"');
    }
  }

  return { isValid: errors.length === 0, errors };
}

export function validateCapsuleType(type: string): CapsuleType {
  if (!isValidCapsuleType(type)) throw new Error(`Invalid capsule type: ${type}`);
  return type;
}

export function isValidCapsuleType(type: string): type is CapsuleType {
  return ['user-story', 'technical-context', 'business-justification', 'discovery-note'].includes(type);
}
