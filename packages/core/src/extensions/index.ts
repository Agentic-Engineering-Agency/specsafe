/**
 * SpecSafe Extension System
 * 
 * Provides a plugin architecture for extending SpecSafe functionality
 * at various lifecycle hooks.
 */

// Type exports
export type {
  Extension,
  ExtensionHook,
  ExtensionContext,
  ExtensionResult,
  HookRegistration,
} from './types.js';

// Re-export registry methods as standalone functions
export { ExtensionRegistry } from './registry.js';

import { ExtensionRegistry } from './registry.js';
import type { Extension, ExtensionHook, ExtensionContext, ExtensionResult } from './types.js';

/**
 * Register an extension
 */
export function registerExtension(extension: Extension): void {
  ExtensionRegistry.register(extension);
}

/**
 * Unregister an extension
 */
export function unregisterExtension(extensionId: string): boolean {
  return ExtensionRegistry.unregister(extensionId);
}

/**
 * Get an extension by ID
 */
export function getExtension(extensionId: string): Extension | undefined {
  return ExtensionRegistry.get(extensionId);
}

/**
 * List all registered extensions
 */
export function listExtensions(): Extension[] {
  return ExtensionRegistry.list();
}

/**
 * List enabled extensions only
 */
export function listEnabledExtensions(): Extension[] {
  return ExtensionRegistry.listEnabled();
}

/**
 * Check if an extension exists
 */
export function hasExtension(extensionId: string): boolean {
  return ExtensionRegistry.has(extensionId);
}

/**
 * Enable an extension
 */
export function enableExtension(extensionId: string): boolean {
  return ExtensionRegistry.enable(extensionId);
}

/**
 * Disable an extension
 */
export function disableExtension(extensionId: string): boolean {
  return ExtensionRegistry.disable(extensionId);
}

/**
 * Execute hooks for a phase
 */
export function executeHooks(phase: ExtensionHook, context: ExtensionContext): Promise<ExtensionResult[]> {
  return ExtensionRegistry.executeHooks(phase, context);
}

/**
 * Clear all extensions (useful for testing)
 */
export function clearExtensions(): void {
  ExtensionRegistry.clear();
}

// Loader exports
export { validateExtension, loadExtension, loadExtensions, loadBuiltinExtensions } from './loader.js';

// Type-only exports for better tree-shaking
export type { Extension as ExtensionConfig } from './types.js';
export type { ExtensionHook as ExtensionPhase } from './types.js';
export type ExtensionRegistryEntry = Extension;
