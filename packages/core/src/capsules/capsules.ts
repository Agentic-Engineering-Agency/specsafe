/**
 * Capsule Manager
 * Manages CRUD operations for story context capsules
 */

import { readFile, writeFile, access, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import {
  Capsule,
  CapsuleCollection,
  CapsuleFilter,
  CapsuleType,
} from './types.js';

export interface CapsuleManagerOptions {
  basePath?: string;
}

export class CapsuleManager {
  private basePath: string;

  constructor(options: CapsuleManagerOptions = {}) {
    this.basePath = options.basePath || this.findProjectRoot();
  }

  /**
   * Find the project root by looking for .specsafe directory
   */
  private findProjectRoot(): string {
    let currentDir = process.cwd();
    
    while (currentDir !== dirname(currentDir)) {
      if (existsSync(join(currentDir, '.specsafe'))) {
        return currentDir;
      }
      currentDir = dirname(currentDir);
    }
    
    // Fallback to current working directory
    return process.cwd();
  }

  /**
   * Get the capsules directory path
   */
  private getCapsulesDir(): string {
    return join(this.basePath, '.specsafe', 'capsules');
  }

  /**
   * Get the capsules file path for a spec
   */
  private getCapsulesFile(specId: string): string {
    // Normalize specId - extract just the ID if it's a path
    const normalizedId = this.normalizeSpecId(specId);
    return join(this.getCapsulesDir(), `${normalizedId}.json`);
  }

  /**
   * Normalize a spec ID from a path or ID string
   */
  private normalizeSpecId(specId: string): string {
    // If it's a path like specs/checkout.md, extract 'checkout'
    const basename = specId.split('/').pop() || specId;
    return basename.replace(/\.md$/i, '');
  }

  /**
   * Ensure the capsules directory exists
   */
  private async ensureCapsulesDir(): Promise<void> {
    const dir = this.getCapsulesDir();
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }

  /**
   * Generate a unique capsule ID
   */
  private generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `CAPSULE-${timestamp}-${random}`;
  }

  /**
   * Load capsules for a spec
   */
  async load(specId: string): Promise<CapsuleCollection> {
    const filePath = this.getCapsulesFile(specId);
    
    try {
      await access(filePath);
      const content = await readFile(filePath, 'utf-8');
      const capsules = JSON.parse(content) as CapsuleCollection;
      return capsules;
    } catch {
      // File doesn't exist or is invalid, return empty collection
      return [];
    }
  }

  /**
   * Save capsules for a spec
   */
  async save(specId: string, capsules: CapsuleCollection): Promise<void> {
    await this.ensureCapsulesDir();
    const filePath = this.getCapsulesFile(specId);
    await writeFile(filePath, JSON.stringify(capsules, null, 2), 'utf-8');
  }

  /**
   * Add a new capsule
   */
  async add(
    specId: string,
    capsule: Omit<Capsule, 'id' | 'specId' | 'createdAt'>
  ): Promise<Capsule> {
    const capsules = await this.load(specId);
    
    const newCapsule: Capsule = {
      ...capsule,
      id: this.generateId(),
      specId: this.normalizeSpecId(specId),
      createdAt: new Date().toISOString(),
    };
    
    capsules.push(newCapsule);
    await this.save(specId, capsules);
    
    return newCapsule;
  }

  /**
   * Update an existing capsule
   */
  async update(
    specId: string,
    capsuleId: string,
    updates: Partial<Omit<Capsule, 'id' | 'specId' | 'createdAt'>>
  ): Promise<Capsule | null> {
    const capsules = await this.load(specId);
    const index = capsules.findIndex((c) => c.id === capsuleId);
    
    if (index === -1) {
      return null;
    }
    
    capsules[index] = {
      ...capsules[index],
      ...updates,
    };
    
    await this.save(specId, capsules);
    return capsules[index];
  }

  /**
   * Remove a capsule
   */
  async remove(specId: string, capsuleId: string): Promise<boolean> {
    const capsules = await this.load(specId);
    const initialLength = capsules.length;
    const filtered = capsules.filter((c) => c.id !== capsuleId);
    
    if (filtered.length === initialLength) {
      return false;
    }
    
    await this.save(specId, filtered);
    return true;
  }

  /**
   * List capsules with optional filtering
   */
  async list(
    specId: string,
    filter?: CapsuleFilter
  ): Promise<CapsuleCollection> {
    let capsules = await this.load(specId);
    
    if (!filter) {
      return capsules;
    }
    
    if (filter.types?.length) {
      capsules = capsules.filter((c) => filter.types!.includes(c.type));
    }
    
    if (filter.tags?.length) {
      capsules = capsules.filter((c) => 
        filter.tags!.some((tag) => c.tags.includes(tag))
      );
    }
    
    if (filter.author) {
      capsules = capsules.filter((c) => 
        c.author.toLowerCase() === filter.author!.toLowerCase()
      );
    }
    
    if (filter.dateRange) {
      const from = new Date(filter.dateRange.from).getTime();
      const to = new Date(filter.dateRange.to).getTime();
      capsules = capsules.filter((c) => {
        const created = new Date(c.createdAt).getTime();
        return created >= from && created <= to;
      });
    }
    
    return capsules;
  }

  /**
   * Get a single capsule by ID
   */
  async get(specId: string, capsuleId: string): Promise<Capsule | null> {
    const capsules = await this.load(specId);
    return capsules.find((c) => c.id === capsuleId) || null;
  }

  /**
   * Find capsules from related specs
   * Searches for capsules in all specs that share tags with the given spec
   */
  async getRelated(specId: string): Promise<CapsuleCollection> {
    const normalizedId = this.normalizeSpecId(specId);
    const capsulesDir = this.getCapsulesDir();
    
    if (!existsSync(capsulesDir)) {
      return [];
    }
    
    const { readdir } = await import('fs/promises');
    const files = await readdir(capsulesDir);
    const relatedCapsules: CapsuleCollection = [];
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      const otherSpecId = file.replace('.json', '');
      if (otherSpecId === normalizedId) continue;
      
      try {
        const otherCapsules = await this.load(otherSpecId);
        relatedCapsules.push(...otherCapsules);
      } catch {
        // Skip invalid files
      }
    }
    
    return relatedCapsules;
  }

  /**
   * Get capsule count by type
   */
  async countByType(specId: string): Promise<Record<CapsuleType, number>> {
    const capsules = await this.load(specId);
    const counts: Record<CapsuleType, number> = {
      'user-story': 0,
      'technical-context': 0,
      'business-justification': 0,
      'discovery-note': 0,
    };
    
    for (const capsule of capsules) {
      counts[capsule.type] = (counts[capsule.type] || 0) + 1;
    }
    
    return counts;
  }

  /**
   * Export capsules to markdown format
   */
  async exportToMarkdown(specId: string): Promise<string> {
    const capsules = await this.load(specId);
    const normalizedId = this.normalizeSpecId(specId);
    
    const lines: string[] = [
      `# Context Capsules: ${normalizedId}`,
      '',
      `*Generated: ${new Date().toISOString()}*`,
      '',
      `**Total Capsules:** ${capsules.length}`,
      '',
      '---',
      '',
    ];
    
    // Group by type
    const byType: Record<CapsuleType, Capsule[]> = {
      'user-story': [],
      'technical-context': [],
      'business-justification': [],
      'discovery-note': [],
    };
    
    for (const capsule of capsules) {
      if (!byType[capsule.type]) {
        byType[capsule.type] = [];
      }
      byType[capsule.type].push(capsule);
    }
    
    for (const [type, typeCapsules] of Object.entries(byType)) {
      if (typeCapsules.length === 0) continue;
      
      lines.push(`## ${this.capitalize(type.replace(/-/g, ' '))}`,
 '');
      
      for (const capsule of typeCapsules) {
        lines.push(`### ${capsule.title}`);
        lines.push('');
        lines.push(`**ID:** ${capsule.id}`);
        lines.push(`**Author:** ${capsule.author}`);
        lines.push(`**Created:** ${capsule.createdAt}`);
        if (capsule.tags.length > 0) {
          lines.push(`**Tags:** ${capsule.tags.join(', ')}`);
        }
        lines.push('');
        lines.push(capsule.content);
        lines.push('');
        lines.push('---');
        lines.push('');
      }
    }
    
    return lines.join('\n');
  }

  private capitalize(str: string): string {
    return str.replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
