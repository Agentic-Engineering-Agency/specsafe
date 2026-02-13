/**
 * Project Memory Manager
 * Manages project context persistence and retrieval
 */

import { readFile, writeFile, access, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import type {
  ProjectMemory,
  Decision,
  Pattern,
  MemoryConstraint,
  HistoryEntry,
  PatternExample
} from './types.js';

const MEMORY_FILE = '.specsafe/memory.json';

export class ProjectMemoryManager {
  private projectPath: string;
  private memoryFilePath: string;
  private memory: ProjectMemory | null = null;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.memoryFilePath = join(projectPath, MEMORY_FILE);
  }

  /**
   * Load memory from disk or create default if not exists
   */
  async load(projectId: string): Promise<ProjectMemory> {
    try {
      await access(this.memoryFilePath);
      const content = await readFile(this.memoryFilePath, 'utf-8');
      const parsed = JSON.parse(content) as ProjectMemory;
      
      // Convert date strings back to Date objects
      parsed.decisions = parsed.decisions.map(d => ({
        ...d,
        timestamp: new Date(d.timestamp)
      }));
      parsed.history = parsed.history.map(h => ({
        ...h,
        timestamp: new Date(h.timestamp)
      }));
      
      this.memory = parsed;
      return parsed;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // Create default memory
        this.memory = {
          projectId,
          specs: [],
          decisions: [],
          patterns: [],
          constraints: [],
          history: []
        };
        return this.memory;
      }
      throw error;
    }
  }

  /**
   * Save memory to disk
   */
  async save(): Promise<void> {
    if (!this.memory) {
      throw new Error('No memory loaded. Call load() first.');
    }

    // Ensure directory exists
    await mkdir(dirname(this.memoryFilePath), { recursive: true });
    
    await writeFile(
      this.memoryFilePath,
      JSON.stringify(this.memory, null, 2),
      'utf-8'
    );
  }

  /**
   * Get current memory (must call load() first)
   */
  getMemory(): ProjectMemory {
    if (!this.memory) {
      throw new Error('No memory loaded. Call load() first.');
    }
    return this.memory;
  }

  /**
   * Add a spec to the memory
   */
  addSpec(specId: string): void {
    if (!this.memory) {
      throw new Error('No memory loaded. Call load() first.');
    }

    if (!this.memory.specs.includes(specId)) {
      this.memory.specs.push(specId);
      this.addHistoryEntry(specId, 'created', `Spec ${specId} added to project memory`);
    }
  }

  /**
   * Record an architectural decision
   */
  addDecision(
    specId: string,
    decision: string,
    rationale: string,
    alternatives: string[] = []
  ): Decision {
    if (!this.memory) {
      throw new Error('No memory loaded. Call load() first.');
    }

    const newDecision: Decision = {
      id: `DECISION-${Date.now()}`,
      specId,
      decision,
      rationale,
      timestamp: new Date(),
      alternatives
    };

    this.memory.decisions.push(newDecision);
    this.addHistoryEntry(specId, 'decision', `Decision recorded: ${decision}`);
    
    return newDecision;
  }

  /**
   * Record a pattern discovered in a spec
   */
  recordPattern(specId: string, pattern: Omit<Pattern, 'id' | 'usageCount'>): Pattern {
    if (!this.memory) {
      throw new Error('No memory loaded. Call load() first.');
    }

    // Check if pattern already exists
    const existingPattern = this.memory.patterns.find(
      p => p.name.toLowerCase() === pattern.name.toLowerCase()
    );

    if (existingPattern) {
      // Update existing pattern
      existingPattern.usageCount++;
      if (pattern.examples && pattern.examples.length > 0) {
        existingPattern.examples.push(...pattern.examples);
      }
      this.addHistoryEntry(specId, 'pattern', `Pattern "${existingPattern.name}" used again`);
      return existingPattern;
    }

    // Create new pattern
    const newPattern: Pattern = {
      id: `PATTERN-${Date.now()}`,
      name: pattern.name,
      description: pattern.description,
      examples: pattern.examples || [],
      usageCount: 1
    };

    this.memory.patterns.push(newPattern);
    this.addHistoryEntry(specId, 'pattern', `New pattern "${newPattern.name}" recorded`);
    
    return newPattern;
  }

  /**
   * Add a constraint to the project
   */
  addConstraint(constraint: Omit<MemoryConstraint, 'id'>): MemoryConstraint {
    if (!this.memory) {
      throw new Error('No memory loaded. Call load() first.');
    }

    const newConstraint: MemoryConstraint = {
      id: `CONSTRAINT-${Date.now()}`,
      ...constraint
    };

    this.memory.constraints.push(newConstraint);
    return newConstraint;
  }

  /**
   * Get patterns that appear in multiple specs (reusable patterns)
   */
  getReusablePatterns(minUsageCount: number = 2): Pattern[] {
    if (!this.memory) {
      throw new Error('No memory loaded. Call load() first.');
    }

    return this.memory.patterns
      .filter(p => p.usageCount >= minUsageCount)
      .sort((a, b) => b.usageCount - a.usageCount);
  }

  /**
   * Find specs that share patterns or decisions with the given spec
   */
  getRelatedSpecs(specId: string): string[] {
    if (!this.memory) {
      throw new Error('No memory loaded. Call load() first.');
    }

    const relatedSpecs = new Set<string>();

    // Find specs that share patterns
    for (const pattern of this.memory.patterns) {
      const specIds = pattern.examples.map(e => e.specId);
      if (specIds.includes(specId)) {
        for (const id of specIds) {
          if (id !== specId) {
            relatedSpecs.add(id);
          }
        }
      }
    }

    // Find specs with related decisions
    const specDecisions = this.memory.decisions.filter(d => d.specId === specId);
    for (const decision of specDecisions) {
      const relatedDecisions = this.memory.decisions.filter(
        d => d.specId !== specId && 
             (d.decision.toLowerCase().includes(decision.decision.toLowerCase()) ||
              decision.decision.toLowerCase().includes(d.decision.toLowerCase()))
      );
      for (const rd of relatedDecisions) {
        relatedSpecs.add(rd.specId);
      }
    }

    return Array.from(relatedSpecs);
  }

  /**
   * Compile relevant context for a new spec
   */
  getContextForSpec(specId: string): {
    patterns: Pattern[];
    decisions: Decision[];
    constraints: MemoryConstraint[];
    relatedSpecs: string[];
    summary: string;
  } {
    if (!this.memory) {
      throw new Error('No memory loaded. Call load() first.');
    }

    const patterns = this.getReusablePatterns(1);
    const relatedSpecs = this.getRelatedSpecs(specId);
    
    // Get decisions from related specs
    const relatedDecisions = this.memory.decisions.filter(
      d => relatedSpecs.includes(d.specId)
    );

    // Get all constraints
    const constraints = this.memory.constraints;

    // Generate summary
    const summary = this.generateContextSummary(
      specId,
      patterns,
      relatedDecisions,
      constraints,
      relatedSpecs
    );

    return {
      patterns,
      decisions: relatedDecisions,
      constraints,
      relatedSpecs,
      summary
    };
  }

  /**
   * Get decisions for a specific spec
   */
  getDecisionsForSpec(specId: string): Decision[] {
    if (!this.memory) {
      throw new Error('No memory loaded. Call load() first.');
    }

    return this.memory.decisions.filter(d => d.specId === specId);
  }

  /**
   * Get patterns used in a specific spec
   */
  getPatternsForSpec(specId: string): Pattern[] {
    if (!this.memory) {
      throw new Error('No memory loaded. Call load() first.');
    }

    return this.memory.patterns.filter(
      p => p.examples.some(e => e.specId === specId)
    );
  }

  /**
   * Check if memory file exists
   */
  async exists(): Promise<boolean> {
    try {
      await access(this.memoryFilePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get memory file path
   */
  getMemoryFilePath(): string {
    return this.memoryFilePath;
  }

  private addHistoryEntry(
    specId: string,
    action: HistoryEntry['action'],
    details: string
  ): void {
    if (!this.memory) return;

    this.memory.history.push({
      timestamp: new Date(),
      specId,
      action,
      details
    });
  }

  private generateContextSummary(
    specId: string,
    patterns: Pattern[],
    decisions: Decision[],
    constraints: MemoryConstraint[],
    relatedSpecs: string[]
  ): string {
    const parts: string[] = [];

    if (patterns.length > 0) {
      const topPatterns = patterns.slice(0, 5);
      parts.push(`Project has ${patterns.length} reusable patterns, including: ${topPatterns.map(p => `"${p.name}" (${p.usageCount} uses)`).join(', ')}`);
    }

    if (decisions.length > 0) {
      parts.push(`${decisions.length} architectural decisions from related specs available as reference`);
    }

    if (constraints.length > 0) {
      const techConstraints = constraints.filter(c => c.type === 'technical').length;
      const archConstraints = constraints.filter(c => c.type === 'architectural').length;
      parts.push(`${constraints.length} project constraints (${techConstraints} technical, ${archConstraints} architectural)`);
    }

    if (relatedSpecs.length > 0) {
      parts.push(`${relatedSpecs.length} related specs share patterns or decisions with this spec`);
    }

    return parts.join('. ') || 'No prior project context available';
  }
}
