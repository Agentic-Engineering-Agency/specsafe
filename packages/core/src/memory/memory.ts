/**
 * Project Memory Manager
 * Manages project context persistence and retrieval
 */

import { readFile, writeFile, access, mkdir, rename, stat, unlink } from 'fs/promises';
import { join, dirname, resolve } from 'path';
import type {
  ProjectMemory,
  Decision,
  Pattern,
  MemoryConstraint,
  HistoryEntry,
  PatternExample
} from './types.js';
import {
  validateProjectMemory,
  isValidSpecId,
  validateProjectId,
  sanitizeString,
  sanitizePath,
  redactSensitiveInfo
} from './validation.js';

const MEMORY_FILE = '.specsafe/memory.json';
const LOCK_FILE = '.specsafe/memory.lock';
const LOCK_TIMEOUT = 30000; // 30 seconds

/**
 * File lock for preventing race conditions
 */
class FileLock {
  private lockFilePath: string;
  private isLocked: boolean = false;

  constructor(basePath: string) {
    // Sanitize the lock file path to prevent directory traversal
    this.lockFilePath = sanitizePath(basePath, LOCK_FILE);
  }

  async acquire(): Promise<void> {
    await mkdir(dirname(this.lockFilePath), { recursive: true });
    const startTime = Date.now();

    while (Date.now() - startTime < LOCK_TIMEOUT) {
      try {
        // Try to create the lock file exclusively
        await writeFile(
          this.lockFilePath,
          JSON.stringify({ pid: process.pid, timestamp: Date.now() }),
          { flag: 'wx' }
        );
        this.isLocked = true;
        return;
      } catch (error: any) {
        if (error.code !== 'EEXIST') {
          throw error;
        }

        // Check if lock is stale
        try {
          const stats = await stat(this.lockFilePath);
          const lockAge = Date.now() - stats.mtimeMs;
          if (lockAge > LOCK_TIMEOUT) {
            // Remove stale lock
            await unlink(this.lockFilePath);
          }
        } catch {
          // If we can't stat, try again
        }

        // Wait 100ms before retrying
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    throw new Error('Failed to acquire lock after timeout');
  }

  async release(): Promise<void> {
    if (this.isLocked) {
      try {
        await unlink(this.lockFilePath);
        this.isLocked = false;
      } catch (error) {
        console.warn('Failed to release lock:', error);
      }
    }
  }
}

export class ProjectMemoryManager {
  private projectPath: string;
  private memoryFilePath: string;
  private memory: ProjectMemory | null = null;
  private lock: FileLock;

  constructor(projectPath: string) {
    // Sanitize and validate the project path to prevent directory traversal
    const resolvedPath = resolve(projectPath);
    this.projectPath = resolvedPath;
    
    // Sanitize the memory file path to prevent directory traversal
    this.memoryFilePath = sanitizePath(resolvedPath, MEMORY_FILE);
    
    this.lock = new FileLock(resolvedPath);
  }

  /**
   * Load memory from disk or create default if not exists
   */
  async load(projectId: string): Promise<ProjectMemory> {
    // Validate and sanitize project ID
    if (!validateProjectId(projectId)) {
      throw new Error('Invalid project ID');
    }

    try {
      await access(this.memoryFilePath);
      
      // Acquire lock to prevent race conditions
      await this.lock.acquire();
      
      try {
        const content = await readFile(this.memoryFilePath, 'utf-8');
        
        // Validate JSON structure before parsing
        if (content.trim().length === 0) {
          throw new Error('Memory file is empty');
        }

        // Parse with error handling
        let parsed: any;
        try {
          parsed = JSON.parse(content);
        } catch (parseError) {
          throw new Error('Invalid JSON in memory file');
        }

        // Convert date strings back to Date objects before validation
        parsed.decisions = Array.isArray(parsed.decisions)
          ? parsed.decisions.map((d: any) => ({
              ...d,
              timestamp: new Date(d.timestamp)
            }))
          : [];
        parsed.history = Array.isArray(parsed.history)
          ? parsed.history.map((h: any) => ({
              ...h,
              timestamp: new Date(h.timestamp)
            }))
          : [];

        // Validate the structure and data types
        if (!validateProjectMemory(parsed)) {
          throw new Error('Memory file structure is invalid or contains corrupted data');
        }
        
        // Redact sensitive information from memory
        parsed.decisions = parsed.decisions.map((d: Decision) => ({
          ...d,
          rationale: redactSensitiveInfo(d.rationale),
          alternatives: d.alternatives.map(alt => redactSensitiveInfo(alt))
        }));
        
        this.memory = parsed;
        return parsed;
      } finally {
        await this.lock.release();
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // Create default memory
        this.memory = {
          projectId: sanitizeString(projectId),
          specs: [],
          decisions: [],
          patterns: [],
          constraints: [],
          history: []
        };
        return this.memory;
      }
      
      // Wrap other errors with context
      if (error.message && error.message.includes('structure is invalid')) {
        throw error;
      }
      
      throw new Error(`Failed to load memory: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Save memory to disk
   */
  async save(): Promise<void> {
    if (!this.memory) {
      throw new Error('No memory loaded. Call load() first.');
    }

    // Acquire lock to prevent race conditions
    await this.lock.acquire();
    
    try {
      // Ensure directory exists
      await mkdir(dirname(this.memoryFilePath), { recursive: true });
      
      // Use atomic write pattern: write to temp file then rename
      const tempFile = `${this.memoryFilePath}.tmp`;
      const content = JSON.stringify(this.memory, null, 2);
      
      await writeFile(tempFile, content, 'utf-8');
      
      // Atomic rename
      await rename(tempFile, this.memoryFilePath);
    } finally {
      await this.lock.release();
    }
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

    // Validate and sanitize spec ID
    if (!isValidSpecId(specId)) {
      throw new Error('Invalid spec ID format');
    }
    
    const sanitizedSpecId = sanitizeString(specId);

    if (!this.memory.specs.includes(sanitizedSpecId)) {
      this.memory.specs.push(sanitizedSpecId);
      this.addHistoryEntry(sanitizedSpecId, 'created', `Spec ${sanitizedSpecId} added to project memory`);
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

    // Validate inputs
    if (!isValidSpecId(specId)) {
      throw new Error('Invalid spec ID format');
    }
    
    if (typeof decision !== 'string' || decision.trim().length === 0) {
      throw new Error('Decision cannot be empty');
    }
    
    if (typeof rationale !== 'string' || rationale.trim().length === 0) {
      throw new Error('Rationale cannot be empty');
    }
    
    if (!Array.isArray(alternatives)) {
      throw new Error('Alternatives must be an array');
    }
    
    // Validate and sanitize inputs
    const sanitizedSpecId = sanitizeString(specId);
    const sanitizedDecision = sanitizeString(decision);
    const sanitizedRationale = redactSensitiveInfo(sanitizeString(rationale));
    const sanitizedAlternatives = alternatives
      .filter(alt => typeof alt === 'string' && alt.trim().length > 0)
      .map(alt => redactSensitiveInfo(sanitizeString(alt)))
      .slice(0, 10); // Limit to 10 alternatives

    const newDecision: Decision = {
      id: `DECISION-${Date.now()}`,
      specId: sanitizedSpecId,
      decision: sanitizedDecision,
      rationale: sanitizedRationale,
      timestamp: new Date(),
      alternatives: sanitizedAlternatives
    };

    this.memory.decisions.push(newDecision);
    this.addHistoryEntry(sanitizedSpecId, 'decision', `Decision recorded: ${sanitizedDecision}`);
    
    return newDecision;
  }

  /**
   * Record a pattern discovered in a spec
   */
  recordPattern(specId: string, pattern: Omit<Pattern, 'id' | 'usageCount'>): Pattern {
    if (!this.memory) {
      throw new Error('No memory loaded. Call load() first.');
    }

    // Validate inputs
    if (!isValidSpecId(specId)) {
      throw new Error('Invalid spec ID format');
    }
    
    if (typeof pattern !== 'object' || pattern === null) {
      throw new Error('Pattern must be an object');
    }
    
    if (typeof pattern.name !== 'string' || pattern.name.trim().length === 0) {
      throw new Error('Pattern name cannot be empty');
    }
    
    if (typeof pattern.description !== 'string' || pattern.description.trim().length === 0) {
      throw new Error('Pattern description cannot be empty');
    }
    
    // Validate and sanitize inputs
    const sanitizedSpecId = sanitizeString(specId);
    const sanitizedName = sanitizeString(pattern.name);
    const sanitizedDescription = sanitizeString(pattern.description);
    
    // Validate examples
    const sanitizedExamples = Array.isArray(pattern.examples)
      ? pattern.examples
          .filter(ex => typeof ex === 'object' && ex !== null && isValidSpecId(ex.specId))
          .slice(0, 20) // Limit to 20 examples
          .map(ex => ({
            specId: sanitizeString(ex.specId),
            context: sanitizeString(ex.context || ''),
            snippet: ex.snippet !== undefined ? sanitizeString(ex.snippet) : undefined
          }))
      : [];

    // Check if pattern already exists
    const existingPattern = this.memory.patterns.find(
      p => p.name.toLowerCase() === sanitizedName.toLowerCase()
    );

    if (existingPattern) {
      // Update existing pattern
      existingPattern.usageCount++;
      
      // Add new examples, avoiding duplicates
      for (const example of sanitizedExamples) {
        const isDuplicate = existingPattern.examples.some(
          e => e.specId === example.specId && e.context === example.context
        );
        if (!isDuplicate) {
          existingPattern.examples.push(example);
        }
      }
      
      this.addHistoryEntry(sanitizedSpecId, 'pattern', `Pattern "${existingPattern.name}" used again`);
      return existingPattern;
    }

    // Create new pattern
    const newPattern: Pattern = {
      id: `PATTERN-${Date.now()}`,
      name: sanitizedName,
      description: sanitizedDescription,
      examples: sanitizedExamples,
      usageCount: 1
    };

    this.memory.patterns.push(newPattern);
    this.addHistoryEntry(sanitizedSpecId, 'pattern', `New pattern "${newPattern.name}" recorded`);
    
    return newPattern;
  }

  /**
   * Add a constraint to the project
   */
  addConstraint(constraint: Omit<MemoryConstraint, 'id'>): MemoryConstraint {
    if (!this.memory) {
      throw new Error('No memory loaded. Call load() first.');
    }

    // Validate inputs
    if (typeof constraint !== 'object' || constraint === null) {
      throw new Error('Constraint must be an object');
    }
    
    if (!['technical', 'business', 'architectural'].includes(constraint.type)) {
      throw new Error('Invalid constraint type');
    }
    
    if (typeof constraint.description !== 'string' || constraint.description.trim().length === 0) {
      throw new Error('Constraint description cannot be empty');
    }
    
    // Validate and sanitize inputs
    const sanitizedType = constraint.type as 'technical' | 'business' | 'architectural';
    const sanitizedDescription = sanitizeString(constraint.description);
    const sanitizedSource = constraint.source !== undefined ? sanitizeString(constraint.source) : undefined;
    const sanitizedSpecId = constraint.specId !== undefined && isValidSpecId(constraint.specId)
      ? sanitizeString(constraint.specId)
      : undefined;

    const newConstraint: MemoryConstraint = {
      id: `CONSTRAINT-${Date.now()}`,
      type: sanitizedType,
      description: sanitizedDescription,
      source: sanitizedSource,
      specId: sanitizedSpecId
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

    // Validate inputs
    if (!isValidSpecId(specId)) {
      console.warn('Invalid spec ID in history entry, skipping');
      return;
    }
    
    if (!['created', 'updated', 'completed', 'decision', 'pattern'].includes(action)) {
      console.warn('Invalid history action, skipping');
      return;
    }
    
    if (typeof details !== 'string' || details.trim().length === 0) {
      console.warn('Empty history details, skipping');
      return;
    }

    this.memory.history.push({
      timestamp: new Date(),
      specId: sanitizeString(specId),
      action,
      details: sanitizeString(details)
    });

    // Limit history to 1000 entries to prevent unbounded growth
    if (this.memory.history.length > 1000) {
      this.memory.history = this.memory.history.slice(-1000);
    }
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
