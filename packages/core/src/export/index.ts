/**
 * Export System - Index
 * Exports all export functionality for SpecSafe
 */

import type { ParsedSpec, ExportFormat, ExportResult, StakeholderBundle } from './types.js';
import { exportToMarkdown } from './exporters/markdown.js';
import { exportToJSON, exportSpecsToJSON } from './exporters/json.js';
import { exportToHTML } from './exporters/html.js';
import { generateStakeholderBundle, generateStakeholderView } from './exporters/stakeholder.js';

// Types
export type {
  ExportFormat,
  ExportOptions,
  ExportResult,
  StakeholderBundle,
  ParsedSpec,
  ExportConfig,
} from './types.js';

// Parser
export { parseSpec, parseSpecFromFile } from './parser.js';

// Path utilities
export {
  validatePath,
  sanitizeFilename,
  validateFilePath,
  validateExportFormat,
  isValidSpecId,
  validateOutputPath,
} from './path-utils.js';

// Exporters
export { exportToMarkdown } from './exporters/markdown.js';
export { exportToJSON, exportSpecsToJSON } from './exporters/json.js';
export { exportToHTML } from './exporters/html.js';
export {
  generateStakeholderBundle,
  generateStakeholderView,
} from './exporters/stakeholder.js';

/**
 * Main export function - delegates to appropriate exporter based on format
 */
export function exportSpec(
  spec: ParsedSpec,
  format: ExportFormat,
  options: {
    includeMetadata?: boolean;
    includeHistory?: boolean;
  } = {}
): ExportResult | StakeholderBundle {
  const { includeMetadata = true, includeHistory = false } = options;

  switch (format) {
    case 'markdown':
      return exportToMarkdown(spec, includeMetadata);

    case 'json':
      return exportToJSON(spec, includeMetadata, includeHistory);

    case 'html':
      return exportToHTML(spec, includeMetadata);

    case 'stakeholder':
      return generateStakeholderBundle(spec);

    case 'pdf-bundle':
      // PDF bundle is not yet implemented - return markdown as fallback
      return exportToMarkdown(spec, includeMetadata);

    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}
