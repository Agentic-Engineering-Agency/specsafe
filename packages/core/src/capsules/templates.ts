/**
 * Capsule Templates
 * Built-in templates for different capsule types
 */

import { CapsuleTemplate, CapsuleType, TemplateField } from './types.js';

export const USER_STORY_TEMPLATE: CapsuleTemplate = {
  type: 'user-story',
  name: 'User Story',
  description: 'Classic user story format: As a user, I want goal, so that benefit',
  fields: [
    {
      name: 'user',
      label: 'As a',
      placeholder: 'type of user (e.g., customer, admin)',
      required: true,
    },
    {
      name: 'goal',
      label: 'I want',
      placeholder: 'goal or action they want to perform',
      required: true,
    },
    {
      name: 'benefit',
      label: 'so that',
      placeholder: 'benefit they will receive',
      required: true,
    },
  ],
};

export const TECHNICAL_CONTEXT_TEMPLATE: CapsuleTemplate = {
  type: 'technical-context',
  name: 'Technical Context',
  description: 'Document technical problems, constraints, and trade-offs',
  fields: [
    {
      name: 'problem',
      label: 'Problem',
      placeholder: 'Describe the technical problem or challenge',
      required: true,
      multiline: true,
    },
    {
      name: 'constraints',
      label: 'Constraints',
      placeholder: 'List any technical constraints (e.g., performance, compatibility)',
      required: false,
      multiline: true,
    },
    {
      name: 'tradeoffs',
      label: 'Trade-offs Considered',
      placeholder: 'What alternatives were considered and why they were rejected',
      required: false,
      multiline: true,
    },
  ],
};

export const BUSINESS_JUSTIFICATION_TEMPLATE: CapsuleTemplate = {
  type: 'business-justification',
  name: 'Business Justification',
  description: 'Document ROI, risks, and priority rationale',
  fields: [
    {
      name: 'roi',
      label: 'Expected ROI',
      placeholder: 'Return on investment (e.g., time saved, revenue impact)',
      required: false,
      multiline: true,
    },
    {
      name: 'risk',
      label: 'Risk Assessment',
      placeholder: 'What are the risks if we do/do not implement this?',
      required: false,
      multiline: true,
    },
    {
      name: 'priority',
      label: 'Priority Rationale',
      placeholder: 'Why is this priority level appropriate?',
      required: false,
      multiline: true,
    },
  ],
};

export const DISCOVERY_NOTE_TEMPLATE: CapsuleTemplate = {
  type: 'discovery-note',
  name: 'Discovery Note',
  description: 'Research findings, user feedback, and exploration notes',
  fields: [
    {
      name: 'findings',
      label: 'Key Findings',
      placeholder: 'What did you discover?',
      required: true,
      multiline: true,
    },
    {
      name: 'sources',
      label: 'Sources',
      placeholder: 'Links, interviews, documents referenced',
      required: false,
      multiline: true,
    },
    {
      name: 'implications',
      label: 'Implications',
      placeholder: 'How should this affect the spec?',
      required: false,
      multiline: true,
    },
  ],
};

export const BUILTIN_TEMPLATES: Record<CapsuleType, CapsuleTemplate> = {
  'user-story': USER_STORY_TEMPLATE,
  'technical-context': TECHNICAL_CONTEXT_TEMPLATE,
  'business-justification': BUSINESS_JUSTIFICATION_TEMPLATE,
  'discovery-note': DISCOVERY_NOTE_TEMPLATE,
};

export const TEMPLATE_NAMES: Record<CapsuleType, string> = {
  'user-story': 'User Story',
  'technical-context': 'Technical Context',
  'business-justification': 'Business Justification',
  'discovery-note': 'Discovery Note',
};

/**
 * Get a template by type
 */
export function getTemplate(type: CapsuleType): CapsuleTemplate {
  const template = BUILTIN_TEMPLATES[type];
  if (!template) {
    throw new Error(`Unknown capsule type: ${type}`);
  }
  return template;
}

/**
 * List all available templates
 */
export function listTemplates(): CapsuleTemplate[] {
  return Object.values(BUILTIN_TEMPLATES);
}

/**
 * Check if a template type is valid
 */
export function isValidTemplateType(type: string): type is CapsuleType {
  return type in BUILTIN_TEMPLATES;
}

/**
 * Get template type choices for prompts
 */
export function getTemplateChoices(): { name: string; value: CapsuleType }[] {
  return Object.entries(BUILTIN_TEMPLATES).map(([type, template]) => ({
    name: template.name,
    value: type as CapsuleType,
  }));
}

/**
 * Format capsule content from template fields
 */
export function formatContent(
  type: CapsuleType,
  fields: Record<string, string>
): string {
  const template = getTemplate(type);
  const lines: string[] = [];

  for (const field of template.fields) {
    const value = fields[field.name];
    if (value && value.trim()) {
      lines.push(`**${field.label}:**`);
      lines.push(value.trim());
      lines.push('');
    }
  }

  return lines.join('\n').trim();
}

/**
 * Parse content back into template fields (best effort)
 */
export function parseContent(
  type: CapsuleType,
  content: string
): Record<string, string> {
  const template = getTemplate(type);
  const fields: Record<string, string> = {};

  for (const field of template.fields) {
    const pattern = new RegExp(
      `\\*\\*${field.label}:\\*\\*\\s*\\n?([^\\n]*(?:\\n(?!\\*\\*)[^\\n]*)*)`,
      'i'
    );
    const match = content.match(pattern);
    if (match) {
      fields[field.name] = match[1].trim();
    } else {
      fields[field.name] = '';
    }
  }

  return fields;
}
