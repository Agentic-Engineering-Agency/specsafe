/**
 * Default output path utilities for spec files.
 */

/**
 * Returns the default output path for a generated spec.
 * Uses a timestamp to ensure uniqueness.
 */
export function defaultOutputPath(ts: number = Date.now()): string {
  return `specs/active/SPEC-${ts}.md`;
}
