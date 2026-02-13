/**
 * Spec Sharding Types
 * Defines data structures for breaking large specs into AI-consumable chunks
 */

/** Strategy for splitting specs into shards */
export type ShardStrategy = 'by-section' | 'by-requirement' | 'by-scenario' | 'auto';

/** Type of content within a shard */
export type ShardType = 'header' | 'requirement' | 'scenario' | 'metadata' | 'mixed';

/** A single shard of a spec */
export interface SpecShard {
  /** Unique identifier for this shard */
  id: string;
  /** Type of content in this shard */
  type: ShardType;
  /** The actual content of the shard */
  content: string;
  /** Parent shard ID for hierarchical relationships */
  parentId?: string;
  /** IDs of shards this shard depends on */
  dependencies: string[];
  /** Estimated token count for LLM context limits */
  tokenCount?: number;
  /** Priority for processing order (0 = highest) */
  priority: number;
  /** Original source file/location */
  source?: string;
  /** Section name if applicable */
  sectionName?: string;
}

/** Plan for sharding a spec */
export interface ShardPlan {
  /** Array of shards to process */
  shards: SpecShard[];
  /** Total estimated tokens across all shards */
  estimatedTokens: number;
  /** Recommended processing order (shard IDs) */
  recommendedOrder: string[];
  /** Cross-references between shards */
  crossReferences: CrossReference[];
  /** Analysis metadata */
  analysis: ShardAnalysis;
}

/** Cross-reference between shards */
export interface CrossReference {
  /** Source shard ID */
  from: string;
  /** Target shard ID */
  to: string;
  /** Type of reference */
  type: 'depends-on' | 'references' | 'extends' | 'implements';
  /** Description of the relationship */
  description?: string;
}

/** Analysis results for a spec */
export interface ShardAnalysis {
  /** Recommended strategy based on content */
  recommendedStrategy: ShardStrategy;
  /** Complexity score (0-100) */
  complexity: number;
  /** Number of sections detected */
  sectionCount: number;
  /** Number of requirements detected */
  requirementCount: number;
  /** Number of scenarios detected */
  scenarioCount: number;
  /** Total lines in the spec */
  totalLines: number;
  /** Estimated tokens for the full spec */
  totalTokens: number;
  /** Reason for recommendation */
  recommendationReason: string;
}

/** Options for sharding a spec */
export interface ShardOptions {
  /** Strategy to use for sharding */
  strategy: ShardStrategy;
  /** Maximum tokens per shard */
  maxTokensPerShard: number;
  /** Preserve context across shards */
  preserveContext: boolean;
  /** Include metadata in shards */
  includeMetadata: boolean;
  /** Custom section patterns for by-section strategy */
  sectionPatterns?: RegExp[];
}

/** Default shard options */
export const DEFAULT_SHARD_OPTIONS: ShardOptions = {
  strategy: 'auto',
  maxTokensPerShard: 2000,
  preserveContext: true,
  includeMetadata: true,
};

/** Result of a shard operation */
export interface ShardResult {
  /** The generated shard plan */
  plan: ShardPlan;
  /** Whether the operation was successful */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Duration of the operation in ms */
  durationMs: number;
}

/** Merge result from combining shards */
export interface MergeResult {
  /** Reconstructed spec content */
  content: string;
  /** Whether merge was successful */
  success: boolean;
  /** Missing shards if any */
  missingShards?: string[];
  /** Conflicts detected during merge */
  conflicts?: MergeConflict[];
}

/** Conflict during merge operation */
export interface MergeConflict {
  /** Shard IDs involved */
  shardIds: string[];
  /** Description of the conflict */
  description: string;
  /** Suggested resolution */
  suggestion?: string;
}
