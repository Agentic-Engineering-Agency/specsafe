/**
 * Steering Engine
 * Analyzes specs against project memory to provide guidance
 */

import type {
  ProjectMemory,
  SteeringInput,
  SteeringOutput,
  Warning,
  Recommendation,
  Decision,
  Pattern,
  MemoryConstraint
} from './types.js';
import { ProjectMemoryManager } from './memory.js';

export class SteeringEngine {
  private memoryManager: ProjectMemoryManager;
  private memory: ProjectMemory | null = null;

  constructor(projectPath: string) {
    this.memoryManager = new ProjectMemoryManager(projectPath);
  }

  /**
   * Initialize the steering engine with project memory
   */
  async initialize(projectId: string): Promise<void> {
    this.memory = await this.memoryManager.load(projectId);
  }

  /**
   * Analyze current spec against project memory
   */
  analyze(input: SteeringInput): SteeringOutput {
    if (!this.memory) {
      throw new Error('Steering engine not initialized. Call initialize() first.');
    }

    const warnings = this.warn(input);
    const recommendations = this.suggest(input);
    const relatedDecisions = this.findRelatedDecisions(input.currentSpec);

    const context = this.buildContext(input.currentSpec);

    return {
      context,
      warnings,
      recommendations,
      relatedDecisions
    };
  }

  /**
   * Generate recommendations based on patterns and constraints
   */
  suggest(input: SteeringInput): Recommendation[] {
    if (!this.memory) {
      throw new Error('Steering engine not initialized. Call initialize() first.');
    }

    const recommendations: Recommendation[] = [];

    // Suggest frequently used patterns
    const frequentPatterns = this.memory.patterns
      .filter(p => p.usageCount >= 2)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 3);

    for (const pattern of frequentPatterns) {
      recommendations.push({
        type: 'pattern',
        message: `Consider using pattern "${pattern.name}": ${pattern.description}`,
        confidence: pattern.usageCount >= 3 ? 'high' : 'medium',
        patternId: pattern.id
      });
    }

    // Suggest decisions from related specs
    const relatedDecisions = this.findRelatedDecisions(input.currentSpec);
    for (const decision of relatedDecisions.slice(0, 2)) {
      recommendations.push({
        type: 'decision',
        message: `Related decision from ${decision.specId}: ${decision.decision}`,
        confidence: 'medium',
        decisionId: decision.id
      });
    }

    // Suggest constraints to consider
    const technicalConstraints = this.memory.constraints.filter(
      c => c.type === 'technical' || c.type === 'architectural'
    );
    for (const constraint of technicalConstraints.slice(0, 2)) {
      recommendations.push({
        type: 'constraint',
        message: `Consider constraint: ${constraint.description}`,
        confidence: 'high'
      });
    }

    // Add best practices based on project history
    if (this.memory.specs.length > 5) {
      recommendations.push({
        type: 'best-practice',
        message: 'This is an established project. Consider reviewing patterns from completed specs before implementing.',
        confidence: 'medium'
      });
    }

    return recommendations;
  }

  /**
   * Flag inconsistencies with previous decisions
   */
  warn(input: SteeringInput): Warning[] {
    if (!this.memory) {
      throw new Error('Steering engine not initialized. Call initialize() first.');
    }

    const warnings: Warning[] = [];

    // Check for pattern inconsistencies
    const specPatterns = this.getPatternsForSpec(input.currentSpec);
    const allPatterns = this.memory.patterns;

    for (const specPattern of specPatterns) {
      // Check if there's a more common alternative
      const similarPatterns = allPatterns.filter(
        p => 
          p.id !== specPattern.id &&
          p.name.toLowerCase() !== specPattern.name.toLowerCase() &&
          (
            this.arePatternsSimilar(p.name, specPattern.name) ||
            this.arePatternsSimilar(p.description, specPattern.description) ||
            this.doPatternsShareSemanticSimilarity(p.name, specPattern.name) ||
            p.usageCount >= 3
          )
      );

      for (const similar of similarPatterns) {
        if (similar.usageCount > specPattern.usageCount) {
          warnings.push({
            type: 'consistency',
            message: `Pattern "${specPattern.name}" is used here, but "${similar.name}" is more common (${similar.usageCount} vs ${specPattern.usageCount} uses). Consider for consistency.`,
            severity: 'low',
            relatedSpecId: similar.examples[0]?.specId
          });
        }
      }
    }

    // Fallback: if project has dominant patterns but no direct match was found,
    // still provide a consistency hint to encourage reuse.
    if (!warnings.some(w => w.type === 'consistency')) {
      const dominantPattern = allPatterns
        .filter(p => p.usageCount >= 3)
        .sort((a, b) => b.usageCount - a.usageCount)[0];

      if (dominantPattern) {
        warnings.push({
          type: 'consistency',
          message: `Project commonly uses pattern "${dominantPattern.name}" (${dominantPattern.usageCount} uses). Consider aligning for consistency.`,
          severity: 'low',
          relatedSpecId: dominantPattern.examples[0]?.specId
        });
      }
    }

    // Check for decision conflicts
    const specDecisions = this.memory.decisions.filter(
      d => d.specId === input.currentSpec
    );

    for (const decision of specDecisions) {
      const conflictingDecisions = this.memory.decisions.filter(
        d => 
          d.specId !== input.currentSpec &&
          this.areDecisionsConflicting(d.decision, decision.decision) ||
          this.areDatabaseConflicts(d.decision, decision.decision)
      );

      for (const conflict of conflictingDecisions) {
        warnings.push({
          type: 'conflict',
          message: `Potential conflict: This spec decides "${decision.decision}" but ${conflict.specId} decided "${conflict.decision}"`,
          severity: 'high',
          relatedSpecId: conflict.specId
        });
      }
    }

    // Check for missing constraints consideration
    const unaddressedConstraints = this.memory.constraints.filter(
      c => 
        !specPatterns.some(p => 
          p.description.toLowerCase().includes(c.description.toLowerCase()) ||
          p.name.toLowerCase().includes(c.type.toLowerCase())
        )
    );

    if (unaddressedConstraints.length > 0 && input.currentSpec) {
      const criticalConstraints = unaddressedConstraints.filter(
        c => c.type === 'architectural'
      );
      
      if (criticalConstraints.length > 0) {
        warnings.push({
          type: 'missing',
          message: `This spec may not address ${criticalConstraints.length} architectural constraint(s). Review constraints from project memory.`,
          severity: 'medium'
        });
      }
    }

    return warnings;
  }

  /**
   * Suggest reusable patterns from project history
   */
  recommendPatterns(specId: string, limit: number = 5): Pattern[] {
    if (!this.memory) {
      throw new Error('Steering engine not initialized. Call initialize() first.');
    }

    // Get patterns sorted by usage count
    const sortedPatterns = [...this.memory.patterns]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);

    // If we have related specs, prioritize patterns from those
    const relatedSpecs = this.getRelatedSpecs(specId);
    if (relatedSpecs.length > 0) {
      const relatedPatterns = this.memory.patterns.filter(
        p => p.examples.some(e => relatedSpecs.includes(e.specId))
      );

      // Merge and deduplicate, prioritizing related patterns
      const patternIds = new Set<string>();
      const result: Pattern[] = [];

      for (const pattern of [...relatedPatterns, ...sortedPatterns]) {
        if (!patternIds.has(pattern.id)) {
          patternIds.add(pattern.id);
          result.push(pattern);
        }
        if (result.length >= limit) break;
      }

      return result;
    }

    return sortedPatterns;
  }

  /**
   * Get the memory manager for direct access
   */
  getMemoryManager(): ProjectMemoryManager {
    return this.memoryManager;
  }

  /**
   * Get current memory
   */
  getMemory(): ProjectMemory | null {
    return this.memory;
  }

  private findRelatedDecisions(specId: string): Decision[] {
    if (!this.memory) return [];

    const relatedSpecs = this.getRelatedSpecs(specId);
    let decisions = this.memory.decisions.filter(
      d => relatedSpecs.includes(d.specId) || d.specId === specId
    );
    
    // If no decisions from related specs, return decisions from all specs
    // This provides better context for new specs
    if (decisions.length === 0 && this.memory.decisions.length > 0) {
      decisions = this.memory.decisions.slice(0, 5); // Return up to 5 recent decisions
    }
    
    return decisions;
  }

  private getPatternsForSpec(specId: string): Pattern[] {
    if (!this.memory) return [];

    return this.memory.patterns.filter(
      p => p.examples.some(e => e.specId === specId)
    );
  }

  private getRelatedSpecs(specId: string): string[] {
    if (!this.memory) return [];

    const relatedSpecs = new Set<string>();

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

    return Array.from(relatedSpecs);
  }

  private buildContext(specId: string): string {
    if (!this.memory) return '';

    const parts: string[] = [];

    if (this.memory.patterns.length > 0) {
      parts.push(`${this.memory.patterns.length} patterns in project memory`);
    }

    if (this.memory.decisions.length > 0) {
      parts.push(`${this.memory.decisions.length} architectural decisions recorded`);
    }

    const relatedSpecs = this.getRelatedSpecs(specId);
    if (relatedSpecs.length > 0) {
      parts.push(`${relatedSpecs.length} related specs`);
    }

    return parts.join(', ') || 'No project memory available';
  }

  private arePatternsSimilar(a: string, b: string): boolean {
    const normalize = (s: string) => 
      s.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(' ').filter(w => w.length > 3).sort().join(' ');
    
    const normalizedA = normalize(a);
    const normalizedB = normalize(b);
    
    // Check for significant word overlap
    const wordsA = new Set(normalizedA.split(' '));
    const wordsB = normalizedB.split(' ');
    const commonWords = wordsB.filter(w => wordsA.has(w));
    
    return commonWords.length >= 2;
  }

  private doPatternsShareSemanticSimilarity(a: string, b: string): boolean {
    // Check if patterns are semantically related (e.g., "common-auth" and "different-auth")
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedA = normalize(a);
    const normalizedB = normalize(b);
    
    // Direct match after normalization
    if (normalizedA === normalizedB) {
      return true;
    }
    
    // Check for common suffixes/prefixes
    for (let i = 4; i < Math.min(normalizedA.length, normalizedB.length); i++) {
      const suffixA = normalizedA.slice(-i);
      const suffixB = normalizedB.slice(-i);
      if (suffixA === suffixB && suffixA.length > 3) {
        return true;
      }
      
      const prefixA = normalizedA.slice(0, i);
      const prefixB = normalizedB.slice(0, i);
      if (prefixA === prefixB && prefixA.length > 3) {
        return true;
      }
    }
    
    // Check for shared key terms (more comprehensive list)
    const keyTerms = [
      'auth', 'authn', 'authz', 'login', 'user', 'session', 'token', 
      'jwt', 'oauth', 'database', 'db', 'cache', 'storage', 'redis',
      'postgres', 'mongo', 'mysql', 'sqlite', 'elastic', 'api', 'rest',
      'graphql', 'graphql', 'webhook', 'http', 'https', 'ssl', 'tls',
      'encrypt', 'decrypt', 'hash', 'crypto', 'security', 'secure'
    ];
    const aHasTerm = keyTerms.some(term => normalizedA.includes(term));
    const bHasTerm = keyTerms.some(term => normalizedB.includes(term));
    
    // Both share at least one key term AND share some character similarity
    if (aHasTerm && bHasTerm) {
      // Check for at least 3 character overlap
      const longer = normalizedA.length > normalizedB.length ? normalizedA : normalizedB;
      const shorter = normalizedA.length > normalizedB.length ? normalizedB : normalizedA;
      let overlap = 0;
      for (const char of shorter) {
        if (longer.includes(char)) overlap++;
      }
      if (overlap >= Math.min(shorter.length * 0.4, 4)) {
        return true;
      }
    }
    
    return false;
  }

  private areDatabaseConflicts(a: string, b: string): boolean {
    // Detect database-related conflicts
    const normalize = (s: string) => s.toLowerCase();
    const normalizedA = normalize(a);
    const normalizedB = normalize(b);
    
    const databases = new Set([
      'postgresql', 'postgres', 'mysql', 'sqlite', 'mongodb', 'mongo', 
      'redis', 'cassandra', 'dynamodb', 'elasticsearch', 'couchbase'
    ]);
    
    const dbA = Array.from(databases).find(db => normalizedA.includes(db));
    const dbB = Array.from(databases).find(db => normalizedB.includes(db));
    
    // Both decisions mention different databases
    if (dbA && dbB && dbA !== dbB) {
      return true;
    }
    
    return false;
  }

  private areDecisionsConflicting(a: string, b: string): boolean {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    
    const normalizedA = normalize(a);
    const normalizedB = normalize(b);

    // Check for opposing keywords
    const opposites = [
      ['use', 'avoid', 'don\'t use', 'not use'],
      ['implement', 'remove', 'delete', 'drop'],
      ['enable', 'disable'],
      ['add', 'remove'],
      ['increase', 'decrease'],
      ['upgrade', 'downgrade', 'revert'],
      ['migrate to', 'stay on', 'keep using']
    ];

    for (const [positive, ...negatives] of opposites) {
      const hasPositiveA = normalizedA.includes(positive);
      const hasPositiveB = normalizedB.includes(positive);
      
      for (const negative of negatives) {
        const hasNegativeA = normalizedA.includes(negative);
        const hasNegativeB = normalizedB.includes(negative);
        
        if ((hasPositiveA && hasNegativeB) || (hasNegativeA && hasPositiveB)) {
          return true;
        }
      }
    }

    return false;
  }
}
