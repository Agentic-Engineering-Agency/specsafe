/**
 * JSON Exporter
 * Full machine-readable JSON export
 */

import type { ParsedSpec, ExportResult } from '../types.js';

/**
 * Export a parsed spec to full machine-readable JSON format
 */
export function exportToJSON(spec: ParsedSpec, includeMetadata: boolean = true, includeHistory: boolean = false): ExportResult {
  const exportData: Record<string, unknown> = {
    id: spec.id,
    name: spec.name,
    description: spec.description,
    stage: spec.stage,
  };

  if (includeMetadata) {
    exportData.metadata = {
      author: spec.metadata.author,
      project: spec.metadata.project,
      tags: spec.metadata.tags,
      createdAt: spec.createdAt.toISOString(),
      updatedAt: spec.updatedAt.toISOString(),
      completedAt: spec.completedAt?.toISOString(),
    };
  }

  if (includeHistory) {
    exportData.history = {
      createdAt: spec.createdAt.toISOString(),
      updatedAt: spec.updatedAt.toISOString(),
      completedAt: spec.completedAt?.toISOString(),
      version: '1.0.0',
    };
  }

  // Add PRD data
  if (spec.prd) {
    exportData.prd = spec.prd;
  }

  // Add requirements
  if (spec.requirements?.length) {
    exportData.requirements = spec.requirements.map(req => ({
      id: req.id,
      text: req.text,
      priority: req.priority,
      scenarios: req.scenarios?.map(scenario => ({
        id: scenario.id,
        given: scenario.given,
        when: scenario.when,
        thenOutcome: scenario.thenOutcome,
      })),
    }));
  }

  // Add architecture
  if (spec.architecture) {
    exportData.architecture = spec.architecture;
  }

  // Add scenarios
  if (spec.scenarios?.length) {
    exportData.scenarios = spec.scenarios.map(scenario => ({
      id: scenario.id,
      name: scenario.name,
      given: scenario.given,
      when: scenario.when,
      thenOutcome: scenario.thenOutcome,
    }));
  }

  // Add design
  if (spec.design) {
    exportData.design = spec.design;
  }

  // Add test results
  if (spec.testResults) {
    exportData.testResults = spec.testResults;
  }

  // Add risks
  if (spec.risks?.length) {
    exportData.risks = spec.risks;
  }

  // Add timeline
  if (spec.timeline) {
    exportData.timeline = spec.timeline;
  }

  const content = JSON.stringify(exportData, null, 2);

  return {
    content,
    filename: `${spec.id.toLowerCase()}.json`,
    mimeType: 'application/json',
    size: Buffer.byteLength(content, 'utf-8'),
  };
}

/**
 * Export multiple specs as a JSON array
 */
export function exportSpecsToJSON(
  specs: ParsedSpec[],
  includeMetadata: boolean = true,
  includeHistory: boolean = false
): ExportResult {
  const exportData = specs.map(spec => {
    const singleExport = exportToJSON(spec, includeMetadata, includeHistory);
    return JSON.parse(singleExport.content as string);
  });

  const content = JSON.stringify(exportData, null, 2);

  return {
    content,
    filename: 'specs-export.json',
    mimeType: 'application/json',
    size: Buffer.byteLength(content, 'utf-8'),
  };
}
