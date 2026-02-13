import type { Extension } from './types.js';
import { ExtensionRegistry } from './registry.js';

/**
 * Validate extension structure
 * @param ext - Extension to validate
 * @returns true if extension is valid
 * @throws Error if extension is invalid
 */
export function validateExtension(ext: unknown): ext is Extension {
  if (!ext || typeof ext !== 'object') {
    throw new Error('Extension must be an object');
  }

  const extension = ext as Partial<Extension>;

  if (!extension.id || typeof extension.id !== 'string') {
    throw new Error('Extension must have a string "id" field');
  }

  if (!extension.name || typeof extension.name !== 'string') {
    throw new Error('Extension must have a string "name" field');
  }

  if (!extension.description || typeof extension.description !== 'string') {
    throw new Error('Extension must have a string "description" field');
  }

  if (!extension.version || typeof extension.version !== 'string') {
    throw new Error('Extension must have a string "version" field');
  }

  if (!extension.hooks || typeof extension.hooks !== 'object') {
    throw new Error('Extension must have a "hooks" object');
  }

  return true;
}

/**
 * Load a single extension
 * @param extension - Extension to load
 * @param autoRegister - Whether to automatically register the extension (default: true)
 * @returns The loaded extension
 */
export function loadExtension(extension: Extension, autoRegister = true): Extension {
  validateExtension(extension);

  if (autoRegister) {
    ExtensionRegistry.register(extension);
  }

  return extension;
}

/**
 * Load multiple extensions
 * @param extensions - Array of extensions to load
 * @param autoRegister - Whether to automatically register extensions (default: true)
 * @returns Array of loaded extensions
 */
export function loadExtensions(extensions: Extension[], autoRegister = true): Extension[] {
  return extensions.map(ext => loadExtension(ext, autoRegister));
}

/**
 * Load builtin extensions
 * @returns Array of loaded builtin extensions
 */
export async function loadBuiltinExtensions(): Promise<Extension[]> {
  const { owaspExtension } = await import('./builtins/owasp.js');
  const { complexityExtension } = await import('./builtins/complexity.js');

  const builtins = [owaspExtension, complexityExtension];

  return loadExtensions(builtins, true);
}
