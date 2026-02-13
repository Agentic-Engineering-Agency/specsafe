/**
 * Path Security Utilities
 * Prevents path traversal and validates file paths
 */

import { join, normalize, resolve, isAbsolute, relative } from 'path';

/**
 * Validate that a path doesn't escape the base directory (path traversal prevention)
 * @param basePath - The base directory to validate against
 * @param inputPath - The user-provided path to validate
 * @returns The resolved, safe path
 * @throws Error if path traversal is detected
 */
export function validatePath(basePath: string, inputPath: string): string {
  const resolvedBase = resolve(basePath);
  const resolvedInput = isAbsolute(inputPath)
    ? inputPath
    : resolve(basePath, inputPath);

  const relativePath = relative(resolvedBase, resolvedInput);

  // Check if path tries to escape base directory
  if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
    throw new Error(
      `Invalid path: Path traversal detected. Path must be within ${basePath}`
    );
  }

  return resolvedInput;
}

/**
 * Sanitize a filename to prevent directory traversal and invalid characters
 * @param filename - The user-provided filename
 * @returns A sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal sequences and path separators
  let sanitized = filename
    .replace(/\.\./g, '') // Parent directory
    .replace(/[\/\\]/g, '') // Path separators
    .replace(/^\//, '') // Leading slash
    .replace(/^\\/, ''); // Leading backslash

  // Remove invalid characters (keep letters, numbers, hyphens, underscores, dots)
  sanitized = sanitized.replace(/[<>:"|?*\x00-\x1F]/g, '');

  // Prevent empty filenames
  if (!sanitized || sanitized === '.') {
    throw new Error('Invalid filename: Filename cannot be empty');
  }

  return sanitized;
}

/**
 * Validate and sanitize a file path
 * @param filePath - The file path to validate
 * @param basePath - Optional base directory to validate against (defaults to process.cwd())
 * @returns The validated, safe file path
 */
export function validateFilePath(filePath: string, basePath: string = process.cwd()): string {
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\.\./,        // Parent directory
    /%2e%2e/i,    // URL-encoded parent directory
    /%5c/i,       // URL-encoded backslash
    /\0/,         // Null bytes
    /\$[{A-Za-z_]/, // Environment variables ($HOME or ${HOME})
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(filePath)) {
      throw new Error(
        `Invalid file path: Contains suspicious pattern "${pattern}"`
      );
    }
  }

  // Resolve the path
  const resolvedPath = resolve(basePath, filePath);

  // Ensure it's within the base directory
  const relativePath = relative(basePath, resolvedPath);
  if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
    throw new Error(
      `Invalid file path: Path must be within ${basePath}`
    );
  }

  return resolvedPath;
}

/**
 * Validate export format
 * @param format - The format string to validate
 * @returns The validated format
 * @throws Error if format is invalid
 */
export function validateExportFormat(format: string): 'markdown' | 'json' | 'html' | 'stakeholder' | 'pdf-bundle' {
  const validFormats: readonly string[] = ['markdown', 'json', 'html', 'stakeholder', 'pdf-bundle'];

  if (!validFormats.includes(format)) {
    throw new Error(
      `Invalid export format: "${format}". Valid formats are: ${validFormats.join(', ')}`
    );
  }

  return format as any;
}

/**
 * Validate spec ID format (e.g., SPEC-YYYYMMDD-NNN)
 * @param specId - The spec ID to validate
 * @returns true if valid, false otherwise
 */
export function isValidSpecId(specId: string): boolean {
  // Match pattern: SPEC-YYYYMMDD-NNN
  const specIdPattern = /^[A-Z]+-\d{4}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])-\d{3,}$/;
  if (!specIdPattern.test(specId)) return false;

  // Extract and validate the date
  const match = specId.match(/^([A-Z]+)-(\d{4})(\d{2})(\d{2})-(\d{3,})$/);
  if (!match) return false;

  const [, , year, month, day] = match;
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

  // Check if date is valid
  return (
    date.getFullYear() === parseInt(year) &&
    date.getMonth() === parseInt(month) - 1 &&
    date.getDate() === parseInt(day)
  );
}

/**
 * Create a safe output directory path
 * @param outputDir - The output directory path
 * @param basePath - Optional base directory (defaults to process.cwd())
 * @returns The validated, safe directory path
 */
export function validateOutputPath(outputDir: string, basePath: string = process.cwd()): string {
  if (!outputDir || outputDir.trim() === '') {
    throw new Error('Output path cannot be empty');
  }

  return validateFilePath(outputDir, basePath);
}
