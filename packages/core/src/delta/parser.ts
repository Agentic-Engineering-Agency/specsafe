/**
 * Delta Spec Parser
 * Parses delta spec files with ADDED/MODIFIED/REMOVED sections
 */

import type { DeltaSpec, DeltaRequirement } from './types.js';

export class DeltaParser {
  /**
   * Parse a delta spec from markdown content
   */
  parse(content: string, deltaSpecId: string, baseSpecId: string, author: string = 'developer'): DeltaSpec {
    const lines = content.split('\n');
    
    // Extract metadata from frontmatter or header
    const description = this.extractDescription(lines);
    
    const added: DeltaRequirement[] = [];
    const modified: DeltaRequirement[] = [];
    const removed: string[] = [];

    let currentSection: 'none' | 'added' | 'modified' | 'removed' = 'none';
    let currentRequirement: Partial<DeltaRequirement> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Detect section headers
      if (line.match(/^##\s+ADDED\s+Requirements?/i)) {
        // console.log('Found ADDED section');
        this.saveCurrentRequirement(currentRequirement, currentSection, added, modified);
        currentSection = 'added';
        currentRequirement = null;
        continue;
      }
      
      if (line.match(/^##\s+MODIFIED\s+Requirements?/i)) {
        this.saveCurrentRequirement(currentRequirement, currentSection, added, modified);
        currentSection = 'modified';
        currentRequirement = null;
        continue;
      }
      
      if (line.match(/^##\s+REMOVED\s+Requirements?/i)) {
        this.saveCurrentRequirement(currentRequirement, currentSection, added, modified);
        currentSection = 'removed';
        currentRequirement = null;
        continue;
      }

      // Reset section on other headers
      if (line.startsWith('##') && !line.match(/^##\s+(ADDED|MODIFIED|REMOVED)/i)) {
        this.saveCurrentRequirement(currentRequirement, currentSection, added, modified);
        currentSection = 'none';
        currentRequirement = null;
        continue;
      }

      if (currentSection === 'none') continue;

      // Parse REMOVED section (just IDs)
      if (currentSection === 'removed') {
        // Match lines like: - FR-1, - REQ-001, - FR-AUTH-1, etc.
        const idMatch = line.match(/^[-*]\s+([A-Z][A-Z0-9-]+)/);
        if (idMatch) {
          removed.push(idMatch[1]);
        }
        continue;
      }

      // Parse ADDED and MODIFIED sections
      // Look for requirement ID headers like ### FR-1 or **FR-1:** or ### FR-AUTH-1
      const headerMatch = line.match(/^###\s+([A-Z][A-Z0-9-]+)|^\*\*([A-Z][A-Z0-9-]+):/);
      if (headerMatch) {
        // Save previous requirement
        this.saveCurrentRequirement(currentRequirement, currentSection, added, modified);
        
        const id = headerMatch[1] || headerMatch[2];
        currentRequirement = { id, text: '', scenarios: [] };
        continue;
      }

      // Parse requirement content
      if (currentRequirement) {
        // Extract priority
        const priorityMatch = line.match(/\*\*Priority:\*\*\s+(P[012])/);
        if (priorityMatch) {
          currentRequirement.priority = priorityMatch[1] as 'P0' | 'P1' | 'P2';
          continue;
        }

        // Extract "was" notation for MODIFIED
        const wasMatch = line.match(/←\s*\(was\s+(.+)\)/);
        if (wasMatch && currentSection === 'modified') {
          currentRequirement.oldText = wasMatch[1];
          // Remove the "was" part and keep the new text
          const newText = line.replace(/←\s*\(was\s+.+\)/, '').trim();
          if (newText) {
            currentRequirement.text = (currentRequirement.text + ' ' + newText).trim();
          }
          continue;
        }

        // Accumulate requirement text
        if (line && !line.startsWith('#') && !line.startsWith('**Priority:**')) {
          if (line.startsWith('-') || line.startsWith('*')) {
            // Scenario or list item
            currentRequirement.scenarios = currentRequirement.scenarios || [];
            currentRequirement.scenarios.push(line.replace(/^[-*]\s+/, ''));
          } else {
            currentRequirement.text = (currentRequirement.text + ' ' + line).trim();
          }
        }
      }
    }

    // Save last requirement
    this.saveCurrentRequirement(currentRequirement, currentSection, added, modified);

    return {
      id: deltaSpecId,
      baseSpecId,
      description,
      createdAt: new Date(),
      author,
      added,
      modified,
      removed
    };
  }

  /**
   * Extract description from content
   */
  private extractDescription(lines: string[]): string {
    for (const line of lines) {
      const descMatch = line.match(/\*\*Description:\*\*\s+(.+)/);
      if (descMatch) {
        return descMatch[1];
      }
    }
    return 'Delta spec change';
  }

  /**
   * Save current requirement to appropriate list
   */
  private saveCurrentRequirement(
    req: Partial<DeltaRequirement> | null,
    section: 'none' | 'added' | 'modified' | 'removed',
    added: DeltaRequirement[],
    modified: DeltaRequirement[]
  ): void {
    if (!req || !req.id) return;

    const requirement: DeltaRequirement = {
      id: req.id,
      text: req.text || '',
      priority: req.priority,
      scenarios: req.scenarios,
      oldText: req.oldText
    };

    if (section === 'added') {
      added.push(requirement);
    } else if (section === 'modified') {
      modified.push(requirement);
    }
  }

  /**
   * Validate delta spec structure
   */
  validate(deltaSpec: DeltaSpec): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!deltaSpec.baseSpecId) {
      errors.push('Missing baseSpecId');
    }

    if (deltaSpec.added.length === 0 && deltaSpec.modified.length === 0 && deltaSpec.removed.length === 0) {
      errors.push('Delta spec has no changes (no requirements added, modified, or removed)');
    }

    // Check for duplicate IDs in added
    const addedIds = new Set<string>();
    for (const req of deltaSpec.added) {
      if (addedIds.has(req.id)) {
        errors.push(`Duplicate requirement ID in ADDED section: ${req.id}`);
      }
      addedIds.add(req.id);
    }

    // Check for duplicate IDs in modified
    const modifiedIds = new Set<string>();
    for (const req of deltaSpec.modified) {
      if (modifiedIds.has(req.id)) {
        errors.push(`Duplicate requirement ID in MODIFIED section: ${req.id}`);
      }
      modifiedIds.add(req.id);
    }

    // Check for overlap between sections
    for (const req of deltaSpec.added) {
      if (modifiedIds.has(req.id)) {
        errors.push(`Requirement ${req.id} appears in both ADDED and MODIFIED sections`);
      }
      if (deltaSpec.removed.includes(req.id)) {
        errors.push(`Requirement ${req.id} appears in both ADDED and REMOVED sections`);
      }
    }

    for (const req of deltaSpec.modified) {
      if (deltaSpec.removed.includes(req.id)) {
        errors.push(`Requirement ${req.id} appears in both MODIFIED and REMOVED sections`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
