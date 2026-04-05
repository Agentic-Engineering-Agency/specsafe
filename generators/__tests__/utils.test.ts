import { describe, it, expect } from 'vitest';
import { join, resolve } from 'node:path';
import { parseFrontmatter, loadCanonicalSkills, reconstructSkillMd, readCanonicalRule } from '../src/adapters/utils.js';
import { createCanonicalDir } from './adapters/helpers.js';
import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';

const REAL_CANONICAL_DIR = resolve(__dirname, '..', '..', 'canonical');

describe('parseFrontmatter', () => {
  it('parses standard frontmatter correctly', () => {
    const content = '---\nname: my-skill\ndescription: A skill\ndisable-model-invocation: true\n---\nBody here.';
    const result = parseFrontmatter(content);
    expect(result.frontmatter.name).toBe('my-skill');
    expect(result.frontmatter.description).toBe('A skill');
    expect(result.frontmatter['disable-model-invocation']).toBe('true');
    expect(result.body).toBe('Body here.');
  });

  it('returns empty frontmatter and full content when no delimiters present', () => {
    const content = 'Just some plain text.';
    const result = parseFrontmatter(content);
    expect(result.frontmatter).toEqual({});
    expect(result.body).toBe(content);
  });

  it('handles Windows line endings (\\r\\n)', () => {
    const content = '---\r\nname: win-skill\r\ndescription: Windows\r\n---\r\nBody.\r\n';
    const result = parseFrontmatter(content);
    expect(result.frontmatter.name).toBe('win-skill');
    expect(result.frontmatter.description).toBe('Windows');
  });

  it('handles empty body after frontmatter', () => {
    const content = '---\nname: empty-body\n---\n';
    const result = parseFrontmatter(content);
    expect(result.frontmatter.name).toBe('empty-body');
    expect(result.body).toBe('');
  });

  it('handles values with colons', () => {
    const content = '---\nurl: https://example.com\n---\nBody.';
    const result = parseFrontmatter(content);
    expect(result.frontmatter.url).toBe('https://example.com');
  });

  it('preserves full description containing multiple colons', () => {
    const content = '---\ndescription: TDD implementation: red-green-refactor cycle. Uses pattern: test first.\n---\nBody.';
    const result = parseFrontmatter(content);
    expect(result.frontmatter.description).toBe('TDD implementation: red-green-refactor cycle. Uses pattern: test first.');
  });

  it('strips double quotes from values', () => {
    const content = '---\nname: "quoted-value"\n---\nBody.';
    const result = parseFrontmatter(content);
    expect(result.frontmatter.name).toBe('quoted-value');
  });

  it('strips single quotes from values', () => {
    const content = "---\nname: 'single-quoted'\n---\nBody.";
    const result = parseFrontmatter(content);
    expect(result.frontmatter.name).toBe('single-quoted');
  });

  it('handles empty values after colon', () => {
    const content = '---\nname: \n---\nBody.';
    const result = parseFrontmatter(content);
    expect(result.frontmatter.name).toBe('');
  });
});

describe('loadCanonicalSkills', () => {
  it('loads all skills from the real canonical directory', () => {
    const skills = loadCanonicalSkills(REAL_CANONICAL_DIR);
    const expectedCount = readdirSync(join(REAL_CANONICAL_DIR, 'skills'), { withFileTypes: true })
      .filter((entry) => entry.isDirectory()).length;
    expect(skills).toHaveLength(expectedCount);
  });

  it('each skill has name, description, directory fields', () => {
    const skills = loadCanonicalSkills(REAL_CANONICAL_DIR);
    for (const skill of skills) {
      expect(skill.name).toBeTruthy();
      expect(typeof skill.description).toBe('string');
      expect(skill.directory).toBeTruthy();
    }
  });

  it('skills with workflow.md have workflowContent set', () => {
    const skills = loadCanonicalSkills(REAL_CANONICAL_DIR);
    const codeSkill = skills.find((s) => s.directory === 'specsafe-code');
    expect(codeSkill?.workflowContent).toBeTruthy();
  });

  it('skills without workflow.md have workflowContent as undefined', () => {
    const skills = loadCanonicalSkills(REAL_CANONICAL_DIR);
    const initSkill = skills.find((s) => s.directory === 'specsafe-init');
    expect(initSkill?.workflowContent).toBeUndefined();
  });

  it('ignores non-directory entries in the skills folder', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'specsafe-test-'));
    const canonical = createCanonicalDir(tmpDir);
    // createCanonicalDir makes 2 skill dirs; the count should be exactly 2
    const skills = loadCanonicalSkills(canonical);
    expect(skills).toHaveLength(2);
    for (const skill of skills) {
      expect(skill.directory).toBeTruthy();
    }
  });
});

describe('reconstructSkillMd', () => {
  it('round-trip: parse a real SKILL.md, reconstruct, re-parse — name and description match', () => {
    const skills = loadCanonicalSkills(REAL_CANONICAL_DIR);
    const skill = skills[0];
    const reconstructed = reconstructSkillMd(skill);
    const { frontmatter } = parseFrontmatter(reconstructed);
    expect(frontmatter.name).toBe(skill.name);
    expect(frontmatter.description).toBe(skill.description);
  });

  it('includes disable-model-invocation when true', () => {
    const md = reconstructSkillMd({
      name: 'test',
      description: 'Test skill',
      disableModelInvocation: true,
      content: 'Body.',
      directory: 'test',
    });
    expect(md).toContain('disable-model-invocation: true');
  });

  it('round-trip preserves description with colons', () => {
    const skill = {
      name: 'test',
      description: 'TDD: red-green-refactor. Pattern: test first',
      disableModelInvocation: true,
      content: 'Body.',
      directory: 'test',
    };
    const md = reconstructSkillMd(skill);
    const { frontmatter } = parseFrontmatter(md);
    expect(frontmatter.description).toBe(skill.description);
  });

  it('omits disable-model-invocation when false', () => {
    const md = reconstructSkillMd({
      name: 'test',
      description: 'Test skill',
      disableModelInvocation: false,
      content: 'Body.',
      directory: 'test',
    });
    expect(md).not.toContain('disable-model-invocation');
  });
});

describe('readCanonicalRule', () => {
  it('returns content for existing rule files', () => {
    const content = readCanonicalRule(REAL_CANONICAL_DIR, 'CLAUDE.md');
    expect(content.length).toBeGreaterThan(0);
  });

  it('returns empty string for non-existent rule files', () => {
    const content = readCanonicalRule(REAL_CANONICAL_DIR, 'NONEXISTENT.md');
    expect(content).toBe('');
  });
});
