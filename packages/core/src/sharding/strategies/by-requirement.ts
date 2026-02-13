/**
 * By-Requirement Sharding Strategy
 * Each requirement becomes its own shard with context
 */

import type { SpecShard, ShardOptions } from '../types.js';

interface RequirementMatch {
  id: string;
  text: string;
  priority: string;
  scenarios: string[];
  startLine: number;
  endLine: number;
  context: string[];
}

/**
 * Shard a spec by individual requirements
 * @param spec - The spec content
 * @param options - Sharding options
 * @returns Array of shards
 */
export function shardByRequirement(spec: string, options: ShardOptions): SpecShard[] {
  const shards: SpecShard[] = [];
  const lines = spec.split('\n');
  
  // Extract requirements
  const requirements = extractRequirements(spec, lines);
  
  if (requirements.length === 0) {
    // No requirements found, fall back to single shard
    return [{
      id: 'req-00-full',
      type: 'mixed',
      content: spec,
      dependencies: [],
      priority: 0,
    }];
  }
  
  // Create header/context shard
  const headerLines: string[] = [];
  if (requirements.length > 0 && requirements[0].startLine > 0) {
    headerLines.push(...lines.slice(0, requirements[0].startLine));
  }
  
  if (headerLines.length > 0) {
    const headerShard: SpecShard = {
      id: 'req-00-context',
      type: 'metadata',
      content: headerLines.join('\n').trim(),
      dependencies: [],
      priority: 0,
    };
    shards.push(headerShard);
  }
  
  // Create a shard for each requirement
  for (let i = 0; i < requirements.length; i++) {
    const req = requirements[i];
    const content = buildRequirementContent(req, options);
    
    const shard: SpecShard = {
      id: req.id,
      type: 'requirement',
      content,
      parentId: headerLines.length > 0 ? 'req-00-context' : undefined,
      dependencies: headerLines.length > 0 ? ['req-00-context'] : [],
      priority: i + 1,
      sectionName: req.id,
    };
    
    // Add dependencies on previous requirements if they reference this one
    for (let j = 0; j < i; j++) {
      const prevReq = requirements[j];
      if (req.text.toLowerCase().includes(prevReq.id.toLowerCase())) {
        shard.dependencies.push(prevReq.id);
      }
    }
    
    shards.push(shard);
  }
  
  return shards;
}

/**
 * Extract requirements from spec content
 */
function extractRequirements(spec: string, lines: string[]): RequirementMatch[] {
  const requirements: RequirementMatch[] = [];
  
  // Patterns for identifying requirements
  const patterns = [
    // REQ-XXX format
    { regex: /^\s*[-*]\s*(REQ-\d+)[:\s]+(.+)$/i, type: 'explicit' as const },
    // Priority format: [P0], [P1], [P2]
    { regex: /^\s*[-*]\s*\[(P[0-2])\][:\s]+(.+)$/i, type: 'priority' as const },
    // MUST/SHOULD/MAY keywords
    { regex: /^\s*[-*]\s*((?:MUST|SHOULD|MAY|REQUIRED|SHALL)\s+.+)$/i, type: 'keyword' as const },
    // Numbered requirements: 1., 1), (1)
    { regex: /^\s*(?:\d+[.\)])\s+(.+)$/i, type: 'numbered' as const },
  ];
  
  let currentReq: Partial<RequirementMatch> | null = null;
  let reqIndex = 1;
  let inScenarios = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let matched = false;
    
    // Check if this is a scenario line (belongs to previous requirement)
    if (/^\s*(?:Scenario|Given|When|Then|And|But):?\s+/i.test(line)) {
      if (currentReq) {
        if (!currentReq.scenarios) currentReq.scenarios = [];
        currentReq.scenarios.push(line);
        inScenarios = true;
        continue;
      }
    }
    
    // Check for new requirement patterns
    for (const pattern of patterns) {
      const match = line.match(pattern.regex);
      if (match) {
        // Save previous requirement
        if (currentReq?.startLine !== undefined) {
          currentReq.endLine = i - 1;
          requirements.push(currentReq as RequirementMatch);
        }
        
        // Determine requirement ID and priority
        let reqId: string;
        let priority = 'P1';
        let text: string;
        
        if (pattern.type === 'explicit') {
          reqId = match[1].toUpperCase();
          text = match[2];
        } else if (pattern.type === 'priority') {
          priority = match[1].toUpperCase();
          reqId = `REQ-${reqIndex.toString().padStart(3, '0')}`;
          text = match[2];
          reqIndex++;
        } else if (pattern.type === 'keyword') {
          reqId = `REQ-${reqIndex.toString().padStart(3, '0')}`;
          text = match[1];
          // Extract priority from keyword
          if (/^(MUST|REQUIRED|SHALL)/i.test(text)) priority = 'P0';
          else if (/^SHOULD/i.test(text)) priority = 'P1';
          else priority = 'P2';
          reqIndex++;
        } else {
          reqId = `REQ-${reqIndex.toString().padStart(3, '0')}`;
          text = match[1];
          reqIndex++;
        }
        
        currentReq = {
          id: reqId,
          text: text.trim(),
          priority,
          scenarios: [],
          startLine: i,
          context: [],
        };
        inScenarios = false;
        matched = true;
        break;
      }
    }
    
    // If not matched and we're in a requirement, add to context
    if (!matched && currentReq && !inScenarios) {
      if (!currentReq.context) currentReq.context = [];
      currentReq.context.push(line);
    }
  }
  
  // Save last requirement
  if (currentReq?.startLine !== undefined) {
    currentReq.endLine = lines.length - 1;
    requirements.push(currentReq as RequirementMatch);
  }
  
  return requirements;
}

/**
 * Build full content for a requirement shard
 */
function buildRequirementContent(req: RequirementMatch, options: ShardOptions): string {
  const parts: string[] = [];
  
  // Add context if preserving context
  if (options.preserveContext && req.context.length > 0) {
    const contextText = req.context.join('\n').trim();
    if (contextText) {
      parts.push('## Context\n');
      parts.push(contextText);
      parts.push('');
    }
  }
  
  // Add requirement
  parts.push(`## Requirement: ${req.id}`);
  parts.push(`**Priority:** ${req.priority}`);
  parts.push('');
  parts.push(req.text);
  parts.push('');
  
  // Add scenarios
  if (req.scenarios.length > 0) {
    parts.push('## Scenarios');
    parts.push('');
    parts.push(req.scenarios.join('\n'));
  }
  
  return parts.join('\n');
}
