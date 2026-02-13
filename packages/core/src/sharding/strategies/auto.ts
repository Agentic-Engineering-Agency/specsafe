/**
 * Auto Sharding Strategy
 * Intelligent sharding based on token limits and content type
 */

import type { SpecShard, ShardOptions, ShardAnalysis } from '../types.js';
import { shardBySection } from './by-section.js';
import { shardByRequirement } from './by-requirement.js';
import { shardByScenario } from './by-scenario.js';

/**
 * Automatically determine and apply the best sharding strategy
 * @param spec - The spec content
 * @param options - Sharding options
 * @param analysis - Pre-computed analysis
 * @returns Array of shards
 */
export function shardAuto(
  spec: string,
  options: ShardOptions,
  analysis: ShardAnalysis
): SpecShard[] {
  const estimatedTokens = analysis.totalTokens;
  const maxTokens = options.maxTokensPerShard;
  
  // If spec is small enough, don't shard
  if (estimatedTokens <= maxTokens) {
    return [{
      id: 'auto-00-full',
      type: 'mixed',
      content: spec,
      dependencies: [],
      priority: 0,
    }];
  }
  
  // Determine best strategy based on content analysis
  let strategy: 'by-section' | 'by-requirement' | 'by-scenario';
  
  if (analysis.scenarioCount > analysis.requirementCount && analysis.scenarioCount > 5) {
    strategy = 'by-scenario';
  } else if (analysis.requirementCount > 10) {
    strategy = 'by-requirement';
  } else if (analysis.sectionCount >= 3) {
    strategy = 'by-section';
  } else {
    // Default to section-based with fallback to chunking
    strategy = 'by-section';
  }
  
  // Apply chosen strategy
  let shards: SpecShard[];
  switch (strategy) {
    case 'by-scenario':
      shards = shardByScenario(spec, options);
      break;
    case 'by-requirement':
      shards = shardByRequirement(spec, options);
      break;
    case 'by-section':
    default:
      shards = shardBySection(spec, options);
      break;
  }
  
  // Post-process: ensure token limits are respected
  shards = enforceTokenLimits(shards, maxTokens);
  
  // Post-process: merge tiny shards if they would fit together
  shards = mergeTinyShards(shards, maxTokens);
  
  // Update IDs to reflect auto strategy
  for (const shard of shards) {
    if (!shard.id.startsWith('auto-')) {
      shard.id = `auto-${shard.id}`;
    }
  }
  
  return shards;
}

/**
 * Enforce token limits on all shards
 */
function enforceTokenLimits(shards: SpecShard[], maxTokens: number): SpecShard[] {
  const result: SpecShard[] = [];
  
  for (const shard of shards) {
    const estimatedTokens = Math.ceil(shard.content.length / 4);
    
    if (estimatedTokens <= maxTokens) {
      result.push(shard);
      continue;
    }
    
    // Split oversized shard by logical boundaries
    const subShards = splitShard(shard, maxTokens);
    result.push(...subShards);
  }
  
  return result;
}

/**
 * Split a shard into smaller pieces respecting token limits
 */
function splitShard(shard: SpecShard, maxTokens: number): SpecShard[] {
  const content = shard.content;
  const maxChars = maxTokens * 4; // Rough estimate
  
  // Try to split by headers first
  const headerSplit = content.split(/^(#{1,3}\s+.+)$/m);
  
  if (headerSplit.length > 1) {
    // Can split by headers
    return splitByHeaders(shard, headerSplit, maxChars);
  }
  
  // Try to split by paragraphs
  const paragraphs = content.split('\n\n');
  if (paragraphs.length > 1) {
    return splitByParagraphs(shard, paragraphs, maxChars);
  }
  
  // Last resort: split by character count
  return splitByChars(shard, maxChars);
}

/**
 * Split shard by headers
 */
function splitByHeaders(shard: SpecShard, parts: string[], maxChars: number): SpecShard[] {
  const subShards: SpecShard[] = [];
  let currentChunk: string[] = [];
  let currentChars = 0;
  let chunkIndex = 0;
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const partChars = part.length;
    
    // If adding this part would exceed limit and we have content, save chunk
    if (currentChars + partChars > maxChars && currentChunk.length > 0) {
      subShards.push(createSubShard(shard, currentChunk.join(''), chunkIndex));
      currentChunk = [];
      currentChars = 0;
      chunkIndex++;
    }
    
    currentChunk.push(part);
    currentChars += partChars;
  }
  
  // Save final chunk
  if (currentChunk.length > 0) {
    subShards.push(createSubShard(shard, currentChunk.join(''), chunkIndex));
  }
  
  return subShards;
}

/**
 * Split shard by paragraphs
 */
function splitByParagraphs(shard: SpecShard, paragraphs: string[], maxChars: number): SpecShard[] {
  const subShards: SpecShard[] = [];
  let currentChunk: string[] = [];
  let currentChars = 0;
  let chunkIndex = 0;
  
  for (const paragraph of paragraphs) {
    const paraChars = paragraph.length + 2; // +2 for \n\n
    
    if (currentChars + paraChars > maxChars && currentChunk.length > 0) {
      subShards.push(createSubShard(shard, currentChunk.join('\n\n'), chunkIndex));
      currentChunk = [];
      currentChars = 0;
      chunkIndex++;
    }
    
    currentChunk.push(paragraph);
    currentChars += paraChars;
  }
  
  if (currentChunk.length > 0) {
    subShards.push(createSubShard(shard, currentChunk.join('\n\n'), chunkIndex));
  }
  
  return subShards;
}

/**
 * Split shard by character count (last resort)
 */
function splitByChars(shard: SpecShard, maxChars: number): SpecShard[] {
  const content = shard.content;
  const subShards: SpecShard[] = [];
  
  let remaining = content;
  let chunkIndex = 0;
  
  while (remaining.length > 0) {
    let splitPoint = maxChars;
    
    // Try to find a good breaking point (newline or space)
    if (splitPoint < remaining.length) {
      const searchStart = Math.max(0, splitPoint - 100);
      const searchEnd = Math.min(remaining.length, splitPoint + 100);
      const searchArea = remaining.substring(searchStart, searchEnd);
      
      const lastNewline = searchArea.lastIndexOf('\n');
      if (lastNewline > 0 && searchStart + lastNewline < splitPoint) {
        splitPoint = searchStart + lastNewline;
      } else {
        const lastSpace = searchArea.lastIndexOf(' ');
        if (lastSpace > 0 && searchStart + lastSpace < splitPoint) {
          splitPoint = searchStart + lastSpace;
        }
      }
    } else {
      splitPoint = remaining.length;
    }
    
    const chunk = remaining.substring(0, splitPoint);
    remaining = remaining.substring(splitPoint).trimStart();
    
    subShards.push(createSubShard(shard, chunk, chunkIndex));
    chunkIndex++;
  }
  
  return subShards;
}

/**
 * Create a sub-shard from a parent shard
 */
function createSubShard(parent: SpecShard, content: string, index: number): SpecShard {
  return {
    id: `${parent.id}-part-${index.toString().padStart(2, '0')}`,
    type: parent.type,
    content,
    parentId: parent.id,
    dependencies: index === 0 ? [parent.parentId || ''].filter(Boolean) : [`${parent.id}-part-${(index - 1).toString().padStart(2, '0')}`],
    priority: parent.priority + index,
    sectionName: parent.sectionName,
  };
}

/**
 * Merge tiny shards that would fit together under token limit
 */
function mergeTinyShards(shards: SpecShard[], maxTokens: number): SpecShard[] {
  const minTokens = Math.floor(maxTokens * 0.1); // Consider shards under 10% of max as "tiny"
  const maxChars = maxTokens * 4;
  
  const result: SpecShard[] = [];
  let currentMerge: SpecShard[] = [];
  let currentChars = 0;
  
  for (const shard of shards) {
    const shardChars = shard.content.length;
    const shardTokens = Math.ceil(shardChars / 4);
    
    // If shard is tiny, consider merging
    if (shardTokens < minTokens && shard.type !== 'metadata') {
      if (currentChars + shardChars <= maxChars) {
        currentMerge.push(shard);
        currentChars += shardChars;
      } else {
        // Flush current merge
        if (currentMerge.length > 0) {
          result.push(mergeShardGroup(currentMerge));
        }
        currentMerge = [shard];
        currentChars = shardChars;
      }
    } else {
      // Flush current merge if any
      if (currentMerge.length > 0) {
        result.push(mergeShardGroup(currentMerge));
        currentMerge = [];
        currentChars = 0;
      }
      result.push(shard);
    }
  }
  
  // Flush final merge
  if (currentMerge.length > 0) {
    result.push(mergeShardGroup(currentMerge));
  }
  
  return result;
}

/**
 * Merge a group of shards into a single shard
 */
function mergeShardGroup(shards: SpecShard[]): SpecShard {
  if (shards.length === 1) {
    return shards[0];
  }
  
  const first = shards[0];
  const content = shards.map(s => s.content).join('\n\n---\n\n');
  
  return {
    id: `${first.id}-merged`,
    type: first.type,
    content,
    parentId: first.parentId,
    dependencies: first.dependencies,
    priority: first.priority,
    sectionName: first.sectionName,
  };
}
