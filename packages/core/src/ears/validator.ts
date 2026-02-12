/**
 * EARS Validator
 * Validates requirements against EARS patterns and suggests improvements
 */

import type { Spec, Requirement } from '../types.js';
import type { EARSValidationResult, RequirementValidation, EARSType } from './types.js';
import { parseEARSRequirement, hasEARSKeywords } from './parser.js';

/**
 * Validate all requirements in a spec for EARS compliance
 */
export function validateRequirements(spec: Spec): EARSValidationResult {
  const validations: RequirementValidation[] = [];
  
  for (const requirement of spec.requirements) {
    const validation = validateRequirement(requirement.text);
    validations.push(validation);
  }
  
  // Calculate summary
  const compliantCount = validations.filter(v => v.isCompliant).length;
  const score = spec.requirements.length > 0
    ? Math.round((compliantCount / spec.requirements.length) * 100)
    : 0;
  
  // Group by EARS type
  const typeCounts = new Map<EARSType, number>();
  for (const validation of validations) {
    if (validation.earsRequirement) {
      const type = validation.earsRequirement.type;
      typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
    }
  }
  
  const summary = Array.from(typeCounts.entries()).map(([type, count]) => ({
    type,
    count
  }));
  
  // Generate recommendation
  let recommendation = '';
  if (score >= 90) {
    recommendation = '✅ Excellent EARS compliance! Requirements are well-structured and testable.';
  } else if (score >= 70) {
    recommendation = '⚠️ Good EARS compliance, but some requirements could be improved for better testability.';
  } else if (score >= 50) {
    recommendation = '⚠️ Moderate EARS compliance. Consider rewriting requirements using EARS patterns.';
  } else {
    recommendation = '❌ Low EARS compliance. Requirements should be rewritten using EARS patterns for testability.';
  }
  
  return {
    score,
    totalRequirements: spec.requirements.length,
    compliantCount,
    requirements: validations,
    summary,
    recommendation
  };
}

/**
 * Validate a single requirement text
 * 
 * Note: A requirement is considered compliant (isCompliant = true) ONLY if it both:
 * 1. Matches an EARS pattern with sufficient confidence, AND
 * 2. Has zero quality issues (no ambiguous words, vague terms, etc.)
 * 
 * @param text - The requirement text to validate
 * @returns Validation result with compliance status, issues, and suggestions
 */
export function validateRequirement(text: string): RequirementValidation {
  const earsRequirement = parseEARSRequirement(text);
  
  const issues: string[] = [];
  let isCompliant = false;
  let suggestion: string | undefined;
  
  // Check if it matches an EARS pattern
  if (earsRequirement.type === 'unknown') {
    issues.push('Does not follow any EARS pattern');
    suggestion = generateEARSSuggestion(text);
  } else if (earsRequirement.confidence < 0.7) {
    issues.push('Weak EARS pattern match');
    suggestion = generateEARSSuggestion(text);
  } else {
    isCompliant = true;
  }
  
  // Additional quality checks
  if (!text.match(/\b(shall|must|will)\b/i)) {
    issues.push('Missing modal verb (shall/must/will)');
  }
  
  if (text.split(' ').length < 5) {
    issues.push('Requirement is too short - may lack necessary detail');
  }
  
  if (text.split(' ').length > 40) {
    issues.push('Requirement is too long - consider splitting into multiple requirements');
  }
  
  // Check for ambiguous words
  const ambiguousWords = ['should', 'may', 'might', 'could', 'possibly', 'probably', 'usually', 'maybe', 'perhaps'];
  for (const word of ambiguousWords) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(text)) {
      issues.push(`Contains ambiguous word: "${word}"`);
    }
  }
  
  // Check for vague terms (precompiled with word boundaries to avoid false positives)
  const vagueTerms = ['appropriate', 'adequate', 'reasonable', 'efficient', 'user-friendly', 'as needed'];
  const vagueTermPatterns = vagueTerms.map(term => new RegExp(`\\b${term}\\b`, 'i'));
  for (let i = 0; i < vagueTerms.length; i++) {
    if (vagueTermPatterns[i].test(text)) {
      issues.push(`Contains vague term: "${vagueTerms[i]}" - specify measurable criteria`);
    }
  }
  
  return {
    text,
    isCompliant: isCompliant && issues.length === 0,
    earsRequirement: earsRequirement.type !== 'unknown' ? earsRequirement : undefined,
    issues,
    suggestion
  };
}

/**
 * Generate an EARS-formatted suggestion for a non-compliant requirement
 */
function generateEARSSuggestion(text: string): string {
  // Try to detect implicit patterns and suggest EARS format
  
  // If it mentions a trigger condition, suggest event-driven
  if (/\b(after|once|following|receives|detects|triggers)\b/i.test(text)) {
    return `Consider event-driven EARS: "When [event occurs], the system shall [action]"\nExample: "When user submits the form, the system shall validate all fields"`;
  }
  
  // If it mentions a state, suggest state-driven
  if (/\b(during|active|running|enabled|in\s+\w+\s+mode)\b/i.test(text)) {
    return `Consider state-driven EARS: "While [state exists], the system shall [action]"\nExample: "While user is logged in, the system shall display the dashboard"`;
  }
  
  // If it mentions a condition, suggest optional
  if (/\b(if|when|in case|for|with)\b/i.test(text) && !/then/i.test(text)) {
    return `Consider optional EARS: "Where [condition], the system shall [action]"\nExample: "Where user has admin privileges, the system shall allow access to settings"`;
  }
  
  // If it mentions error handling, suggest unwanted
  if (/\b(error|fail|invalid|incorrect|wrong|exception)\b/i.test(text)) {
    return `Consider unwanted behavior EARS: "If [unwanted condition], then the system shall [action]"\nExample: "If user enters invalid credentials, then the system shall display an error message"`;
  }
  
  // Default to ubiquitous
  return `Consider ubiquitous EARS: "The system shall [action]"\nExample: "The system shall encrypt all sensitive data at rest"`;
}

/**
 * Get EARS compliance score for a spec (0-100)
 */
export function getEARSScore(spec: Spec): number {
  const result = validateRequirements(spec);
  return result.score;
}

/**
 * Check if a spec meets minimum EARS compliance threshold
 * @param spec - The spec to check
 * @param threshold - Minimum score (0-100)
 * @param precomputedScore - Optional pre-computed score to avoid re-validation
 */
export function meetsEARSThreshold(
  spec: Spec, 
  threshold: number = 80,
  precomputedScore?: number
): boolean {
  const score = precomputedScore !== undefined ? precomputedScore : getEARSScore(spec);
  return score >= threshold;
}

/**
 * Generate a detailed EARS compliance report as markdown
 */
export function generateEARSReport(spec: Spec): string {
  const result = validateRequirements(spec);
  
  let report = `# EARS Compliance Report\n\n`;
  report += `**Spec ID:** ${spec.id}\n`;
  report += `**Spec Name:** ${spec.name}\n`;
  report += `**Date:** ${new Date().toISOString().split('T')[0]}\n\n`;
  
  report += `## Overall Score: ${result.score}/100\n\n`;
  report += `${result.recommendation}\n\n`;
  
  report += `### Summary\n`;
  report += `- **Total Requirements:** ${result.totalRequirements}\n`;
  report += `- **Compliant:** ${result.compliantCount}\n`;
  report += `- **Non-Compliant:** ${result.totalRequirements - result.compliantCount}\n\n`;
  
  if (result.summary.length > 0) {
    report += `### Requirements by EARS Type\n\n`;
    for (const { type, count } of result.summary) {
      const emoji = getEARSTypeEmoji(type);
      report += `- ${emoji} **${type}:** ${count}\n`;
    }
    report += `\n`;
  }
  
  report += `## Detailed Analysis\n\n`;
  for (let i = 0; i < result.requirements.length; i++) {
    const validation = result.requirements[i];
    const status = validation.isCompliant ? '✅' : '❌';
    
    report += `### ${status} Requirement ${i + 1}\n\n`;
    report += `**Text:** "${validation.text}"\n\n`;
    
    if (validation.earsRequirement && validation.earsRequirement.type !== 'unknown') {
      const ears = validation.earsRequirement;
      report += `**EARS Type:** ${ears.type}\n`;
      report += `**Confidence:** ${Math.round(ears.confidence * 100)}%\n\n`;
      
      if (ears.event) report += `- **Event:** ${ears.event}\n`;
      if (ears.state) report += `- **State:** ${ears.state}\n`;
      if (ears.condition) report += `- **Condition:** ${ears.condition}\n`;
      if (ears.unwantedCondition) report += `- **Unwanted Condition:** ${ears.unwantedCondition}\n`;
      if (ears.conditions) {
        report += `- **Conditions:**\n`;
        for (const cond of ears.conditions) {
          report += `  - ${cond.type}: ${cond.value}\n`;
        }
      }
      report += `- **Action:** ${ears.action}\n\n`;
    }
    
    if (validation.issues.length > 0) {
      report += `**Issues:**\n`;
      for (const issue of validation.issues) {
        report += `- ⚠️ ${issue}\n`;
      }
      report += `\n`;
    }
    
    if (validation.suggestion) {
      report += `**Suggestion:**\n${validation.suggestion}\n\n`;
    }
    
    report += `---\n\n`;
  }
  
  return report;
}

/**
 * Get emoji for EARS type
 */
function getEARSTypeEmoji(type: EARSType): string {
  const emojis: Record<EARSType, string> = {
    ubiquitous: '🌐',
    event: '⚡',
    state: '🔄',
    optional: '🔀',
    unwanted: '🚫',
    complex: '🔗',
    unknown: '❓'
  };
  return emojis[type] || '❓';
}
