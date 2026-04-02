import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const PERSONAS_DIR = path.resolve(__dirname, '../canonical/personas');

const EXPECTED_PERSONAS = [
  'scout-elena',
  'mason-kai',
  'forge-reva',
  'bolt-zane',
  'warden-lyra',
  'herald-cass',
];

const REQUIRED_SECTIONS = [
  '## Identity',
  '## Communication Style',
  '## Principles',
  '## Guardrails',
];

describe('Personas', () => {
  for (const persona of EXPECTED_PERSONAS) {
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
