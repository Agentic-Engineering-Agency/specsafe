/**
 * By-Section Sharding Strategy
 * Shards specs based on ## headers
 */

import type { SpecShard, ShardOptions } from '../types.js';

/**
 * Shard a spec by section headers (## level)
 * @param spec - The spec content
 * @param options - Sharding options
 * @returns Array of shards
 */
export function shardBySection(spec: string, options: ShardOptions): SpecShard[] {
  const shards: SpecShard[] = [];
  const lines = spec.split('\n');
  
  // Default section patterns (## headers)
  const sectionPattern = /^##\s+(.+)$/;
  
  let currentSection: { name: string; content: string[]; startLine: number } | null = null;
  let headerContent: string[] = [];
  let sectionIndex = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(sectionPattern);
    
    if (match) {
      // Save previous section if exists
      if (currentSection) {
        const shard: SpecShard = {
          id: `section-${sectionIndex.toString().padStart(2, '0')}-${sanitizeId(currentSection.name)}`,
          type: 'mixed',
          content: currentSection.content.join('\n'),
          dependencies: [],
          priority: sectionIndex,
          sectionName: currentSection.name,
        };
        shards.push(shard);
        sectionIndex++;
      } else if (headerContent.length > 0) {
        // Create header shard from content before first section
        const headerShard: SpecShard = {
          id: 'section-00-header',
          type: 'metadata',
          content: headerContent.join('\n'),
          dependencies: [],
          priority: 0,
          sectionName: 'Header',
        };
        shards.push(headerShard);
      }
      
      // Start new section
      currentSection = {
        name: match[1].trim(),
        content: [line],
        startLine: i,
      };
    } else if (currentSection) {
      currentSection.content.push(line);
    } else {
      headerContent.push(line);
    }
  }
  
  // Save final section
  if (currentSection) {
    const shard: SpecShard = {
      id: `section-${sectionIndex.toString().padStart(2, '0')}-${sanitizeId(currentSection.name)}`,
      type: 'mixed',
      content: currentSection.content.join('\n'),
      dependencies: [],
      priority: sectionIndex,
      sectionName: currentSection.name,
    };
    shards.push(shard);
  } else if (headerContent.length > 0) {
    // No sections found, treat everything as one shard
    const shard: SpecShard = {
      id: 'section-00-full',
      type: 'mixed',
      content: headerContent.join('\n'),
      dependencies: [],
      priority: 0,
    };
    shards.push(shard);
  }
  
  // Set up parent relationships - header is parent of all
  if (shards.length > 1 && shards[0].id.includes('header')) {
    for (let i = 1; i < shards.length; i++) {
      shards[i].parentId = shards[0].id;
      shards[i].dependencies.push(shards[0].id);
    }
  }
  
  // Handle token limits by splitting large sections
  if (options.maxTokensPerShard > 0) {
    return enforceTokenLimit(shards, options);
  }
  
  return shards;
}

/**
 * Sanitize a section name for use in an ID
 */
function sanitizeId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30);
}

/**
 * Enforce token limits by splitting large shards
 */
function enforceTokenLimit(shards: SpecShard[], options: ShardOptions): SpecShard[] {
  const result: SpecShard[] = [];
  
  for (const shard of shards) {
    // Rough token estimate: chars / 4
    const estimatedTokens = Math.ceil(shard.content.length / 4);
    
    if (estimatedTokens <= options.maxTokensPerShard) {
      result.push(shard);
      continue;
    }
    
    // Split large shard by paragraphs
    const paragraphs = shard.content.split('\n\n');
    let currentChunk: string[] = [];
    let currentTokens = 0;
    let chunkIndex = 0;
    
    for (const paragraph of paragraphs) {
      const paraTokens = Math.ceil(paragraph.length / 4);

      // If a single paragraph exceeds the limit, split it by character size
      if (paraTokens > options.maxTokensPerShard) {
        if (currentChunk.length > 0) {
          const chunkShard: SpecShard = {
            id: `${shard.id}-chunk-${chunkIndex.toString().padStart(2, '0')}`,
            type: shard.type,
            content: currentChunk.join('\n\n'),
            parentId: shard.id,
            dependencies: chunkIndex === 0 ? [shard.parentId || ''] : [`${shard.id}-chunk-${(chunkIndex - 1).toString().padStart(2, '0')}`],
            priority: shard.priority + chunkIndex,
            sectionName: shard.sectionName,
          };
          result.push(chunkShard);
          currentChunk = [];
          currentTokens = 0;
          chunkIndex++;
        }

        const maxChars = options.maxTokensPerShard * 4;
        for (let start = 0; start < paragraph.length; start += maxChars) {
          const part = paragraph.slice(start, start + maxChars);
          const chunkShard: SpecShard = {
            id: `${shard.id}-chunk-${chunkIndex.toString().padStart(2, '0')}`,
            type: shard.type,
            content: part,
            parentId: shard.id,
            dependencies: chunkIndex === 0 ? [shard.parentId || ''] : [`${shard.id}-chunk-${(chunkIndex - 1).toString().padStart(2, '0')}`],
            priority: shard.priority + chunkIndex,
            sectionName: shard.sectionName,
          };
          result.push(chunkShard);
          chunkIndex++;
        }
        continue;
      }
      
      if (currentTokens + paraTokens > options.maxTokensPerShard && currentChunk.length > 0) {
        // Save current chunk
        const chunkShard: SpecShard = {
          id: `${shard.id}-chunk-${chunkIndex.toString().padStart(2, '0')}`,
          type: shard.type,
          content: currentChunk.join('\n\n'),
          parentId: shard.id,
          dependencies: chunkIndex === 0 ? [shard.parentId || ''] : [`${shard.id}-chunk-${(chunkIndex - 1).toString().padStart(2, '0')}`],
          priority: shard.priority + chunkIndex,
          sectionName: shard.sectionName,
        };
        result.push(chunkShard);
        
        currentChunk = [paragraph];
        currentTokens = paraTokens;
        chunkIndex++;
      } else {
        currentChunk.push(paragraph);
        currentTokens += paraTokens;
      }
    }
    
    // Save final chunk
    if (currentChunk.length > 0) {
      const chunkShard: SpecShard = {
        id: `${shard.id}-chunk-${chunkIndex.toString().padStart(2, '0')}`,
        type: shard.type,
        content: currentChunk.join('\n\n'),
        parentId: shard.id,
        dependencies: chunkIndex === 0 ? [shard.parentId || ''] : [`${shard.id}-chunk-${(chunkIndex - 1).toString().padStart(2, '0')}`],
        priority: shard.priority + chunkIndex,
        sectionName: shard.sectionName,
      };
      result.push(chunkShard);
    }
  }
  
  // Clean up empty dependencies
  for (const shard of result) {
    shard.dependencies = shard.dependencies.filter(d => d);
  }
  
  return result;
}
