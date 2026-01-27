import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import type { ProjectState, Spec, ChangeLogEntry } from '../types.js';
import { logger, getTimestamp } from '../utils/logger.js';

/**
 * Manages PROJECT_STATE.md - master tracking document
 */
export class ProjectStateManager {
  private state: ProjectState;
  private projectRoot: string;
  private configPath: string;
  private statePath: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.configPath = path.join(projectRoot, '.specsafe', 'config.yaml');
    this.statePath = path.join(projectRoot, 'PROJECT_STATE.md');

    this.state = this.getInitialState();
  }

  private getInitialState(): ProjectState {
    return {
      lastUpdated: getTimestamp(),
      currentPhase: 'SPEC',
      activeSpec: null,
      specs: [],
    };
  }

  /**
   * Load state from PROJECT_STATE.md
   */
  async load(): Promise<ProjectState> {
    try {
      const content = await fs.readFile(this.statePath, 'utf-8');

      // Parse specs from markdown table
      const specMatch = content.match(/\| Spec \| Location \| Phase \| Tests \|/s);
      if (specMatch) {
        const lines = content.split('\n');
        const specs: Spec[] = [];

        for (const line of lines) {
          if (line.startsWith('|') && !line.startsWith('| Spec')) {
            const parts = line.split('|');
            if (parts.length >= 7 && parts[1]) {
              specs.push({
                name: parts[1].trim(),
                location: parts[2].trim().replace(/\/$/, '') as 'active' | 'completed' | 'archive',
                phase: parts[3].trim() as any,
                tests: parseInt(parts[4].trim()) || 0,
                passing: parseInt(parts[5].trim()) || 0,
              });
            }
          }
        }

        this.state.specs = specs;
      }

      // Extract current phase
      const phaseMatch = content.match(/\*\*Current Phase:\*\*\s*(\w+)/);
      if (phaseMatch) {
        this.state.currentPhase = phaseMatch[1] as any;
      }

      // Extract active spec
      const activeSpecMatch = content.match(/\*\*Active Spec:\*\*\s*(\S+)/);
      if (activeSpecMatch && activeSpecMatch[1] !== 'None') {
        this.state.activeSpec = activeSpecMatch[1];
      }

      return this.state;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist, return initial state
        return this.getInitialState();
      }
      throw error;
    }
  }

  /**
   * Save state to PROJECT_STATE.md
   */
  async save(): Promise<void> {
    this.state.lastUpdated = getTimestamp();

    const content = await this.generateMarkdown();
    await fs.writeFile(this.statePath, content, 'utf-8');

    logger.debug(`Updated PROJECT_STATE.md`);
  }

  /**
   * Add a new spec to tracking
   */
  async addSpec(name: string, phase: string = 'SPEC'): Promise<void> {
    const spec: Spec = {
      name,
      phase: phase as any,
      tests: 0,
      passing: 0,
      location: 'active',
      createdAt: getTimestamp(),
    };

    this.state.specs.push(spec);
    this.state.activeSpec = name;
    this.state.currentPhase = phase as any;

    await this.save();
  }

  /**
   * Update spec phase and metrics
   */
  async updateSpec(name: string, updates: Partial<Spec>): Promise<void> {
    const spec = this.state.specs.find((s) => s.name === name);
    if (!spec) {
      throw new Error(`Spec not found: ${name}`);
    }

    Object.assign(spec, updates);
    spec.updatedAt = getTimestamp();

    if (updates.phase) {
      this.state.currentPhase = updates.phase as any;
    }

    await this.save();
  }

  /**
   * Move spec between directories (active/completed/archive)
   */
  async moveSpec(
    name: string,
    targetLocation: 'active' | 'completed' | 'archive'
  ): Promise<void> {
    const spec = this.state.specs.find((s) => s.name === name);
    if (!spec) {
      throw new Error(`Spec not found: ${name}`);
    }

    spec.location = targetLocation;

    if (targetLocation === 'completed') {
      spec.phase = 'COMPLETE';
    }

    await this.save();
  }

  /**
   * Load config from .specsafe/config.yaml
   */
  async loadConfig(): Promise<any> {
    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return yaml.load(content) as any;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Generate PROJECT_STATE.md markdown content
   */
  private async generateMarkdown(): Promise<string> {
    const { lastUpdated, currentPhase, activeSpec, specs } = this.state;

    // Try to load project name from config
    let projectName = 'My Project';
    try {
      const config = await this.loadConfig();
      if (config && config.specsafe && config.specsafe.projectName) {
        projectName = config.specsafe.projectName;
      }
    } catch {
      // Use default
    }

    let md = `# Project State - ${projectName}

**Last Updated:** ${lastUpdated}
**Current Phase:** ${currentPhase}
**Active Spec:** ${activeSpec || 'None'}

## Spec Status Summary

| Spec | Location | Phase | Tests | Passing | Coverage | QA Status |
|------|----------|-------|-------|---------|----------|-----------|`;

    for (const spec of specs) {
      const passRate =
        spec.tests > 0 ? `${Math.round((spec.passing / spec.tests) * 100)}%` : '-';
      const coverage = spec.coverage ? `${spec.coverage}%` : '-';
      const qaStatus = spec.qaStatus || '-';

      md += `\n| ${spec.name} | ${spec.location} | ${spec.phase} | ${spec.passing}/${spec.tests} | ${passRate} | ${coverage} | ${qaStatus} |`;
    }

    md += `

**Legend:**
- \`active/\` - Currently in development workflow
- \`completed/\` - Production-ready, human-approved
- \`archive/\` - Deprecated/removed (trashcan)

---

*Generated by SpecSafe*`;

    return md;
  }

  /**
   * Add entry to change log
   */
  async addChangeLog(entry: ChangeLogEntry): Promise<void> {
    const { date, time, action, spec, files, agent, notes } = entry;

    const logPath = path.join(this.projectRoot, 'tracking', 'changes.log');

    // Ensure tracking directory exists
    await fs.mkdir(path.dirname(logPath), { recursive: true });

    const logLine = `| ${date} | ${time} | ${action} | ${spec} | ${files} | ${agent} | ${notes} |\n`;

    await fs.appendFile(logPath, logLine, 'utf-8');

    logger.debug(`Added change log entry: ${action} on ${spec}`);
  }

  getState(): ProjectState {
    return { ...this.state };
  }
}
