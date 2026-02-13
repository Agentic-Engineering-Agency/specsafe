/**
 * Capsule Types
 * Story context capsules for attaching contextual stories/notes to specs
 */

export type CapsuleType = 
  | 'user-story' 
  | 'technical-context' 
  | 'business-justification' 
  | 'discovery-note';

export interface Capsule {
  id: string;
  specId: string;
  type: CapsuleType;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  tags: string[];
}

export type CapsuleCollection = Capsule[];

export interface DateRange {
  from: string;
  to: string;
}

export interface CapsuleFilter {
  types?: CapsuleType[];
  tags?: string[];
  author?: string;
  dateRange?: DateRange;
}

export interface CapsuleTemplate {
  type: CapsuleType;
  name: string;
  description: string;
  fields: TemplateField[];
}

export interface TemplateField {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
}
