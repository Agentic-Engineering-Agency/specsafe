/**
 * SpecSafe Config Loader
 * Loads configuration from specsafe.config.json with sensible defaults
 */

import { readFile, access } from 'fs/promises';
import { join } from 'path';

export interface SpecSafeConfig {
  projectName: string;
  version: string;
  stages: string[];
  testFramework: 'vitest' | 'jest';
  language: 'typescript';
  tools?: {
    [toolName: string]: {
      enabled: boolean;
      version: string;
    };
  };
}

const DEFAULT_CONFIG: SpecSafeConfig = {
  projectName: 'Untitled Project',
  version: '1.0.0',
  stages: ['spec', 'test', 'code', 'qa', 'complete', 'archived'],
  testFramework: 'vitest',
  language: 'typescript'
};

/**
 * Load SpecSafe configuration from specsafe.config.json
 * Returns defaults if file doesn't exist
 */
export async function loadConfig(cwd: string = process.cwd()): Promise<SpecSafeConfig> {
  const configPath = join(cwd, 'specsafe.config.json');
  
  try {
    await access(configPath);
    const content = await readFile(configPath, 'utf-8');
    const parsed = JSON.parse(content) as Partial<SpecSafeConfig>;
    
    // Merge with defaults
    return {
      projectName: parsed.projectName ?? DEFAULT_CONFIG.projectName,
      version: parsed.version ?? DEFAULT_CONFIG.version,
      stages: parsed.stages ?? DEFAULT_CONFIG.stages,
      testFramework: parsed.testFramework ?? DEFAULT_CONFIG.testFramework,
      language: parsed.language ?? DEFAULT_CONFIG.language
    };
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // Config file doesn't exist, return defaults
      return { ...DEFAULT_CONFIG };
    }
    
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in specsafe.config.json: ${error.message}`);
    }
    
    throw error;
  }
}
