export { claudeCodeAdapter } from './claude-code.js';
export { opencodeAdapter } from './opencode.js';
export { cursorAdapter } from './cursor.js';
export { continueAdapter } from './continue.js';
export { aiderAdapter } from './aider.js';
export { zedAdapter } from './zed.js';
export { geminiAdapter } from './gemini.js';
export { antigravityAdapter } from './antigravity.js';
export { loadCanonicalSkills, parseFrontmatter, readCanonicalRule, reconstructSkillMd } from './utils.js';
export type { ToolAdapter, CanonicalSkill, GeneratedFile, SpecSafeConfig, ToolName } from './types.js';
export { TOOL_NAMES } from './types.js';

import type { ToolAdapter } from './types.js';
import { claudeCodeAdapter } from './claude-code.js';
import { opencodeAdapter } from './opencode.js';
import { cursorAdapter } from './cursor.js';
import { continueAdapter } from './continue.js';
import { aiderAdapter } from './aider.js';
import { zedAdapter } from './zed.js';
import { geminiAdapter } from './gemini.js';
import { antigravityAdapter } from './antigravity.js';

export const adapters: Record<string, ToolAdapter> = {
  'claude-code': claudeCodeAdapter,
  opencode: opencodeAdapter,
  cursor: cursorAdapter,
  continue: continueAdapter,
  aider: aiderAdapter,
  zed: zedAdapter,
  gemini: geminiAdapter,
  antigravity: antigravityAdapter,
};
