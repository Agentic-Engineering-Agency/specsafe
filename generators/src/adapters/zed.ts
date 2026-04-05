import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CanonicalSkill, GeneratedFile, ToolAdapter } from './types.js';
import { readCanonicalRule } from './utils.js';

export const zedAdapter: ToolAdapter = {
  name: 'zed',
  displayName: 'Zed',

  async detect(projectRoot: string): Promise<boolean> {
    return existsSync(join(projectRoot, '.zed'));
  },

  async generate(
    _skills: CanonicalSkill[],
    canonicalDir: string,
    projectRoot?: string,
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    const rules = readCanonicalRule(canonicalDir, '.rules');
    if (rules) {
      files.push({ path: '.rules', content: rules });
    }

    const specsafeSettings = {
      assistant: {
        version: '2',
        default_model: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-20250514',
        },
      },
    };

    let merged = specsafeSettings as Record<string, unknown>;
    if (projectRoot) {
      const settingsPath = join(projectRoot, '.zed', 'settings.json');
      if (existsSync(settingsPath)) {
        try {
          const existing = JSON.parse(readFileSync(settingsPath, 'utf-8'));
          // Deep merge: preserve user settings, layer specsafe on top
          merged = { ...existing };
          for (const [key, value] of Object.entries(specsafeSettings)) {
            if (
              typeof value === 'object' &&
              value !== null &&
              !Array.isArray(value) &&
              typeof (merged as Record<string, unknown>)[key] === 'object' &&
              (merged as Record<string, unknown>)[key] !== null &&
              !Array.isArray((merged as Record<string, unknown>)[key])
            ) {
              // Merge nested objects (e.g. assistant)
              (merged as Record<string, unknown>)[key] = {
                ...((merged as Record<string, unknown>)[key] as Record<string, unknown>),
                ...(value as Record<string, unknown>),
              };
            } else {
              (merged as Record<string, unknown>)[key] = value;
            }
          }
        } catch {
          // Invalid JSON — overwrite
        }
      }
    }

    files.push({
      path: '.zed/settings.json',
      content: `${JSON.stringify(merged, null, 2)}\n`,
    });

    return files;
  },
};
