export { aiderAdapter } from './aider.js';
export { antigravityAdapter } from './antigravity.js';
export { claudeCodeAdapter } from './claude-code.js';
export { continueAdapter } from './continue.js';
export { cursorAdapter } from './cursor.js';
export { geminiAdapter } from './gemini.js';
export { opencodeAdapter } from './opencode.js';
export type {
  CanonicalSkill,
  GeneratedFile,
  SpecSafeConfig,
  ToolAdapter,
  ToolName,
} from './types.js';
export { TOOL_NAMES } from './types.js';
export {
  loadCanonicalSkills,
  parseFrontmatter,
  readCanonicalRule,
  reconstructSkillMd,
} from './utils.js';
export { zedAdapter } from './zed.js';

import { aiderAdapter } from './aider.js';
import { antigravityAdapter } from './antigravity.js';
import { claudeCodeAdapter } from './claude-code.js';
import { continueAdapter } from './continue.js';
import { cursorAdapter } from './cursor.js';
import { geminiAdapter } from './gemini.js';
import { opencodeAdapter } from './opencode.js';
import type { ToolAdapter } from './types.js';
import { zedAdapter } from './zed.js';

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
