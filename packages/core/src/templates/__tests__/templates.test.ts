import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { TemplateEngine } from '../engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Built-in Templates', () => {
  const engine = new TemplateEngine();
  const builtinsDir = join(__dirname, '..', 'builtins');

  it('should load feature-spec.md', () => {
    const template = readFileSync(join(builtinsDir, 'feature-spec.md'), 'utf-8');
    expect(template).toContain('{{PROJECT_NAME}}');
    const result = engine.renderTemplate(template, {
      variables: { PROJECT_NAME: 'Test', SPEC_ID: '001', DATE: '2024-01-01', AUTHOR: 'Me', EARS_MODE: false }
    });
    expect(result).toContain('Test');
  });
});
