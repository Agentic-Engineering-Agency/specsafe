import type { Extension, ExtensionHook, ExtensionContext, ExtensionResult, HookRegistration } from './types.js';

/**
 * Global extension registry
 */
class ExtensionRegistryClass {
  private extensions: Map<string, Extension> = new Map();
  private hooks: Map<ExtensionHook, HookRegistration[]> = new Map();

  /**
   * Register an extension
   * @param extension - Extension to register
   * @throws Error if extension with same ID already exists
   */
  register(extension: Extension): void {
    if (this.extensions.has(extension.id)) {
      throw new Error(`Extension with ID "${extension.id}" is already registered`);
    }

    this.extensions.set(extension.id, extension);

    // Register hooks
    for (const [phase, handler] of Object.entries(extension.hooks)) {
      if (typeof handler === 'function') {
        const registration: HookRegistration = {
          extensionId: extension.id,
          phase: phase as ExtensionHook,
          handler,
          priority: 0,
        };

        const phaseHooks = this.hooks.get(phase as ExtensionHook) || [];
        phaseHooks.push(registration);
        phaseHooks.sort((a, b) => (a.priority || 0) - (b.priority || 0));
        this.hooks.set(phase as ExtensionHook, phaseHooks);
      }
    }
  }

  /**
   * Unregister an extension
   * @param extensionId - ID of extension to unregister
   * @returns true if extension was found and removed
   */
  unregister(extensionId: string): boolean {
    const extension = this.extensions.get(extensionId);
    if (!extension) {
      return false;
    }

    // Remove all hooks for this extension
    for (const [phase, registrations] of this.hooks.entries()) {
      const filtered = registrations.filter(r => r.extensionId !== extensionId);
      if (filtered.length > 0) {
        this.hooks.set(phase, filtered);
      } else {
        this.hooks.delete(phase);
      }
    }

    this.extensions.delete(extensionId);
    return true;
  }

  /**
   * Get an extension by ID
   * @param extensionId - Extension ID
   * @returns Extension or undefined if not found
   */
  get(extensionId: string): Extension | undefined {
    return this.extensions.get(extensionId);
  }

  /**
   * Get all registered extensions
   * @returns Array of all extensions
   */
  list(): Extension[] {
    return Array.from(this.extensions.values());
  }

  /**
   * Get enabled extensions only
   * @returns Array of enabled extensions
   */
  listEnabled(): Extension[] {
    return this.list().filter(ext => ext.enabled !== false);
  }

  /**
   * Check if an extension exists
   * @param extensionId - Extension ID
   * @returns true if extension is registered
   */
  has(extensionId: string): boolean {
    return this.extensions.has(extensionId);
  }

  /**
   * Enable an extension
   * @param extensionId - Extension ID
   * @returns true if extension was found and enabled
   */
  enable(extensionId: string): boolean {
    const extension = this.extensions.get(extensionId);
    if (!extension) {
      return false;
    }
    extension.enabled = true;
    return true;
  }

  /**
   * Disable an extension
   * @param extensionId - Extension ID
   * @returns true if extension was found and disabled
   */
  disable(extensionId: string): boolean {
    const extension = this.extensions.get(extensionId);
    if (!extension) {
      return false;
    }
    extension.enabled = false;
    return true;
  }

  /**
   * Get hooks for a specific phase
   * @param phase - Hook phase
   * @returns Array of hook registrations for this phase
   */
  getHooks(phase: ExtensionHook): HookRegistration[] {
    return this.hooks.get(phase) || [];
  }

  /**
   * Execute all hooks for a phase
   * @param phase - Hook phase
   * @param context - Extension context
   * @returns Array of results from all hooks
   */
  async executeHooks(phase: ExtensionHook, context: ExtensionContext): Promise<ExtensionResult[]> {
    const phaseHooks = this.getHooks(phase);
    const results: ExtensionResult[] = [];

    for (const hook of phaseHooks) {
      const extension = this.extensions.get(hook.extensionId);
      // Skip disabled extensions
      if (!extension || extension.enabled === false) {
        continue;
      }

      try {
        const result = await hook.handler(context);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          message: `Extension "${hook.extensionId}" failed`,
          errors: [error instanceof Error ? error.message : String(error)],
        });
      }
    }

    return results;
  }

  /**
   * Clear all extensions (useful for testing)
   */
  clear(): void {
    this.extensions.clear();
    this.hooks.clear();
  }
}

// Export singleton instance
export const ExtensionRegistry = new ExtensionRegistryClass();
