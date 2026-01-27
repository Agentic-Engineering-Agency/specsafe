/**
 * SpecSafe - TDD Framework for AI-Assisted Development
 *
 * Core library exports
 */

export { ProjectInitializer } from './core/Initializer.js';
export { ProjectStateManager } from './core/ProjectState.js';

export type {
  Phase,
  Spec,
  ProjectState,
  ChangeLogEntry,
  QAResult,
  Config,
} from './types.js';

export { DEFAULT_CONFIG } from './types.js';

export { logger, getTimestamp } from './utils/logger.js';
