import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as p from '@clack/prompts';
import c from 'ansis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = import.meta.dirname ?? dirname(__filename);

function defaultCanonicalDir(): string {
  return resolve(__dirname, '..', '..', 'canonical');
}

export interface InitOptions {
  cwd?: string;
  canonicalDir?: string;
  interactive?: boolean;
  tools?: string[];
  testFramework?: string;
  language?: string;
}

const TOOL_DETECT_MAP: Record<string, string> = {
  'claude-code': '.claude/',
  cursor: '.cursor/',
  opencode: '.opencode/',
  gemini: '.gemini/',
  antigravity: '.agent/',
  zed: '.zed/',
  continue: '.continue/',
  aider: '.aider.conf.yml',
};

async function detectTools(cwd: string): Promise<string[]> {
  const detected: string[] = [];
  for (const [tool, marker] of Object.entries(TOOL_DETECT_MAP)) {
    if (await fileExists(join(cwd, marker))) {
      detected.push(tool);
    }
  }
  return detected;
}

export async function init(name?: string, opts: InitOptions = {}): Promise<void> {
  const cwd = opts.cwd ?? process.cwd();
  const canonicalDir = opts.canonicalDir ?? defaultCanonicalDir();
  const interactive = opts.interactive ?? false;

  // Check if already initialized
  const configPath = join(cwd, 'specsafe.config.json');
  if (await fileExists(configPath)) {
    if (interactive) {
      p.log.warn('SpecSafe is already initialized in this directory. Run `specsafe doctor` to check project health.');
    } else {
      console.log('SpecSafe is already initialized in this directory. Run `specsafe doctor` to check project health.');
    }
    return;
  }

  let projectName = name ?? basename(cwd);
  let selectedTools = opts.tools ?? [];
  let testFramework = opts.testFramework ?? 'vitest';
  let language = opts.language ?? 'typescript';

  if (interactive) {
    p.intro(c.cyan('SpecSafe — Initialize Project'));

    const result = await p.group({
      projectName: () =>
        p.text({
          message: 'Project name?',
          placeholder: basename(cwd),
          defaultValue: basename(cwd),
        }),
      tools: async () => {
        const detected = await detectTools(cwd);
        const allTools = Object.keys(TOOL_DETECT_MAP);
        return p.multiselect({
          message: 'Which tools to install?',
          options: allTools.map(t => ({
            value: t,
            label: t,
            hint: detected.includes(t) ? 'detected' : undefined,
          })),
          initialValues: detected,
          required: false,
        });
      },
      testFramework: () =>
        p.select({
          message: 'Test framework?',
          options: [
            { value: 'vitest', label: 'vitest' },
            { value: 'jest', label: 'jest' },
            { value: 'pytest', label: 'pytest' },
            { value: 'go test', label: 'go test' },
          ],
        }),
      language: () =>
        p.select({
          message: 'Language?',
          options: [
            { value: 'typescript', label: 'typescript' },
            { value: 'python', label: 'python' },
            { value: 'go', label: 'go' },
            { value: 'rust', label: 'rust' },
            { value: 'other', label: 'other' },
          ],
        }),
    }, {
      onCancel: () => {
        p.cancel('Setup cancelled.');
        process.exit(0);
      },
    });

    projectName = (result.projectName as string) || basename(cwd);
    selectedTools = (result.tools as string[]) ?? [];
    testFramework = result.testFramework as string;
    language = result.language as string;

    const s = p.spinner();
    s.start('Creating project files...');

    await createProjectFiles(cwd, canonicalDir, projectName, testFramework, language);

    s.stop('Project files created.');

    if (selectedTools.length > 0) {
      const si = p.spinner();
      si.start(`Installing ${selectedTools.length} tool(s)...`);
      const { install } = await import('./install.js');
      for (const tool of selectedTools) {
        await install(tool, { cwd, canonicalDir });
      }
      si.stop(`Installed ${selectedTools.length} tool(s).`);
    }

    p.outro(c.green('Project initialized! Run /specsafe-new to create your first spec.'));
  } else {
    await createProjectFiles(cwd, canonicalDir, projectName, testFramework, language);

    console.log(`SpecSafe initialized for project: ${projectName}

Created:
  specs/active/
  specs/completed/
  specs/archive/
  specsafe.config.json
  PROJECT_STATE.md
  specs/template.md

Next steps:
  1. Review specsafe.config.json and fill in any missing fields
  2. Run \`specsafe install <tool>\` to install skills for your AI tool`);
  }
}

async function createProjectFiles(
  cwd: string,
  canonicalDir: string,
  projectName: string,
  testFramework: string,
  language: string,
): Promise<void> {
  // Create directories
  const dirs = ['specs/active', 'specs/completed', 'specs/archive'];
  for (const dir of dirs) {
    await mkdir(join(cwd, dir), { recursive: true });
  }

  // Copy and populate config template
  const configTemplate = await readFile(join(canonicalDir, 'templates', 'specsafe-config-template.json'), 'utf-8');
  const config = configTemplate.replace(/\{\{project-name\}\}/g, projectName);
  const configPath = join(cwd, 'specsafe.config.json');
  // Parse config to inject testFramework and language
  const configObj = JSON.parse(config);
  configObj.testFramework = testFramework;
  configObj.language = language;
  await writeFile(configPath, JSON.stringify(configObj, null, 2) + '\n', 'utf-8');

  // Copy and populate PROJECT_STATE.md template
  const stateTemplate = await readFile(join(canonicalDir, 'templates', 'project-state-template.md'), 'utf-8');
  const state = stateTemplate
    .replace(/\{\{project-name\}\}/g, projectName)
    .replace(/\{\{version\}\}/g, '1.0.0')
    .replace(/\{\{timestamp\}\}/g, new Date().toISOString().split('T')[0]);
  await writeFile(join(cwd, 'PROJECT_STATE.md'), state, 'utf-8');

  // Copy spec template
  const specTemplate = await readFile(join(canonicalDir, 'templates', 'spec-template.md'), 'utf-8');
  await writeFile(join(cwd, 'specs', 'template.md'), specTemplate, 'utf-8');
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
