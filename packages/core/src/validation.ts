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
    throw new Error(`Invalid spec ID format: "${id}". Expected format: SPEC-YYYYMMDD-NNN (e.g., SPEC-20250211-001)`);
  }
  
  // Validate the date portion is a real date
  const dateStr = id.substring(5, 13); // YYYYMMDD
  const year = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(dateStr.substring(4, 6), 10);
  const day = parseInt(dateStr.substring(6, 8), 10);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new Error(`Invalid spec ID "${id}": contains invalid date ${dateStr}. Expected format: SPEC-YYYYMMDD-NNN`);
  }
}
