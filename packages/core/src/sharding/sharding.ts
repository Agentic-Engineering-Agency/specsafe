/**
 * ShardEngine - Core sharding functionality for breaking specs into AI-consumable chunks
 */

import type {
  SpecShard,
  ShardPlan,
  ShardOptions,
  ShardResult,
  MergeResult,
  ShardAnalysis,
  CrossReference,
  ShardStrategy,
} from './types.js';
import { DEFAULT_SHARD_OPTIONS } from './types.js';

import { shardBySection } from './strategies/by-section.js';
import { shardByRequirement } from './strategies/by-requirement.js';
import { shardByScenario } from './strategies/by-scenario.js';
import { shardAuto } from './strategies/auto.js';

/**
 * Constants for token estimation and limits
 */
const TOKEN_ESTIMATION_PROSE_CHARS_PER_TOKEN = 4;
const TOKEN_ESTIMATION_CODE_CHARS_PER_TOKEN = 3.5;

/**
 * Properly escape a string for use in a regular expression
 * @param str - The string to escape
 * @returns Escaped string safe for use in regex
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validate that a shard ID is safe for use in operations
 * @param id - The shard ID to validate
 * @throws Error if the ID is invalid
 */
function validateShardId(id: unknown): asserts id is string {
  if (typeof id !== 'string') {
    throw new Error(`Invalid shard ID: expected string, got ${typeof id}`);
  }
  if (id.length === 0) {
    throw new Error('Invalid shard ID: empty string');
  }
  if (id.length > 200) {
    throw new Error('Invalid shard ID: exceeds maximum length of 200 characters');
  }
}

/**
 * Engine for analyzing and sharding specifications
 */
export class ShardEngine {
  private options: ShardOptions;

  constructor(options: Partial<ShardOptions> = {}) {
    this.options = { ...DEFAULT_SHARD_OPTIONS, ...options };
  }

  /**
   * Analyze a spec to determine complexity and recommend sharding strategy
   * @param spec - The spec content to analyze
   * @returns Analysis results with recommendations
   */
  analyze(spec: string): ShardAnalysis {
    const lines = spec.split('\n');
    const totalLines = lines.length;
    
    // Count sections (## headers)
    const sectionMatches = spec.match(/^##\s+.+$/gm) || [];
    const sectionCount = sectionMatches.length;
    
    // Count requirements (various patterns)
    const reqPatterns = [
      /^\s*[-*]\s*(?:MUST|SHOULD|MAY|REQUIRED|SHALL)\s+/im,
      /^\s*[-*]\s*REQ-\d+[:\s]/im,
      /^\s*[-*]\s*\[P[0-2]\].+/im,
    ];
    let requirementCount = 0;
    for (const line of lines) {
      if (reqPatterns.some(p => p.test(line))) {
        requirementCount++;
      }
    }
    
    // Count scenarios (Gherkin-style or similar)
    const scenarioPatterns = [
      /^\s*(?:Scenario|Example):\s+/im,
      /^\s*(?:Given|When|Then)\s+/im,
      /^\s*[-*]\s*Scenario\s+\d+[:\s]/im,
    ];
    let scenarioCount = 0;
    let inScenario = false;
    for (const line of lines) {
      if (/^\s*(?:Scenario|Example):\s+/im.test(line)) {
        scenarioCount++;
        inScenario = true;
      } else if (inScenario && /^\s*$/.test(line)) {
        inScenario = false;
      }
    }
    
    // Calculate complexity score (0-100)
    let complexity = 0;
    complexity += Math.min(sectionCount * 5, 30); // Sections contribute up to 30
    complexity += Math.min(requirementCount * 3, 30); // Requirements up to 30
    complexity += Math.min(scenarioCount * 2, 20); // Scenarios up to 20
    complexity += Math.min(totalLines / 10, 20); // Length up to 20
    complexity = Math.min(Math.round(complexity), 100);
    
    // Estimate total tokens (rough approximation: ~4 chars per token)
    const totalTokens = Math.ceil(spec.length / TOKEN_ESTIMATION_PROSE_CHARS_PER_TOKEN);
    
    // Determine recommended strategy
    let recommendedStrategy: ShardStrategy;
    let recommendationReason: string;
    
    if (scenarioCount > 10 && requirementCount < scenarioCount) {
      recommendedStrategy = 'by-scenario';
      recommendationReason = `High scenario count (${scenarioCount}) suggests scenario-based sharding`;
    } else if (requirementCount > 15) {
      recommendedStrategy = 'by-requirement';
      recommendationReason = `High requirement count (${requirementCount}) suggests requirement-based sharding`;
    } else if (sectionCount >= 3) {
      recommendedStrategy = 'by-section';
      recommendationReason = `Clear section structure (${sectionCount} sections) suggests section-based sharding`;
    } else {
      recommendedStrategy = 'auto';
      recommendationReason = 'Mixed content structure suggests automatic sharding';
    }
    
    // Override with explicit auto strategy if complexity is high
    if (complexity > 70 && totalTokens > 4000) {
      recommendedStrategy = 'auto';
      recommendationReason = `High complexity (${complexity}) and token count (${totalTokens}) suggest auto sharding`;
    }
    
    return {
      recommendedStrategy,
      complexity,
      sectionCount,
      requirementCount,
      scenarioCount,
      totalLines,
      totalTokens,
      recommendationReason,
    };
  }

  /**
   * Break a spec into shards based on the configured strategy
   * @param spec - The spec content to shard
   * @param options - Override options for this operation
   * @returns Shard result with the generated plan
   */
  shard(spec: string, options?: Partial<ShardOptions>): ShardResult {
    const startTime = Date.now();
    
    try {
      const opts = { ...this.options, ...options };
      const analysis = this.analyze(spec);
      
      // Use specified strategy or fall back to recommended
      const strategy = opts.strategy === 'auto' ? analysis.recommendedStrategy : opts.strategy;
      
      let shards: SpecShard[];
      
      switch (strategy) {
        case 'by-section':
          shards = shardBySection(spec, opts);
          break;
        case 'by-requirement':
          shards = shardByRequirement(spec, opts);
          break;
        case 'by-scenario':
          shards = shardByScenario(spec, opts);
          break;
        case 'auto':
        default:
          shards = shardAuto(spec, opts, analysis);
          break;
      }
      
      // Calculate token counts for each shard
      for (const shard of shards) {
        shard.tokenCount = this.estimateTokens(shard.content);
      }
      
      // Find dependencies between shards
      const crossReferences = this.findDependencies(shards);
      
      // Generate recommended processing order (topological sort)
      const recommendedOrder = this.calculateProcessingOrder(shards, crossReferences);
      
      // Calculate total estimated tokens
      const estimatedTokens = shards.reduce((sum, s) => sum + (s.tokenCount || 0), 0);
      
      const plan: ShardPlan = {
        shards,
        estimatedTokens,
        recommendedOrder,
        crossReferences,
        analysis,
      };
      
      return {
        plan,
        success: true,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        plan: {
          shards: [],
          estimatedTokens: 0,
          recommendedOrder: [],
          crossReferences: [],
          analysis: this.analyze(spec),
        },
        success: false,
        error: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Reconstruct a full spec from shards
   * @param shards - Array of shards to merge
   * @returns Merge result with reconstructed content
   */
  merge(shards: SpecShard[]): MergeResult {
    if (shards.length === 0) {
      return {
        content: '',
        success: true,
      };
    }
    
    // Sort shards by priority (lower number = higher priority)
    const sortedShards = [...shards].sort((a, b) => a.priority - b.priority);
    
    // Check for missing parent dependencies
    const shardIds = new Set(shards.map(s => s.id));
    const missingShards: string[] = [];
    
    for (const shard of shards) {
      if (shard.parentId && !shardIds.has(shard.parentId)) {
        missingShards.push(shard.parentId);
      }
      for (const dep of shard.dependencies) {
        if (!shardIds.has(dep)) {
          missingShards.push(dep);
        }
      }
    }
    
    // Merge content with appropriate separators
    const parts: string[] = [];
    
    for (const shard of sortedShards) {
      // Add section separator if not first shard
      if (parts.length > 0) {
        parts.push('\n\n---\n\n');
      }
      
      // Add shard content
      parts.push(shard.content);
    }
    
    const content = parts.join('');
    
    // Check for potential merge conflicts
    const conflicts = this.detectMergeConflicts(shards);
    
    return {
      content,
      success: missingShards.length === 0,
      missingShards: missingShards.length > 0 ? [...new Set(missingShards)] : undefined,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
    };
  }

  /**
   * Estimate token count for text (rough approximation)
   * @param text - Text to estimate
   * @returns Estimated token count
   */
  estimateTokens(text: string): number {
    // Rough approximation: ~4 characters per token for English text
    // This is a simplified estimate; actual tokenization varies by model
    const charCount = text.length;
    
    // Adjust for code blocks (more tokens per char due to formatting)
    const codeBlocks = text.match(/```[\s\S]*?```/g) || [];
    const codeChars = codeBlocks.reduce((sum, block) => sum + block.length, 0);
    const proseChars = charCount - codeChars;
    
    // Code tends to have slightly higher token density
    const estimatedTokens =
      Math.ceil(proseChars / TOKEN_ESTIMATION_PROSE_CHARS_PER_TOKEN) +
      Math.ceil(codeChars / TOKEN_ESTIMATION_CODE_CHARS_PER_TOKEN);
    
    return estimatedTokens;
  }

  /**
   * Analyze cross-references between shards
   * @param shards - Array of shards to analyze
   * @returns Array of cross-references
   */
  findDependencies(shards: SpecShard[]): CrossReference[] {
    const references: CrossReference[] = [];
    const shardIds = new Set(shards.map(s => {
      validateShardId(s.id);
      return s.id;
    }));
    
    // Build lookup by section name for matching
    const sectionMap = new Map<string, string>();
    for (const shard of shards) {
      if (shard.sectionName) {
        sectionMap.set(shard.sectionName.toLowerCase(), shard.id);
      }
    }
    
    for (const shard of shards) {
      // Check for explicit references to other shards by ID
      for (const otherId of shardIds) {
        if (otherId === shard.id) continue;
        
        const safeOtherId = escapeRegex(otherId);
        const pattern = new RegExp(`\\b${safeOtherId}\\b`, 'i');
        if (pattern.test(shard.content)) {
          references.push({
            from: shard.id,
            to: otherId,
            type: 'references',
          });
        }
      }
      
      // Check for references to sections
      const sectionRefs = shard.content.match(/see\s+(?:the\s+)?["']?([^"'\n]+?)(?:\s+section)?["']?/gi) || [];
      for (const ref of sectionRefs) {
        const sectionName = ref.replace(/see\s+(?:the\s+)?["']?/i, '').replace(/\s+section["']?/i, '').trim().toLowerCase();
        if (sectionMap.has(sectionName)) {
          const targetId = sectionMap.get(sectionName)!;
          if (targetId !== shard.id) {
            references.push({
              from: shard.id,
              to: targetId,
              type: 'references',
              description: `References section "${sectionName}"`,
            });
          }
        }
      }
      
      // Check for requirement references (REQ-XXX)
      const reqRefs = shard.content.match(/REQ-\d+/gi) || [];
      for (const reqRef of reqRefs) {
        // Find shard containing this requirement
        for (const other of shards) {
          if (other.id !== shard.id && other.content.includes(reqRef)) {
            references.push({
              from: shard.id,
              to: other.id,
              type: 'depends-on',
              description: `References ${reqRef}`,
            });
            break;
          }
        }
      }
    }
    
    // Deduplicate references
    const seen = new Set<string>();
    return references.filter(ref => {
      const key = `${ref.from}:${ref.to}:${ref.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Calculate recommended processing order using topological sort
   */
  private calculateProcessingOrder(shards: SpecShard[], references: CrossReference[]): string[] {
    // Build dependency graph
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();
    
    for (const shard of shards) {
      inDegree.set(shard.id, 0);
      adjacency.set(shard.id, []);
    }
    
    // Add edges from references and parent relationships
    for (const ref of references) {
      if (ref.type === 'depends-on') {
        const current = inDegree.get(ref.from) || 0;
        inDegree.set(ref.from, current + 1);
        const deps = adjacency.get(ref.to) || [];
        deps.push(ref.from);
        adjacency.set(ref.to, deps);
      }
    }
    
    // Add parent relationships
    for (const shard of shards) {
      if (shard.parentId && inDegree.has(shard.parentId)) {
        const current = inDegree.get(shard.id) || 0;
        inDegree.set(shard.id, current + 1);
        const deps = adjacency.get(shard.parentId) || [];
        deps.push(shard.id);
        adjacency.set(shard.parentId, deps);
      }
    }
    
    // Kahn's algorithm
    const queue: string[] = [];
    const result: string[] = [];
    
    // Start with nodes having no dependencies, sorted by priority
    const ready = shards
      .filter(s => (inDegree.get(s.id) || 0) === 0)
      .sort((a, b) => a.priority - b.priority)
      .map(s => s.id);
    
    queue.push(...ready);
    
    while (queue.length > 0) {
      // Sort queue by priority of corresponding shards
      queue.sort((a, b) => {
        const shardA = shards.find(s => s.id === a);
        const shardB = shards.find(s => s.id === b);
        return (shardA?.priority || 0) - (shardB?.priority || 0);
      });
      
      const current = queue.shift()!;
      result.push(current);
      
      const neighbors = adjacency.get(current) || [];
      for (const neighbor of neighbors) {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }
    
    // If not all shards were processed, there's a cycle - fall back to priority order
    if (result.length < shards.length) {
      const remaining = shards
        .filter(s => !result.includes(s.id))
        .sort((a, b) => a.priority - b.priority)
        .map(s => s.id);
      result.push(...remaining);
    }
    
    return result;
  }

  /**
   * Detect potential merge conflicts between shards
   */
  private detectMergeConflicts(shards: SpecShard[]): Array<{ shardIds: string[]; description: string }> {
    const conflicts: Array<{ shardIds: string[]; description: string }> = [];
    
    // Check for duplicate content
    const contentMap = new Map<string, string[]>();
    for (const shard of shards) {
      const normalized = shard.content.trim().toLowerCase();
      const existing = contentMap.get(normalized) || [];
      existing.push(shard.id);
      contentMap.set(normalized, existing);
    }
    
    for (const [content, ids] of contentMap) {
      if (ids.length > 1 && content.length > 100) {
        conflicts.push({
          shardIds: ids,
          description: 'Duplicate content detected',
        });
      }
    }
    
    // Check for overlapping headers
    const headerMap = new Map<string, string[]>();
    for (const shard of shards) {
      const headers = shard.content.match(/^#{1,3}\s+.+$/gm) || [];
      for (const header of headers) {
        const normalized = header.toLowerCase();
        const existing = headerMap.get(normalized) || [];
        existing.push(shard.id);
        headerMap.set(normalized, existing);
      }
    }
    
    for (const [header, ids] of headerMap) {
      if (ids.length > 1) {
        conflicts.push({
          shardIds: ids,
          description: `Duplicate header: "${header.substring(0, 50)}..."`,
        });
      }
    }
    
    return conflicts;
  }
}

export { DEFAULT_SHARD_OPTIONS };
export type {
  SpecShard,
  ShardPlan,
  ShardOptions,
  ShardResult,
  MergeResult,
  ShardAnalysis,
  CrossReference,
  ShardStrategy,
};
