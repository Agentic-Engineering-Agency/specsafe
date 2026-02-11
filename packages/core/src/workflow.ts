/**
 * SpecSafe Workflow Engine
 * Manages the 5-stage development cycle: SPEC → TEST → CODE → QA → COMPLETE
 */

import type { Spec, SpecStage, QAReport } from './types.js';

export class Workflow {
  private specs: Map<string, Spec> = new Map();

  /**
   * Create a new spec in the SPEC stage
   */
  createSpec(id: string, name: string, description: string, author: string, project: string): Spec {
    // Check if spec already exists to prevent overwriting
    if (this.specs.has(id)) {
      throw new Error(`Spec with ID ${id} already exists. Use a different name or delete the existing spec first.`);
    }
    
    const spec: Spec = {
      id,
      name,
      description,
      stage: 'spec',
      createdAt: new Date(),
      updatedAt: new Date(),
      requirements: [],
      testFiles: [],
      implementationFiles: [],
      metadata: {
        author,
        project,
        tags: []
      }
    };
    this.specs.set(id, spec);
    return spec;
  }

  /**
   * Get a spec by ID
   */
  getSpec(id: string): Spec | undefined {
    return this.specs.get(id);
  }

  /**
   * Load an existing spec into the workflow (for hydration from disk)
   */
  loadSpec(spec: Spec): void {
    this.specs.set(spec.id, spec);
  }

  /**
   * Get all specs
   */
  getAllSpecs(): Spec[] {
    return Array.from(this.specs.values());
  }

  /**
   * Get specs by stage
   */
  getSpecsByStage(stage: SpecStage): Spec[] {
    return this.getAllSpecs().filter(s => s.stage === stage);
  }

  /**
   * Transition spec to TEST stage
   * Requirements must be defined
   */
  moveToTest(specId: string): Spec {
    const spec = this.getSpec(specId);
    if (!spec) throw new Error(`Spec ${specId} not found`);
    if (spec.stage !== 'spec') {
      throw new Error(`Cannot move to TEST from ${spec.stage}. Must be in SPEC stage.`);
    }
    if (spec.requirements.length === 0) {
      throw new Error('Cannot move to TEST: No requirements defined');
    }
    
    spec.stage = 'test';
    spec.updatedAt = new Date();
    return spec;
  }

  /**
   * Transition spec to CODE stage
   * Tests must be generated
   */
  moveToCode(specId: string): Spec {
    const spec = this.getSpec(specId);
    if (!spec) throw new Error(`Spec ${specId} not found`);
    if (spec.stage !== 'test') {
      throw new Error(`Cannot move to CODE from ${spec.stage}. Must be in TEST stage.`);
    }
    if (spec.testFiles.length === 0) {
      throw new Error('Cannot move to CODE: No test files generated');
    }
    
    spec.stage = 'code';
    spec.updatedAt = new Date();
    return spec;
  }

  /**
   * Transition spec to QA stage
   * Implementation must be complete
   */
  moveToQA(specId: string): Spec {
    const spec = this.getSpec(specId);
    if (!spec) throw new Error(`Spec ${specId} not found`);
    if (spec.stage !== 'code') {
      throw new Error(`Cannot move to QA from ${spec.stage}. Must be in CODE stage.`);
    }
    if (spec.implementationFiles.length === 0) {
      throw new Error('Cannot move to QA: No implementation files');
    }
    
    spec.stage = 'qa';
    spec.updatedAt = new Date();
    return spec;
  }

  /**
   * Transition spec to COMPLETE stage
   * QA report must be provided with GO recommendation
   */
  moveToComplete(specId: string, qaReport: QAReport): Spec {
    const spec = this.getSpec(specId);
    if (!spec) throw new Error(`Spec ${specId} not found`);
    if (spec.stage !== 'qa') {
      throw new Error(`Cannot move to COMPLETE from ${spec.stage}. Must be in QA stage.`);
    }
    // Validate QA report belongs to target spec
    if (qaReport.specId !== specId) {
      throw new Error(`QA report spec ID (${qaReport.specId}) does not match target spec (${specId})`);
    }
    if (qaReport.recommendation !== 'GO') {
      throw new Error('Cannot complete: QA report recommends NO-GO. Address issues first.');
    }
    
    spec.stage = 'complete';
    spec.qaReport = qaReport;
    spec.completedAt = new Date();
    spec.updatedAt = new Date();
    return spec;
  }

  /**
   * Archive a completed spec
   */
  archiveSpec(specId: string): Spec {
    const spec = this.getSpec(specId);
    if (!spec) throw new Error(`Spec ${specId} not found`);
    if (spec.stage !== 'complete') {
      throw new Error(`Cannot archive spec in ${spec.stage} stage. Must be COMPLETE.`);
    }
    
    spec.stage = 'archived';
    spec.updatedAt = new Date();
    return spec;
  }

  /**
   * Get workflow status summary
   */
  getStatus(): { stage: SpecStage; count: number }[] {
    const stages: SpecStage[] = ['spec', 'test', 'code', 'qa', 'complete', 'archived'];
    return stages.map(stage => ({
      stage,
      count: this.getSpecsByStage(stage).length
    }));
  }

  /**
   * Validate stage transition
   */
  canTransition(specId: string, toStage: SpecStage): { valid: boolean; reason?: string } {
    const spec = this.getSpec(specId);
    if (!spec) return { valid: false, reason: 'Spec not found' };

    const transitions: Record<SpecStage, SpecStage[]> = {
      spec: ['test'],
      test: ['code'],
      code: ['qa'],
      qa: ['complete'],
      complete: ['archived'],
      archived: []
    };

    if (!transitions[spec.stage].includes(toStage)) {
      return { valid: false, reason: `Cannot transition from ${spec.stage} to ${toStage}` };
    }

    // Validate prerequisites based on target stage
    if (toStage === 'test' && spec.requirements.length === 0) {
      return { valid: false, reason: 'Cannot move to TEST: No requirements defined' };
    }
    if (toStage === 'code' && spec.testFiles.length === 0) {
      return { valid: false, reason: 'Cannot move to CODE: No test files generated' };
    }
    if (toStage === 'qa' && spec.implementationFiles.length === 0) {
      return { valid: false, reason: 'Cannot move to QA: No implementation files' };
    }
    // Note: 'complete' transition requires a QA report, but that's validated in moveToComplete()
    // since canTransition() doesn't have access to the QAReport parameter

    return { valid: true };
  }
}