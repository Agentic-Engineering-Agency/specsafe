/**
 * Template Engine v2
 */

import type { Constraint, RenderOptions, ValidationResult, ConstraintFailure } from './types.js';

export class TemplateEngine {
  renderTemplate(template: string, options: RenderOptions = {}): string {
    const { variables = {}, partials = {}, preserveConstraints = false, preserveChecklists = false } = options;
    
    let result = template;
    
    // Process includes
    result = this.processIncludes(result, partials);
    
    // Process conditionals
    result = this.processConditionals(result, variables);
    
    // Process variables
    result = this.processVariables(result, variables);
    
    // Remove directives
    if (!preserveConstraints) {
      result = this.removeDirectives(result, 'constraint');
    }
    if (!preserveChecklists) {
      result = this.removeDirectives(result, 'checklist');
    }
    
    return result;
  }

  private processIncludes(template: string, partials: Record<string, string>): string {
    const includeRegex = /\{\{>\s*([a-zA-Z0-9_-]+)\s*\}\}/g;
    return template.replace(includeRegex, (match, partialName) => {
      const partial = partials[partialName];
      if (!partial) {
        console.warn(`Warning: Partial "${partialName}" not found`);
        return match;
      }
      return partial;
    });
  }

  private processConditionals(template: string, variables: Record<string, string | number | boolean>): string {
    const conditionalRegex = /\{\{#if\s+([a-zA-Z0-9_]+)\s*\}\}([\s\S]*?)\{\{\/if\}\}/g;
    return template.replace(conditionalRegex, (match, varName, content) => {
      return variables[varName] ? content : '';
    });
  }

  private processVariables(template: string, variables: Record<string, string | number | boolean>): string {
    const variableRegex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
    return template.replace(variableRegex, (match, varName) => {
      const value = variables[varName];
      if (value === undefined || value === null) {
        console.warn(`Warning: Variable "${varName}" not found`);
        return match;
      }
      return String(value);
    });
  }

  private removeDirectives(template: string, directiveType: string): string {
    const directiveRegex = new RegExp(`<!--\\s*@${directiveType}:.*?-->\\n?`, 'g');
    return template.replace(directiveRegex, '');
  }

  parseConstraints(template: string): Constraint[] {
    const constraints: Constraint[] = [];
    const lines = template.split('\n');
    const constraintRegex = /<!--\s*@constraint:\s*([a-z-]+)(?:\s+(.+?))?\s*-->/;
    
    lines.forEach((line, index) => {
      const match = line.match(constraintRegex);
      if (match) {
        const [, type, param] = match;
        let parsedParam: string | number = '';
        if (param) {
          parsedParam = /^\d+$/.test(param.trim()) 
            ? parseInt(param.trim(), 10) 
            : param.trim().replace(/^["']|["']$/g, '');
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
    
    return { valid, passed, failed, summary };
  }

  private validateConstraint(spec: string, constraint: Constraint): { valid: boolean; reason?: string; actualValue?: string | number } {
    switch (constraint.type) {
      case 'max-requirements': {
        const count = this.countRequirements(spec);
        const max = constraint.param as number;
        if (count > max) {
          return { valid: false, reason: `Too many requirements: found ${count}, max allowed is ${max}`, actualValue: count };
        }
        return { valid: true };
      }
      
      case 'min-requirements': {
        const count = this.countRequirements(spec);
        const min = constraint.param as number;
        if (count < min) {
          return { valid: false, reason: `Too few requirements: found ${count}, minimum required is ${min}`, actualValue: count };
        }
        return { valid: true };
      }
      
      case 'require-section': {
        const sectionName = constraint.param as string;
        const hasSection = this.hasSection(spec, sectionName);
        if (!hasSection) {
          return { valid: false, reason: `Required section "${sectionName}" not found` };
        }
        return { valid: true };
      }
      
      case 'require-priority': {
        const hasPriority = /\*\*Priority:\*\*\s*(P0|P1|P2)/i.test(spec);
        if (!hasPriority) {
          return { valid: false, reason: 'No priority markers (P0, P1, P2) found in requirements' };
        }
        return { valid: true };
      }
      
      case 'require-scenarios': {
        const hasScenarios = /(Given|When|Then)/i.test(spec);
        if (!hasScenarios) {
          return { valid: false, reason: 'No Given/When/Then scenarios found' };
        }
        return { valid: true };
      }
      
      default:
        return { valid: true };
    }
  }

  private countRequirements(spec: string): number {
    const reqRegex = /^###\s+(FR|NFR|SEC|PERF)-[A-Z0-9-]+/gm;
    const matches = spec.match(reqRegex);
    return matches ? matches.length : 0;
  }

  private hasSection(spec: string, sectionName: string): boolean {
    const sectionRegex = new RegExp(`^#{1,3}\\s+${sectionName}\\s*$`, 'im');
    return sectionRegex.test(spec);
  }
}
