/**
 * By-Scenario Sharding Strategy
 * Each test scenario becomes its own shard
 */

import type { SpecShard, ShardOptions } from '../types.js';

interface ScenarioMatch {
  id: string;
  name: string;
  given: string;
  when: string;
  then: string;
  fullText: string;
  relatedRequirement?: string;
  startLine: number;
  endLine: number;
}

/**
 * Shard a spec by test scenarios
 * @param spec - The spec content
 * @param options - Sharding options
 * @returns Array of shards
 */
export function shardByScenario(spec: string, options: ShardOptions): SpecShard[] {
  const shards: SpecShard[] = [];
  
  // Extract scenarios
  const scenarios = extractScenarios(spec);
  
  if (scenarios.length === 0) {
    // No scenarios found, fall back to single shard
    return [{
      id: 'scenario-00-full',
      type: 'mixed',
      content: spec,
      dependencies: [],
      priority: 0,
    }];
  }
  
  const lines = spec.split('\n');
  
  // Create header/context shard (content before first scenario)
  if (scenarios.length > 0 && scenarios[0].startLine > 0) {
    const headerContent = lines.slice(0, scenarios[0].startLine).join('\n').trim();
    if (headerContent) {
      const headerShard: SpecShard = {
        id: 'scenario-00-context',
        type: 'metadata',
        content: headerContent,
        dependencies: [],
        priority: 0,
      };
      shards.push(headerShard);
    }
  }
  
  // Create a shard for each scenario
  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    const content = buildScenarioContent(scenario, options);
    
    const shard: SpecShard = {
      id: scenario.id,
      type: 'scenario',
      content,
      parentId: shards.length > 0 ? shards[0].id : undefined,
      dependencies: shards.length > 0 ? [shards[0].id] : [],
      priority: i + 1,
      sectionName: scenario.name,
    };
    
    // Add dependency on related requirement if any
    if (scenario.relatedRequirement) {
      // Find if there's a requirement shard with this ID
      const reqShard = shards.find(s => s.id === scenario.relatedRequirement);
      if (reqShard) {
        shard.dependencies.push(reqShard.id);
      }
    }
    
    shards.push(shard);
  }
  
  return shards;
}

/**
 * Extract scenarios from spec content
 */
function extractScenarios(spec: string): ScenarioMatch[] {
  const scenarios: ScenarioMatch[] = [];
  const lines = spec.split('\n');
  
  let currentScenario: Partial<ScenarioMatch> | null = null;
  let scenarioIndex = 1;
  let scenarioLines: string[] = [];
  let lastRequirement: string | undefined;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for requirement reference (to link scenarios to requirements)
    const reqMatch = line.match(/(REQ-\d+)/i);
    if (reqMatch) {
      lastRequirement = reqMatch[1].toUpperCase();
    }
    
    // Check for scenario start (various formats)
    const scenarioMatch = line.match(/^\s*(?:Scenario|Example)(?:\s*\d*)?[:\s]+(.+)$/i) ||
                          line.match(/^\s*[-*]\s*Scenario(?:\s*\d*)?[:\s]+(.+)$/i);
    
    if (scenarioMatch) {
      // Save previous scenario
      if (currentScenario && currentScenario.startLine !== undefined) {
        currentScenario.endLine = i - 1;
        currentScenario.fullText = scenarioLines.join('\n');
        scenarios.push(currentScenario as ScenarioMatch);
      }
      
      // Start new scenario
      scenarioLines = [line];
      currentScenario = {
        id: `SCN-${scenarioIndex.toString().padStart(3, '0')}`,
        name: scenarioMatch[1].trim(),
        given: '',
        when: '',
        then: '',
        relatedRequirement: lastRequirement,
        startLine: i,
      };
      scenarioIndex++;
    } else if (currentScenario) {
      scenarioLines.push(line);
      
      // Extract Given/When/Then
      const givenMatch = line.match(/^\s*(?:Given|And|But)\s+(.+)$/i);
      const whenMatch = line.match(/^\s*(?:When|And|But)\s+(.+)$/i);
      const thenMatch = line.match(/^\s*(?:Then|And|But)\s+(.+)$/i);
      
      if (givenMatch && !currentScenario.given) {
        currentScenario.given = givenMatch[1];
      } else if (whenMatch && !currentScenario.when) {
        currentScenario.when = whenMatch[1];
      } else if (thenMatch && !currentScenario.then) {
        currentScenario.then = thenMatch[1];
      }
    }
  }
  
  // Save last scenario
  if (currentScenario && currentScenario.startLine !== undefined) {
    currentScenario.endLine = lines.length - 1;
    currentScenario.fullText = scenarioLines.join('\n');
    scenarios.push(currentScenario as ScenarioMatch);
  }
  
  return scenarios;
}

/**
 * Build full content for a scenario shard
 */
function buildScenarioContent(scenario: ScenarioMatch, options: ShardOptions): string {
  const parts: string[] = [];
  
  // Add related requirement reference if any
  if (scenario.relatedRequirement) {
    parts.push(`**Related Requirement:** ${scenario.relatedRequirement}`);
    parts.push('');
  }
  
  // Add scenario
  parts.push(`## Scenario: ${scenario.name}`);
  parts.push('');
  
  // Reconstruct Gherkin format
  if (scenario.given) {
    parts.push(`Given ${scenario.given}`);
  }
  if (scenario.when) {
    parts.push(`When ${scenario.when}`);
  }
  if (scenario.then) {
    parts.push(`Then ${scenario.then}`);
  }
  
  // Add any additional lines from original
  const additionalLines = scenario.fullText
    .split('\n')
    .filter(l => !l.match(/^\s*(?:Scenario|Given|When|Then|And|But)[:\s]/i) && l.trim());
  
  if (additionalLines.length > 0) {
    parts.push('');
    parts.push('## Additional Details');
    parts.push(additionalLines.join('\n'));
  }
  
  return parts.join('\n');
}
