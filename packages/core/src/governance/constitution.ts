import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import type { Constitution, Principle, Gate, GateResult, ConstitutionLoadOptions, ValidationOptions } from './types.js';
import type { Spec } from '../types.js';
import { BUILTIN_PRINCIPLES, BUILTIN_GATES } from './builtins.js';

export class ConstitutionManager {
  private constitution: Constitution | null = null;
  private projectDir: string;

  constructor(projectDir: string = process.cwd()) {
    this.projectDir = projectDir;
  }

  async load(options: ConstitutionLoadOptions = {}): Promise<Constitution> {
    const { includeBuiltins = true, validate = true } = options;
    
    const constitutionMdPath = join(this.projectDir, '.specsafe', 'constitution.md');
    if (existsSync(constitutionMdPath)) {
      this.constitution = await this.loadFromMarkdown(constitutionMdPath);
    } else {
      const configPath = join(this.projectDir, 'specsafe.config.json');
      if (existsSync(configPath)) {
        this.constitution = await this.loadFromConfig(configPath);
      } else {
        this.constitution = this.createDefault();
      }
    }

    if (includeBuiltins) {
      this.mergeBuiltins();
    }

    if (validate) {
      this.validateConstitution();
    }

    return this.constitution;
  }

  private async loadFromMarkdown(path: string): Promise<Constitution> {
    const content = await readFile(path, 'utf-8');
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      throw new Error('Constitution markdown must have YAML frontmatter');
    }

    const frontmatter = frontmatterMatch[1];
    const principles: Principle[] = [];
    const principleBlocks = frontmatter.split('\n- id:');
    
    for (let i = 1; i < principleBlocks.length; i++) {
      const block = principleBlocks[i];
      const lines = block.split('\n');
      const principle: Partial<Principle> = {};
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('id:')) principle.id = trimmed.substring(3).trim();
        else if (trimmed.startsWith('name:')) principle.name = trimmed.substring(5).trim();
        else if (trimmed.startsWith('description:')) principle.description = trimmed.substring(12).trim();
        else if (trimmed.startsWith('severity:')) principle.severity = trimmed.substring(9).trim() as 'error' | 'warning';
        else if (trimmed.startsWith('immutable:')) principle.immutable = trimmed.substring(10).trim() === 'true';
      }
      
      if (principle.id && principle.name && principle.description) {
        principles.push({ id: principle.id, name: principle.name, description: principle.description, severity: principle.severity || 'warning', immutable: principle.immutable ?? false });
      }
    }

    return { principles, gates: [], metadata: { projectName: 'unknown', version: '1.0.0', createdAt: new Date(), updatedAt: new Date() } };
  }

  private async loadFromConfig(path: string): Promise<Constitution> {
    const content = await readFile(path, 'utf-8');
    const config = JSON.parse(content);
    const constitution = config.constitution || this.createDefault();
    
    if (constitution.metadata) {
      if (constitution.metadata.createdAt) constitution.metadata.createdAt = new Date(constitution.metadata.createdAt);
      if (constitution.metadata.updatedAt) constitution.metadata.updatedAt = new Date(constitution.metadata.updatedAt);
    }

    return constitution;
  }

  private createDefault(): Constitution {
    return { principles: [], gates: [], metadata: { projectName: 'unknown', version: '1.0.0', createdAt: new Date(), updatedAt: new Date(), description: 'Project governance constitution' } };
  }

  private mergeBuiltins(): void {
    if (!this.constitution) return;
    for (const builtinPrinciple of BUILTIN_PRINCIPLES) {
      const exists = this.constitution.principles.some(p => p.id === builtinPrinciple.id);
      if (!exists) this.constitution.principles.push(builtinPrinciple);
    }
    for (const builtinGate of BUILTIN_GATES) {
      const exists = this.constitution.gates.some(g => g.id === builtinGate.id);
      if (!exists) this.constitution.gates.push(builtinGate);
    }
  }

  private validateConstitution(): void {
    if (!this.constitution) throw new Error('No constitution loaded');
    const principleIds = new Set<string>();
    for (const principle of this.constitution.principles) {
      if (principleIds.has(principle.id)) throw new Error(`Duplicate principle ID: ${principle.id}`);
      principleIds.add(principle.id);
    }
    const gateIds = new Set<string>();
    for (const gate of this.constitution.gates) {
      if (gateIds.has(gate.id)) throw new Error(`Duplicate gate ID: ${gate.id}`);
      gateIds.add(gate.id);
    }
  }

  addPrinciple(principle: Principle): void {
    if (!this.constitution) throw new Error('No constitution loaded');
    if (this.constitution.principles.some(p => p.id === principle.id)) throw new Error(`Principle with ID "${principle.id}" already exists`);
    this.constitution.principles.push(principle);
    this.constitution.metadata.updatedAt = new Date();
  }

  removePrinciple(id: string): void {
    if (!this.constitution) throw new Error('No constitution loaded');
    const principle = this.constitution.principles.find(p => p.id === id);
    if (!principle) throw new Error(`Principle with ID "${id}" not found`);
    if (principle.immutable) throw new Error(`Principle "${id}" is immutable and cannot be removed`);
    this.constitution.principles = this.constitution.principles.filter(p => p.id !== id);
    this.constitution.metadata.updatedAt = new Date();
  }

  listPrinciples(): Principle[] {
    if (!this.constitution) throw new Error('No constitution loaded');
    return [...this.constitution.principles];
  }

  getPrinciple(id: string): Principle | undefined {
    if (!this.constitution) throw new Error('No constitution loaded');
    return this.constitution.principles.find(p => p.id === id);
  }

  async validate(spec: Spec, options: ValidationOptions = {}): Promise<GateResult[]> {
    if (!this.constitution) throw new Error('No constitution loaded. Call load() first.');
    const { phase = spec.stage, failFast = false, includeWarnings = true } = options;
    const results: GateResult[] = [];
    const applicableGates = this.constitution.gates.filter(g => g.phase === phase);

    for (const gate of applicableGates) {
      const gatePrinciples = gate.principles.map(id => this.constitution!.principles.find(p => p.id === id)).filter((p): p is Principle => p !== undefined);
      const result = await Promise.resolve(gate.check(spec, gatePrinciples));
      results.push(result);
      if (failFast && !result.passed) {
        const hasErrors = result.violations.some(v => v.severity === 'error');
        if (hasErrors) break;
      }
    }

    if (!includeWarnings) {
      for (const result of results) {
        result.violations = result.violations.filter(v => v.severity === 'error');
      }
    }

    return results;
  }

  getConstitution(): Constitution | null {
    return this.constitution;
  }

  hasPrinciple(id: string): boolean {
    return this.constitution?.principles.some(p => p.id === id) ?? false;
  }

  getGatesForPhase(phase: string): Gate[] {
    if (!this.constitution) return [];
    return this.constitution.gates.filter(g => g.phase === phase);
  }
}
