import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const PERSONAS_DIR = path.resolve(__dirname, '../canonical/personas');

// Dynamically discover all persona files
const ALL_PERSONAS = fs
  .readdirSync(PERSONAS_DIR)
  .filter((f) => f.endsWith('.md'))
  .map((f) => f.replace('.md', ''))
  .sort();

const REQUIRED_SECTIONS = [
  '## Identity',
  '## Communication Style',
  '## Principles',
  '## Guardrails',
];

describe('Personas', () => {
  it('discovers at least one persona', () => {
    expect(ALL_PERSONAS.length).toBeGreaterThan(0);
  });

  for (const persona of ALL_PERSONAS) {
    describe(persona, () => {
      const filePath = path.join(PERSONAS_DIR, `${persona}.md`);

      it('file exists', () => {
        expect(fs.existsSync(filePath)).toBe(true);
      });

      for (const section of REQUIRED_SECTIONS) {
        it(`has "${section}" section`, () => {
          const content = fs.readFileSync(filePath, 'utf-8');
          expect(content).toContain(section);
        });
      }
    });
  }
});
