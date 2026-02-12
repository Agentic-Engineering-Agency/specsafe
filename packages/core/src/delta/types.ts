/**
 * Delta Spec Types
 * Defines structures for incremental spec changes (brownfield projects)
 */

export interface DeltaRequirement {
  id: string;
  text: string;
  priority?: 'P0' | 'P1' | 'P2';
  scenarios?: string[];
  oldText?: string; // For MODIFIED requirements
}

export interface DeltaSpec {
  id: string;
  baseSpecId: string;
  description: string;
  createdAt: Date;
  author: string;
  added: DeltaRequirement[];
  modified: DeltaRequirement[];
  removed: string[]; // Just requirement IDs
}

export interface MergeResult {
  success: boolean;
  content: string;
  conflicts: MergeConflict[];
  stats: MergeStats;
}

export interface MergeConflict {
  type: 'requirement_not_found' | 'duplicate_add' | 'invalid_format';
  requirementId?: string;
  message: string;
}

export interface MergeStats {
  added: number;
  modified: number;
  removed: number;
  conflicts: number;
}
