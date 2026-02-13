/**
 * Spec Sharding Module
 * Break large specs into smaller, AI-consumable chunks
 */

// Types
export type {
  ShardStrategy,
  ShardType,
  SpecShard,
  ShardPlan,
  ShardOptions,
  ShardResult,
  MergeResult,
  ShardAnalysis,
  CrossReference,
  MergeConflict,
} from './types.js';

// Constants
export { DEFAULT_SHARD_OPTIONS } from './types.js';

// Main engine
export { ShardEngine } from './sharding.js';

// Strategies
export { shardBySection } from './strategies/by-section.js';
export { shardByRequirement } from './strategies/by-requirement.js';
export { shardByScenario } from './strategies/by-scenario.js';
export { shardAuto } from './strategies/auto.js';
