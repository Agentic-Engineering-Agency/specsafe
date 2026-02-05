/**
 * Scenario Parser
 * Extracts scenarios from spec markdown files
 */

import type { Requirement, Scenario } from '@specsafe/core';

export class ScenarioParser {
  /**
   * Parse requirements from spec text
   */
  parseRequirements(text: string): Requirement[] {
    // Simple parsing - could be enhanced with proper markdown parser
    const requirements: Requirement[] = [];
    
    // Find requirement sections
    const requirementMatches = text.matchAll(/###\s+Requirement:\s*(.+)/g);
    
    for (const match of requirementMatches) {
      const reqText = match[1].trim();
      const scenarios = this.parseScenarios(text, match.index || 0);
      
      requirements.push({
        id: `REQ-${requirements.length + 1}`,
        text: reqText,
        priority: 'P1',
        scenarios
      });
    }
    
    return requirements;
  }

  private parseScenarios(text: string, startIndex: number): Scenario[] {
    const scenarios: Scenario[] = [];
    
    // Find scenario table after requirement, bounded by next requirement or end of text
    const nextReqMatch = text.slice(startIndex + 1).search(/###\s+Requirement:/);
    const endIndex = nextReqMatch !== -1 ? startIndex + 1 + nextReqMatch : text.length;
    const section = text.slice(startIndex, endIndex);
    
    const scenarioMatches = section.matchAll(/\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/g);
    
    let index = 0;
    for (const match of scenarioMatches) {
      const [, given, when, then] = match;
      if (given && when && then && given.trim() !== 'GIVEN') {
        scenarios.push({
          id: `SC-${index++}`,
          given: given.trim(),
          when: when.trim(),
          then: then.trim()
        });
      }
    }
    
    return scenarios;
  }
}