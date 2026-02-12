import type { Spec } from '../types.js';

/**
 * Extension hook phases in the SpecSafe workflow
 */
export type ExtensionHook = 
  | 'pre-validate'
  | 'post-validate'
  | 'pre-generate'
  | 'post-generate'
  | 'pre-commit';

/**
 * Context provided to extension hooks
 */
export interface ExtensionContext {
  /** The spec being processed */
  spec: Spec;
  /** Current phase of execution */
  phase: ExtensionHook;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Result returned by extension hooks
 */
export interface ExtensionResult {
  /** Whether the extension check passed */
  success: boolean;
  /** Optional message describing the result */
  message?: string;
  /** Optional suggestions for improvement */
  suggestions?: string[];
  /** Optional warnings (non-blocking) */
  warnings?: string[];
  /** Optional errors (blocking) */
  errors?: string[];
  /** Additional data returned by the extension */
  data?: Record<string, unknown>;
}

/**
 * Extension definition
 */
export interface Extension {
  /** Unique identifier for the extension */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what the extension does */
  description: string;
  /** Extension version */
  version: string;
  /** Author/maintainer */
  author?: string;
  /** Hooks this extension provides */
  hooks: {
    [K in ExtensionHook]?: (context: ExtensionContext) => Promise<ExtensionResult> | ExtensionResult;
  };
  /** Whether the extension is enabled */
  enabled?: boolean;
  /** Extension configuration */
  config?: Record<string, unknown>;
}

/**
 * Hook registration entry
 */
export interface HookRegistration {
  /** Extension that registered this hook */
  extensionId: string;
  /** Hook phase */
  phase: ExtensionHook;
  /** Hook handler function */
  handler: (context: ExtensionContext) => Promise<ExtensionResult> | ExtensionResult;
  /** Priority (lower = runs first) */
  priority?: number;
}
