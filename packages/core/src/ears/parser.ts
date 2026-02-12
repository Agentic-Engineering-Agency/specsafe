/**
 * EARS Parser
 * Detects and parses Easy Approach to Requirements Syntax patterns
 */

import type { EARSRequirement, EARSType } from './types.js';

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
 * Match ubiquitous pattern: "The system shall [action]"
 */
function matchUbiquitous(text: string): EARSRequirement | null {
  const patterns = [
    /^(?:the\s+)?(?:system|application|service|software|product)\s+(?:shall|must|will)\s+(.+)$/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        text,
        type: 'ubiquitous',
        action: match[1].trim(),
        confidence: 0.9
      };
    }
  }
  
  return null;
}

/**
 * Match event-driven pattern: "When [event], the system shall [action]"
 */
function matchEvent(text: string): EARSRequirement | null {
  const patterns = [
    /^when\s+(.+?),\s*(?:the\s+)?(?:system|application|service)\s+(?:shall|must|will)\s+(.+)$/i,
    /^(?:upon|on)\s+(.+?),\s*(?:the\s+)?(?:system|application|service)\s+(?:shall|must|will)\s+(.+)$/i
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
  const patterns = [
    /^while\s+(.+?),\s*(?:the\s+)?(?:system|application|service)\s+(?:shall|must|will)\s+(.+)$/i,
    /^(?:during|throughout)\s+(.+?),\s*(?:the\s+)?(?:system|application|service)\s+(?:shall|must|will)\s+(.+)$/i,
    /^as long as\s+(.+?),\s*(?:the\s+)?(?:system|application|service)\s+(?:shall|must|will)\s+(.+)$/i
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
  const patterns = [
    /^where\s+(.+?),\s*(?:the\s+)?(?:system|application|service)\s+(?:shall|must|will)\s+(.+)$/i,
    /^in case(?:s)?\s+(?:where\s+)?(.+?),\s*(?:the\s+)?(?:system|application|service)\s+(?:shall|must|will)\s+(.+)$/i
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
  const patterns = [
    /^if\s+(.+?),\s*then\s+(?:the\s+)?(?:system|application|service)\s+(?:shall|must|will)\s+(.+)$/i,
    /^(?:in the event that|should)\s+(.+?),\s*(?:the\s+)?(?:system|application|service)\s+(?:shall|must|will)\s+(.+)$/i
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
 */
function matchComplex(text: string): EARSRequirement | null {
  const complexPattern = /^((?:when|while|where|if).+?(?:,\s*(?:and|while|where|when)\s+.+?)*),\s*(?:the\s+)?(?:system|application|service)\s+(?:shall|must|will)\s+(.+)$/i;
  const match = text.match(complexPattern);
  
  if (!match) {
    return null;
  }
  
  const triggersText = match[1].trim();
  const action = match[2].trim();
  
  // Parse individual triggers
  const conditions: { type: 'event' | 'state' | 'optional'; value: string }[] = [];
  
  // Split by "and", "while", "where", "when", "if" (keeping the keyword)
  const triggerParts = triggersText.split(/,?\s+(and|while|where|when|if)\s+/i);
  
  let currentKeyword = '';
  let lastKeywordType: 'event' | 'state' | 'optional' | null = null;
  
  for (let i = 0; i < triggerParts.length; i++) {
    const part = triggerParts[i].trim();
    
    if (/^(and|while|where|when|if)$/i.test(part)) {
      const keyword = part.toLowerCase();
      // 'and' continues with the previous keyword type
      if (keyword !== 'and') {
        currentKeyword = keyword;
      }
      continue;
    }
    
    // First part might not have a keyword if it starts with one
    if (i === 0) {
      if (/^if\s+/i.test(part)) {
        conditions.push({ type: 'optional', value: part.replace(/^if\s+/i, '').trim() });
        lastKeywordType = 'optional';
      } else if (/^when\s+/i.test(part)) {
        conditions.push({ type: 'event', value: part.replace(/^when\s+/i, '').trim() });
        lastKeywordType = 'event';
      } else if (/^while\s+/i.test(part)) {
        conditions.push({ type: 'state', value: part.replace(/^while\s+/i, '').trim() });
        lastKeywordType = 'state';
      } else if (/^where\s+/i.test(part)) {
        conditions.push({ type: 'optional', value: part.replace(/^where\s+/i, '').trim() });
        lastKeywordType = 'optional';
      }
    } else {
      // Use the current keyword (or last type if 'and')
      let conditionType: 'event' | 'state' | 'optional' | null = null;
      
      if (currentKeyword === 'if') {
        conditionType = 'optional';
      } else if (currentKeyword === 'when') {
        conditionType = 'event';
      } else if (currentKeyword === 'while') {
        conditionType = 'state';
      } else if (currentKeyword === 'where') {
        conditionType = 'optional';
      } else if (currentKeyword === '' && lastKeywordType) {
        // Handle 'and' by using last keyword type
        conditionType = lastKeywordType;
      }
      
      if (conditionType) {
        conditions.push({ type: conditionType, value: part });
        lastKeywordType = conditionType;
      }
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
 * Check if a requirement text contains any EARS keywords
 */
export function hasEARSKeywords(text: string): boolean {
  const keywords = /\b(when|while|where|if\s+.+\s+then|system\s+shall|shall|must|will)\b/i;
  return keywords.test(text);
}

/**
 * Extract all "system shall" statements from a text block
 */
export function extractRequirements(text: string): string[] {
  const lines = text.split('\n');
  const requirements: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    // Look for lines that look like requirements (must have EARS action clause)
    if (trimmed && /(?:shall|must|will)/i.test(trimmed) && (
      /(?:system|application|service)/i.test(trimmed) ||
      /(?:when|while|where|if)\s+/i.test(trimmed)
    )) {
      requirements.push(trimmed.replace(/^[-*•]\s*/, '')); // Remove bullet points
    }
  }
  
  return requirements;
}
