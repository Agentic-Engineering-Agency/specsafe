/**
 * Template Engine v2
 * Processes markdown templates with variables, conditionals, constraints, and includes
 */

import type { Constraint, RenderOptions, ValidationResult, ConstraintFailure } from './types.js';

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Template engine for processing SpecSafe templates
 */
export class TemplateEngine {
  /**
   * Render a template with variable interpolation, conditionals, and includes
   * @param template - Template content
   * @param options - Render options
   * @returns Rendered template
   */
  renderTemplate(template: string, options: RenderOptions = {}): string {
    const { variables = {}, partials = {}, preserveConstraints = false, preserveChecklists = false } = options;
    
    let result = template;
    
    // Step 1: Process includes ({{> partial-name}})
    result = this.processIncludes(result, partials);
    
    // Step 2: Process conditionals ({{#if VAR}}...{{/if}})
    result = this.processConditionals(result, variables);
    
    // Step 3: Process variable interpolation ({{VAR_NAME}})
    result = this.processVariables(result, variables);
    
    // Step 4: Remove constraint directives (unless preserving)
    if (!preserveConstraints) {
      result = this.removeDirectives(result, 'constraint');
    }
    
    // Step 5: Remove checklist directives (unless preserving)
    if (!preserveChecklists) {
      result = this.removeDirectives(result, 'checklist');
    }
    
    return result;
  }

  /**
   * Process include directives: {{> partial-name}}
   */
  private processIncludes(template: string, partials: Record<string, string>, visited: Set<string> = new Set()): string {
    const includeRegex = /\{\{>\s*([a-zA-Z0-9_-]+)\s*\}\}/g;
    
    return template.replace(includeRegex, (match, partialName) => {
      // Detect circular includes
      if (visited.has(partialName)) {
        console.warn(`Warning: Circular include detected for "${partialName}"`);
        return match; // Keep the original to prevent infinite loop
      }
      
      const partial = partials[partialName];
      if (!partial) {
        console.warn(`Warning: Partial "${partialName}" not found`);
        return match; // Keep the original if not found
      }
      
      // Track this partial to prevent recursion
      const newVisited = new Set(visited);
      newVisited.add(partialName);
      
      // Recursively process includes in the partial
      return this.processIncludes(partial, partials, newVisited);
    });
  }

  /**
   * Process conditional sections: {{#if VAR}}...{{/if}}
   */
  private processConditionals(template: string, variables: Record<string, string | number | boolean>): string {
    // Match {{#if VAR}}...{{/if}} blocks
    const conditionalRegex = /\{\{#if\s+([a-zA-Z0-9_]+)\s*\}\}([\s\S]*?)\{\{\/if\}\}/g;
    
    return template.replace(conditionalRegex, (match, varName, content) => {
      const value = variables[varName];
      // Include content if variable is truthy
      return value ? content : '';
    });
  }

  /**
   * Process variable interpolation: {{VAR_NAME}}
   */
  private processVariables(template: string, variables: Record<string, string | number | boolean>): string {
    const variableRegex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
    
    return template.replace(variableRegex, (match, varName) => {
      const value = variables[varName];
      if (value === undefined || value === null) {
        console.warn(`Warning: Variable "${varName}" not found`);
        return match; // Keep the original if not found
      }
      return String(value);
    });
  }

  /**
   * Remove directive comments
   */
  private removeDirectives(template: string, directiveType: string): string {
    const directiveRegex = new RegExp(`<!--\\s*@${directiveType}:.*?-->\\n?`, 'g');
    return template.replace(directiveRegex, '');
  }

  /**
   * Parse constraints from a template
   * @param template - Template content
   * @returns Array of constraints
   */
  parseConstraints(template: string): Constraint[] {
    const constraints: Constraint[] = [];
    const lines = template.split('\n');
    
    // Match: <!-- @constraint: type param --> or <!-- @constraint: type -->
    const constraintRegex = /<!--\s*@constraint:\s*([a-z-]+)(?:\s+(.+?))?\s*-->/;
    
    lines.forEach((line, index) => {
      const match = line.match(constraintRegex);
      if (match) {
        const [, type, param] = match;
        
        // Parse param if present
        let parsedParam: string | number = '';
        if (param) {
          parsedParam = /^\d+$/.test(param.trim()) 
            ? parseInt(param.trim(), 10) 
            : param.trim().replace(/^["']|["']$/g, ''); // Remove quotes
        }
        
        constraints.push({
          type: type as Constraint['type'],
          param: parsedParam,
          line: index + 1,
        });
      }
    });
    
    return constraints;
  }

  /**
   * Validate a spec against template constraints
   * @param spec - Spec content (markdown)
   * @param constraints - Constraints to validate against
   * @returns Validation result
   */
  validateAgainstConstraints(spec: string, constraints: Constraint[]): ValidationResult {
    const passed: Constraint[] = [];
    const failed: ConstraintFailure[] = [];
    
    for (const constraint of constraints) {
      const result = this.validateConstraint(spec, constraint);
      if (result.valid) {
        passed.push(constraint);
      } else {
        failed.push({
          constraint,
          reason: result.reason!,
          actualValue: result.actualValue,
        });
      }
    }
    
    const valid = failed.length === 0;
    const summary = valid
      ? `✓ All ${constraints.length} constraint(s) passed`
      : `✗ ${failed.length} of ${constraints.length} constraint(s) failed`;
    
    return {
      valid,
      passed,
      failed,
      summary,
    };
  }

  /**
   * Validate a single constraint
   */
  private validateConstraint(
    spec: string, 
    constraint: Constraint
  ): { valid: boolean; reason?: string; actualValue?: string | number } {
    switch (constraint.type) {
      case 'max-requirements': {
        const count = this.countRequirements(spec);
        const max = constraint.param as number;
        if (count > max) {
          return {
            valid: false,
            reason: `Too many requirements: found ${count}, max allowed is ${max}`,
            actualValue: count,
          };
        }
        return { valid: true };
      }
      
      case 'min-requirements': {
        const count = this.countRequirements(spec);
        const min = constraint.param as number;
        if (count < min) {
          return {
            valid: false,
            reason: `Too few requirements: found ${count}, minimum required is ${min}`,
            actualValue: count,
          };
        }
        return { valid: true };
      }
      
      case 'require-section': {
        const sectionName = constraint.param as string;
        const hasSection = this.hasSection(spec, sectionName);
        if (!hasSection) {
          return {
            valid: false,
            reason: `Required section "${sectionName}" not found`,
          };
        }
        return { valid: true };
      }
      
      case 'max-section-length': {
        // Format: "SectionName:maxWords"
        const param = constraint.param as string;
        if (!param || typeof param !== 'string' || !param.includes(':')) {
          return {
            valid: false,
            reason: `Invalid max-section-length parameter format: "${param}". Expected "SectionName:maxWords"`,
          };
        }
        
        const [sectionName, maxWordsStr] = param.split(':');
        const maxWords = parseInt(maxWordsStr, 10);
        
        if (!Number.isFinite(maxWords) || maxWords <= 0) {
          return {
            valid: false,
            reason: `Invalid maxWords value: "${maxWordsStr}". Must be a positive number`,
          };
        }
        
        const sectionContent = this.extractSection(spec, sectionName);
        
        if (sectionContent) {
          const wordCount = sectionContent.split(/\s+/).length;
          if (wordCount > maxWords) {
            return {
              valid: false,
              reason: `Section "${sectionName}" too long: ${wordCount} words, max ${maxWords}`,
              actualValue: wordCount,
            };
          }
        }
        return { valid: true };
      }
      
      case 'require-priority': {
        // Check if spec has priority markers (P0, P1, P2)
        const hasPriority = /\*\*Priority:\*\*\s*(P0|P1|P2)/i.test(spec);
        if (!hasPriority) {
          return {
            valid: false,
            reason: 'No priority markers (P0, P1, P2) found in requirements',
          };
        }
        return { valid: true };
      }
      
      case 'require-scenarios': {
        // Check if spec has Given/When/Then scenarios
        const hasScenarios = /(Given|When|Then)/i.test(spec);
        if (!hasScenarios) {
          return {
            valid: false,
            reason: 'No Given/When/Then scenarios found',
          };
        }
        return { valid: true };
      }
      
      default:
        // Unknown constraint type - skip
        return { valid: true };
    }
  }

  /**
   * Count requirements in a spec (looks for FR-, NFR-, etc.)
   */
  private countRequirements(spec: string): number {
    const reqRegex = /^###\s+(FR|NFR|SEC|PERF)-[A-Z0-9-]+/gm;
    const matches = spec.match(reqRegex);
    return matches ? matches.length : 0;
  }

  /**
   * Check if spec has a section with given name
   */
  private hasSection(spec: string, sectionName: string): boolean {
    // Match ## Section Name or # Section Name
    const sectionRegex = new RegExp(`^#{1,3}\\s+${escapeRegex(sectionName)}\\s*$`, 'im');
    return sectionRegex.test(spec);
  }

  /**
   * Extract content of a section
   */
  private extractSection(spec: string, sectionName: string): string | null {
    const lines = spec.split('\n');
    const sectionRegex = new RegExp(`^#{1,3}\\s+${escapeRegex(sectionName)}\\s*$`, 'i');
    
    let inSection = false;
    let sectionContent: string[] = [];
    
    for (const line of lines) {
      if (sectionRegex.test(line)) {
        inSection = true;
        continue;
      }
      
      // Stop at next heading of same or higher level
      if (inSection && /^#{1,3}\s+/.test(line)) {
        break;
      }
      
      if (inSection) {
        sectionContent.push(line);
      }
    }
    
    return sectionContent.length > 0 ? sectionContent.join('\n') : null;
  }
}
