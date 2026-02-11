/**
 * Validation utilities for SpecSafe
 */

const SPEC_ID_REGEX = /^SPEC-\d{8}-\d{3}$/;

/**
 * Validates that a spec ID matches the required format: SPEC-YYYYMMDD-NNN
 * @param id - The spec ID to validate
 * @throws Error if the ID is invalid
 */
export function validateSpecId(id: string): void {
  if (!id || typeof id !== 'string') {
    throw new Error('Spec ID is required and must be a string');
  }
  
  if (!SPEC_ID_REGEX.test(id)) {
    throw new Error(
      `Invalid spec ID format: "${id}". Expected format: SPEC-YYYYMMDD-NNN (e.g., SPEC-20250211-001)`
    );
  }
}
