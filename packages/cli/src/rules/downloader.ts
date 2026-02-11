/**
 * Rules Downloader
 * Downloads rules from the GitHub repository or local source
 */

import { readFile, access, mkdir, writeFile, copyFile, rm, chmod } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import type { DownloadOptions, RuleOperationResult } from './types.js';
import { getTool, isValidTool } from './registry.js';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Path to the rules directory in the repository
 */
export function getRulesSourcePath(): string {
  // In development: rules are in the repo root
  // In production: rules are bundled with the package
  const possiblePaths = [
    join(__dirname, '../../../../../rules'), // From dist/cli/src/rules/ to repo root
    join(__dirname, '../../../rules'), // Alternative path
    join(process.cwd(), 'rules'), // Local development
  ];

  for (const p of possiblePaths) {
    if (existsSync(p)) return p;
  }
  return possiblePaths[0];
}

/**
 * Get the path to a specific tool's rules
 */
export function getToolRulesPath(toolName: string): string {
  return join(getRulesSourcePath(), toolName);
}

/**
 * Check if rules exist for a tool in the source
 */
export async function rulesExist(toolName: string): Promise<boolean> {
  if (!isValidTool(toolName)) return false;
  
  const toolRulesPath = getToolRulesPath(toolName);
  try {
    await access(toolRulesPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the content of a rule file from the source
 */
export async function getRuleContent(
  toolName: string,
  fileName: string
): Promise<string | null> {
  const filePath = join(getToolRulesPath(toolName), fileName);
  try {
    return await readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Get the version of rules for a tool
 * Currently returns '1.0.0' as placeholder
 * In the future, this could read from a manifest.json
 */
export async function getRulesVersion(_toolName: string): Promise<string> {
  // Placeholder: in the future, read from manifest.json
  return '1.0.0';
}

/**
 * Download and install rules for a tool
 */
export async function downloadRules(
  toolName: string,
  cwd: string = process.cwd(),
  options: DownloadOptions = {}
): Promise<RuleOperationResult> {
  if (!isValidTool(toolName)) {
    return {
      success: false,
      message: `Unknown tool: ${toolName}`,
      tool: toolName,
    };
  }

  const tool = getTool(toolName);
  if (!tool) {
    return {
      success: false,
      message: `Tool definition not found: ${toolName}`,
      tool: toolName,
    };
  }

  try {
    // Check if rules exist in source
    const rulesPath = getToolRulesPath(toolName);
    try {
      await access(rulesPath);
    } catch {
      return {
        success: false,
        message: `Rules not found for ${toolName} at ${rulesPath}`,
        tool: toolName,
      };
    }

    // Install each file defined for the tool
    for (const file of tool.files) {
      // tool.files contains destination paths (e.g. ".continue/config.yaml")
      // Source files are stored flat in rules/<tool>/ (e.g. "rules/continue/config.yaml")
      // Extract just the filename for source path lookup
      const sourceFile = file.split('/').pop()!;
      const sourcePath = join(rulesPath, sourceFile);
      const targetPath = join(cwd, file);

      // Create parent directories if needed
      await mkdir(dirname(targetPath), { recursive: true });

      try {
        const content = await readFile(sourcePath, 'utf-8');
        await writeFile(targetPath, content);
        
        // Set execute permission for hook files
        if (file.includes('hook') || file === 'pre-commit' || file === 'post-commit') {
          await chmod(targetPath, 0o755);
        }
      } catch (error: any) {
        // If file doesn't exist in source, create an empty placeholder
        if (error.code === 'ENOENT') {
          await mkdir(dirname(targetPath), { recursive: true });
          await writeFile(targetPath, getPlaceholderContent(toolName, file));
          
          // Set execute permission for hook files
          if (file.includes('hook') || file === 'pre-commit' || file === 'post-commit') {
            await chmod(targetPath, 0o755);
          }
        } else {
          throw error;
        }
      }
    }

    const version = await getRulesVersion(toolName);
    return {
      success: true,
      message: `Installed ${toolName} rules (v${version})`,
      tool: toolName,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to install ${toolName} rules: ${error.message}`,
      tool: toolName,
      error,
    };
  }
}

/**
 * Remove rules for a tool
 */
export async function removeRules(
  toolName: string,
  cwd: string = process.cwd()
): Promise<RuleOperationResult> {
  if (!isValidTool(toolName)) {
    return {
      success: false,
      message: `Unknown tool: ${toolName}`,
      tool: toolName,
    };
  }

  const tool = getTool(toolName);
  if (!tool) {
    return {
      success: false,
      message: `Tool definition not found: ${toolName}`,
      tool: toolName,
    };
  }

  try {
    const removedFiles: string[] = [];
    
    for (const file of tool.files) {
      const filePath = join(cwd, file);
      try {
        await access(filePath);
        await rm(filePath);
        removedFiles.push(file);
      } catch {
        // File doesn't exist, skip
      }
    }

    if (removedFiles.length === 0) {
      return {
        success: true,
        message: `No ${toolName} rules found to remove`,
        tool: toolName,
      };
    }

    return {
      success: true,
      message: `Removed ${toolName} rules`,
      tool: toolName,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to remove ${toolName} rules: ${error.message}`,
      tool: toolName,
      error,
    };
  }
}

/**
 * Update rules for a tool to the latest version
 */
export async function updateRules(
  toolName: string,
  cwd: string = process.cwd()
): Promise<RuleOperationResult> {
  // For now, update is the same as download (overwrite)
  // In the future, this could check versions and only update if needed
  const result = await downloadRules(toolName, cwd, { force: true });
  
  if (result.success) {
    const version = await getRulesVersion(toolName);
    result.message = `Updated ${toolName} rules to v${version}`;
  }
  
  return result;
}

/**
 * Get placeholder content for a rule file
 */
function getPlaceholderContent(toolName: string, fileName: string): string {
  const extension = fileName.split('.').pop();
  
  switch (extension) {
    case 'json':
      return JSON.stringify({
        name: toolName,
        version: '1.0.0',
        description: `SpecSafe rules for ${toolName}`,
        note: 'This is a placeholder. Content will be added in a future update.',
      }, null, 2);
    
    case 'yml':
    case 'yaml':
      return `# SpecSafe Rules for ${toolName}
# Version: 1.0.0
# This is a placeholder. Content will be added in a future update.
`;
    
    case 'md':
      return `# SpecSafe Rules for ${toolName}

## Version: 1.0.0

> This is a placeholder. Content will be added in a future update.
`;
    
    default:
      return `# SpecSafe Rules for ${toolName}
# Version: 1.0.0
# This is a placeholder. Content will be added in a future update.
`;
  }
}
