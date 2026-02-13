/**
 * Capsule Manager
 * Manages CRUD operations for story context capsules
 */

import { readFile, writeFile, access, mkdir, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import {
  Capsule,
  CapsuleCollection,
  CapsuleFilter,
  CapsuleType,
} from './types.js';
import {
  validateSpecId,
  validateTitle,
  validateAuthor,
  validateContent,
  validateTags,
  validateFilter,
} from './validation.js';

export interface CapsuleManagerOptions {
  basePath?: string;
}

export class CapsuleManager {
  private basePath: string;

  constructor(options: CapsuleManagerOptions = {}) {
    // Validate and set base path
    if (options.basePath && typeof options.basePath === 'string') {
      this.basePath = options.basePath;
    } else {
      this.basePath = this.findProjectRoot();
    }

    // Security: Validate base path to prevent directory traversal
    if (!this.isValidPath(this.basePath)) {
      throw new Error(`Invalid base path: ${this.basePath}`);
    }
  }

  /**
   * Find the project root by looking for .specsafe directory
   */
  private findProjectRoot(): string {
    let currentDir = process.cwd();

    // Limit traversal depth to prevent infinite loops
    let depth = 0;
    const MAX_DEPTH = 50;

    while (currentDir !== dirname(currentDir) && depth < MAX_DEPTH) {
      if (existsSync(join(currentDir, '.specsafe'))) {
        return currentDir;
      }
      currentDir = dirname(currentDir);
      depth++;
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
   * Security: Uses validated specId to prevent path traversal
   */
  private getCapsulesFile(specId: string): string {
    const normalizedId = validateSpecId(specId);
    return join(this.getCapsulesDir(), `${normalizedId}.json`);
  }

  /**
   * Validate a path to prevent directory traversal
   */
  private isValidPath(path: string): boolean {
    // Prevent path traversal
    const normalized = path.replace(/\\/g, '/');
    return !normalized.includes('..');
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
   * Security: Safe file reading with error handling
   */
  async load(specId: string): Promise<CapsuleCollection> {
    const filePath = this.getCapsulesFile(specId);

    try {
      await access(filePath);
      const content = await readFile(filePath, 'utf-8');

      // Validate JSON structure
      let capsules: unknown;
      try {
        capsules = JSON.parse(content);
      } catch (parseError) {
        throw new Error(`Invalid JSON in capsule file for spec: ${specId}`);
      }

      // Validate capsules array structure
      if (!Array.isArray(capsules)) {
        throw new Error(`Invalid capsule file format for spec: ${specId}`);
      }

      // Sanitize each capsule
      const sanitized: CapsuleCollection = [];
      for (const capsule of capsules) {
        if (this.isValidCapsule(capsule)) {
          sanitized.push(capsule as Capsule);
        }
      }

      return sanitized;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist, return empty collection
        return [];
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Validate capsule structure
   */
  private isValidCapsule(capsule: unknown): boolean {
    if (typeof capsule !== 'object' || capsule === null) {
      return false;
    }

    const c = capsule as Record<string, unknown>;

    return (
      typeof c.id === 'string' &&
      typeof c.specId === 'string' &&
      typeof c.type === 'string' &&
      typeof c.title === 'string' &&
      typeof c.content === 'string' &&
      typeof c.author === 'string' &&
      typeof c.createdAt === 'string' &&
      Array.isArray(c.tags)
    );
  }

  /**
   * Save capsules for a spec
   * Security: Safe file writing with proper error handling
   */
  async save(specId: string, capsules: CapsuleCollection): Promise<void> {
    // Validate capsules array
    if (!Array.isArray(capsules)) {
      throw new Error('Capsules must be an array');
    }

    // Validate each capsule
    for (const capsule of capsules) {
      if (!this.isValidCapsule(capsule)) {
        throw new Error(`Invalid capsule structure in collection`);
      }
    }

    await this.ensureCapsulesDir();
    const filePath = this.getCapsulesFile(specId);

    try {
      await writeFile(filePath, JSON.stringify(capsules, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(`Failed to save capsules: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add a new capsule
   * Security: Validates all inputs
   */
  async add(
    specId: string,
    capsule: Omit<Capsule, 'id' | 'specId' | 'createdAt'>
  ): Promise<Capsule> {
    // Validate inputs
    const normalizedSpecId = validateSpecId(specId);
    const type = this.validateCapsuleType(capsule.type);
    const title = validateTitle(capsule.title);
    const content = validateContent(capsule.content);
    const author = validateAuthor(capsule.author);
    const tags = validateTags(capsule.tags || []);

    const capsules = await this.load(specId);

    const newCapsule: Capsule = {
      id: this.generateId(),
      specId: normalizedSpecId,
      type,
      title,
      content,
      author,
      tags,
      createdAt: new Date().toISOString(),
    };

    capsules.push(newCapsule);
    await this.save(specId, capsules);

    return newCapsule;
  }

  /**
   * Validate capsule type
   */
  private validateCapsuleType(type: string): CapsuleType {
    const validTypes: CapsuleType[] = ['user-story', 'technical-context', 'business-justification', 'discovery-note'];
    if (!validTypes.includes(type as CapsuleType)) {
      throw new Error(`Invalid capsule type: ${type}`);
    }
    return type as CapsuleType;
  }

  /**
   * Update an existing capsule
   * Security: Validates all update inputs
   */
  async update(
    specId: string,
    capsuleId: string,
    updates: Partial<Omit<Capsule, 'id' | 'specId' | 'createdAt'>>
  ): Promise<Capsule | null> {
    // Validate capsule ID format
    if (typeof capsuleId !== 'string' || capsuleId.length === 0) {
      throw new Error('Invalid capsule ID');
    }

    const capsules = await this.load(specId);
    const index = capsules.findIndex((c) => c.id === capsuleId);

    if (index === -1) {
      return null;
    }

    // Validate updates
    const validatedUpdates: Partial<Omit<Capsule, 'id' | 'specId' | 'createdAt'>> = {};

    if (updates.type !== undefined) {
      validatedUpdates.type = this.validateCapsuleType(updates.type);
    }

    if (updates.title !== undefined) {
      validatedUpdates.title = validateTitle(updates.title);
    }

    if (updates.content !== undefined) {
      validatedUpdates.content = validateContent(updates.content);
    }

    if (updates.author !== undefined) {
      validatedUpdates.author = validateAuthor(updates.author);
    }

    if (updates.tags !== undefined) {
      validatedUpdates.tags = validateTags(updates.tags);
    }

    capsules[index] = {
      ...capsules[index],
      ...validatedUpdates,
    };

    await this.save(specId, capsules);
    return capsules[index];
  }

  /**
   * Remove a capsule
   */
  async remove(specId: string, capsuleId: string): Promise<boolean> {
    // Validate capsule ID format
    if (typeof capsuleId !== 'string' || capsuleId.length === 0) {
      throw new Error('Invalid capsule ID');
    }

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
   * Security: Validates filter input
   */
  async list(
    specId: string,
    filter?: CapsuleFilter
  ): Promise<CapsuleCollection> {
    let capsules = await this.load(specId);

    if (!filter) {
      return capsules;
    }

    // Validate filter
    const validation = validateFilter(filter);
    if (!validation.isValid) {
      throw new Error(`Invalid filter: ${validation.errors.join(', ')}`);
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
    // Validate capsule ID format
    if (typeof capsuleId !== 'string' || capsuleId.length === 0) {
      throw new Error('Invalid capsule ID');
    }

    const capsules = await this.load(specId);
    return capsules.find((c) => c.id === capsuleId) || null;
  }

  /**
   * Find capsules from related specs
   * Security: Safe directory traversal with proper validation
   */
  async getRelated(specId: string): Promise<CapsuleCollection> {
    const normalizedId = validateSpecId(specId);
    const capsulesDir = this.getCapsulesDir();

    if (!existsSync(capsulesDir)) {
      return [];
    }

    const files = await readdir(capsulesDir);
    const relatedCapsules: CapsuleCollection = [];

    for (const file of files) {
      // Security: Only process JSON files
      if (!file.endsWith('.json')) continue;

      // Security: Validate filename to prevent path traversal
      if (!this.isValidPath(file)) continue;

      const otherSpecId = file.replace('.json', '');
      if (otherSpecId === normalizedId) continue;

      try {
        const otherCapsules = await this.load(otherSpecId);
        relatedCapsules.push(...otherCapsules);
      } catch {
        // Skip invalid files - log would be helpful in production
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
      if (capsule.type in counts) {
        counts[capsule.type] = (counts[capsule.type] || 0) + 1;
      }
    }

    return counts;
  }

  /**
   * Export capsules to markdown format
   * Security: Sanitizes content to prevent injection
   */
  async exportToMarkdown(specId: string): Promise<string> {
    const capsules = await this.load(specId);
    const normalizedId = validateSpecId(specId);

    const lines: string[] = [
      `# Context Capsules: ${this.sanitizeMarkdown(normalizedId)}`,
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

      lines.push(`## ${this.capitalize(type.replace(/-/g, ' '))}`, '');

      for (const capsule of typeCapsules) {
        lines.push(`### ${this.sanitizeMarkdown(capsule.title)}`);
        lines.push('');
        lines.push(`**ID:** ${this.sanitizeMarkdown(capsule.id)}`);
        lines.push(`**Author:** ${this.sanitizeMarkdown(capsule.author)}`);
        lines.push(`**Created:** ${capsule.createdAt}`);
        if (capsule.tags.length > 0) {
          const sanitizedTags = capsule.tags.map(t => this.sanitizeMarkdown(t));
          lines.push(`**Tags:** ${sanitizedTags.join(', ')}`);
        }
        lines.push('');
        // Content is already validated when capsule is added
        lines.push(capsule.content);
        lines.push('');
        lines.push('---');
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Sanitize text for markdown output
   * Prevents markdown injection attacks
   */
  private sanitizeMarkdown(text: string): string {
    // HTML encode potentially dangerous characters
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private capitalize(str: string): string {
    return str.replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
