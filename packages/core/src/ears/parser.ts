/**
 * EARS Parser
 * Detects and parses Easy Approach to Requirements Syntax patterns
 */

import type { EARSRequirement, EARSType } from './types.js';

/**
 * Flexible subject pattern for EARS requirements.
 * Matches "the <word> shall/must/will" where <word> can be any noun acting as a subject.
 * This avoids hardcoding a fixed list of subjects.
 */
const SUBJECT_PATTERN = '(?:[A-Za-z][A-Za-z0-9_-]*)';

/**
 * The modal verbs that indicate a requirement action clause.
 */
const MODAL = '(?:shall|must|will)';

/**
 * Parse a requirement text and extract EARS structure
 */
export function parseEARSRequirement(text: string): EARSRequirement {
  const normalized = text.trim();
  
  // Try to match each EARS pattern in order of specificity
  
  // 1. Complex (combination of patterns)
  const complexMatch = matchComplex(normalized);
  if (complexMatch) {
    return complexMatch;
  }
  
  // 2. Unwanted behavior: "If [unwanted], then the system shall [action]"
  const unwantedMatch = matchUnwanted(normalized);
  if (unwantedMatch) {
    return unwantedMatch;
  }
  
  // 3. Event-driven: "When [event], the system shall [action]"
  const eventMatch = matchEvent(normalized);
  if (eventMatch) {
    return eventMatch;
  }
  
  // 4. State-driven: "While [state], the system shall [action]"
  const stateMatch = matchState(normalized);
  if (stateMatch) {
    return stateMatch;
  }
  
  // 5. Optional: "Where [condition], the system shall [action]"
  const optionalMatch = matchOptional(normalized);
  if (optionalMatch) {
    return optionalMatch;
  }
  
  // 6. Ubiquitous: "The system shall [action]"
  const ubiquitousMatch = matchUbiquitous(normalized);
  if (ubiquitousMatch) {
    return ubiquitousMatch;
  }
  
  // Unknown pattern
  return {
    text: normalized,
    type: 'unknown',
    action: normalized,
    confidence: 0
  };
}

/**
 * Build a regex that matches "the <subject> shall/must/will" flexibly.
 * Accepts an optional "the" and any single-word subject before the modal verb.
 */
function subjectModalRegex(): string {
  return `(?:the\\s+)?${SUBJECT_PATTERN}\\s+${MODAL}`;
}

/**
 * Match ubiquitous pattern: "The system shall [action]"
 */
function matchUbiquitous(text: string): EARSRequirement | null {
  const pattern = new RegExp(`^${subjectModalRegex()}\\s+(.+)$`, 'i');
  const match = text.match(pattern);
  if (match) {
    return {
      text,
      type: 'ubiquitous',
      action: match[1].trim(),
      confidence: 0.9
    };
  }
  return null;
}

/**
 * Match event-driven pattern: "When [event], the system shall [action]"
 */
function matchEvent(text: string): EARSRequirement | null {
  const smr = subjectModalRegex();
  const patterns = [
    new RegExp(`^when\\s+(.+?),\\s*${smr}\\s+(.+)$`, 'i'),
    new RegExp(`^(?:upon|on)\\s+(.+?),\\s*${smr}\\s+(.+)$`, 'i')
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        text,
        type: 'event',
        event: match[1].trim(),
        action: match[2].trim(),
        confidence: 0.95
      };
    }
  }
  
  return null;
}

/**
 * Match state-driven pattern: "While [state], the system shall [action]"
 */
function matchState(text: string): EARSRequirement | null {
  const smr = subjectModalRegex();
  const patterns = [
    new RegExp(`^while\\s+(.+?),\\s*${smr}\\s+(.+)$`, 'i'),
    new RegExp(`^(?:during|throughout)\\s+(.+?),\\s*${smr}\\s+(.+)$`, 'i'),
    new RegExp(`^as long as\\s+(.+?),\\s*${smr}\\s+(.+)$`, 'i')
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        text,
        type: 'state',
        state: match[1].trim(),
        action: match[2].trim(),
        confidence: 0.95
      };
    }
  }
  
  return null;
}

/**
 * Match optional pattern: "Where [condition], the system shall [action]"
 */
function matchOptional(text: string): EARSRequirement | null {
  const smr = subjectModalRegex();
  const patterns = [
    new RegExp(`^where\\s+(.+?),\\s*${smr}\\s+(.+)$`, 'i'),
    new RegExp(`^in case(?:s)?\\s+(?:where\\s+)?(.+?),\\s*${smr}\\s+(.+)$`, 'i')
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        text,
        type: 'optional',
        condition: match[1].trim(),
        action: match[2].trim(),
        confidence: 0.95
      };
    }
  }
  
  return null;
}

/**
 * Match unwanted behavior pattern: "If [unwanted], then the system shall [action]"
 */
function matchUnwanted(text: string): EARSRequirement | null {
  const smr = subjectModalRegex();
  const patterns = [
    new RegExp(`^if\\s+(.+?),\\s*then\\s+${smr}\\s+(.+)$`, 'i'),
    new RegExp(`^(?:in the event that|should)\\s+(.+?),\\s*${smr}\\s+(.+)$`, 'i')
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        text,
        type: 'unwanted',
        unwantedCondition: match[1].trim(),
        action: match[2].trim(),
        confidence: 0.95
      };
    }
  }
  
  return null;
}

/**
 * Match complex pattern: combination of triggers
 * Example: "When [event], while [state], the system shall [action]"
 *
 * Uses a smarter approach: find the subject+modal anchor first, then parse
 * the prefix for conditions using comma-delimited segments.
 */
function matchComplex(text: string): EARSRequirement | null {
  const smr = subjectModalRegex();
  // Match: <triggers prefix>, <subject modal> <action>
  const complexPattern = new RegExp(`^((?:when|while|where|if)\\s+.+?),\\s*${smr}\\s+(.+)$`, 'i');
  const match = text.match(complexPattern);
  
  if (!match) {
    return null;
  }
  
  const triggersText = match[1].trim();
  const action = match[2].trim();
  
  // Parse individual triggers by splitting on comma boundaries that are followed by a keyword.
  // This avoids splitting on keywords that appear inside condition text.
  const conditions: { type: 'event' | 'state' | 'optional'; value: string }[] = [];
  
  // Split on ", <keyword>" or ", and <keyword>" boundaries
  const segments = triggersText.split(/,\s+(?:and\s+)?(?=(?:when|while|where|if)\s)/i);
  
  for (const segment of segments) {
    const trimmed = segment.trim();
    if (/^when\s+/i.test(trimmed)) {
      conditions.push({ type: 'event', value: trimmed.replace(/^when\s+/i, '').trim() });
    } else if (/^while\s+/i.test(trimmed)) {
      conditions.push({ type: 'state', value: trimmed.replace(/^while\s+/i, '').trim() });
    } else if (/^where\s+/i.test(trimmed)) {
      conditions.push({ type: 'optional', value: trimmed.replace(/^where\s+/i, '').trim() });
    } else if (/^if\s+/i.test(trimmed)) {
      conditions.push({ type: 'optional', value: trimmed.replace(/^if\s+/i, '').trim() });
    }
  }
  
  // Only consider complex if we have more than one condition
  if (conditions.length < 2) {
    return null;
  }
  
  return {
    text,
    type: 'complex',
    action,
    conditions,
    confidence: 0.85
  };
}

/**
 * Check if a requirement text contains EARS keywords.
 * 
 * Tightened to reduce false positives:
 * - "shall" and "must" are strong requirement indicators on their own
 * - "if...then" only matches when combined with shall/must/will
 * - "when/while/where" only match when combined with shall/must/will
 * - bare "will" requires a subject pattern to avoid matching casual sentences
 */
export function hasEARSKeywords(text: string): boolean {
  // Strong indicators: shall/must always indicate requirements
  if (/\b(?:shall|must)\b/i.test(text)) {
    return true;
  }
  
  // "will" only counts when preceded by a subject-like pattern (e.g., "the X will")
  if (/\b(?:the\s+\w+\s+will)\b/i.test(text)) {
    return true;
  }
  
  // Conditional keywords only count when combined with a modal verb
  if (/\b(?:when|while|where)\b/i.test(text) && /\b(?:shall|must|will)\b/i.test(text)) {
    return true;
  }
  
  // "if...then" only counts with a modal verb
  if (/\bif\s+.+\s+then\b/i.test(text) && /\b(?:shall|must|will)\b/i.test(text)) {
    return true;
  }
  
  return false;
}

/**
 * Extract all requirement statements from a text block.
 * Uses flexible subject matching — any "the <word> shall/must/will" pattern,
 * or lines starting with EARS trigger keywords that contain a modal verb.
 */
export function extractRequirements(text: string): string[] {
  const lines = text.split('\n');
  const requirements: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Must contain a modal verb
    if (!/\b(?:shall|must|will)\b/i.test(trimmed)) continue;
    
    // Match if it has a subject+modal pattern OR starts with an EARS trigger keyword
    const hasSubjectModal = /\b(?:the\s+)?\w+\s+(?:shall|must|will)\b/i.test(trimmed);
    const hasTriggerKeyword = /\b(?:when|while|where|if)\s+/i.test(trimmed);
    
    if (hasSubjectModal || hasTriggerKeyword) {
      requirements.push(trimmed.replace(/^[-*•]\s*/, '')); // Remove bullet points
    }
  }
  
  return requirements;
}
