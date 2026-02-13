import { describe, it, expect } from 'vitest';
import {
  E2EEngine,
  convertToPlaywrightScenarios,
  generatePlaywrightScript,
  type PlaywrightScenario,
} from '../playwright.js';
import type { TestGuide } from '../types.js';

describe('Playwright E2E integration', () => {
  it('exposes availability check', () => {
    expect(typeof E2EEngine.isAvailable()).toBe('boolean');
  });

  it('generates playwright script for scenarios', () => {
    const scenarios: PlaywrightScenario[] = [
      {
        id: 'S1',
        name: 'Login flow',
        url: 'https://example.com',
        actions: [
          { type: 'navigate', value: 'https://example.com/login' },
          { type: 'fill', selector: '#email', value: 'test@example.com' },
          { type: 'click', selector: '#submit' },
          { type: 'screenshot', screenshotPath: 'shots/login.png' },
        ],
      },
    ];

    const script = generatePlaywrightScript('SPEC-42', scenarios);
    expect(script).toContain("import { test, expect } from '@playwright/test';");
    expect(script).toContain('await page.goto("https://example.com/login");');
    expect(script).toContain('await page.fill("#email", "test@example.com");');
    expect(script).toContain('await page.click("#submit");');
  });

  it('converts manual guide to playwright scenarios', () => {
    const guide: TestGuide = {
      specId: 'SPEC-42',
      specName: 'Demo',
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      globalPrerequisites: [],
      setupInstructions: [],
      cleanupInstructions: [],
      scenarios: [
        {
          id: 'FR-1-SC-1',
          name: 'Flow',
          description: 'Flow description',
          prerequisites: [],
          priority: 'P1',
          steps: [
            {
              id: 'step-1',
              order: 1,
              description: 'action',
              action: "click '#save'",
              expectedResult: 'saved',
              screenshotRequired: true,
            },
          ],
        },
      ],
    };

    const converted = convertToPlaywrightScenarios(guide);
    expect(converted).toHaveLength(1);
    expect(converted[0].actions.some((a) => a.type === 'screenshot')).toBe(true);
  });

  it('captures screenshot with expected path', async () => {
    const engine = new E2EEngine();
    const calls: any[] = [];
    const page = {
      screenshot: async (args: any) => {
        calls.push(args);
      },
    };

    const path = await engine.captureScreenshot(page, 'shots/home.png');
    expect(path).toBe('shots/home.png');
    expect(calls[0].path).toBe('shots/home.png');
  });

  it('rejects unsafe screenshot traversal paths', async () => {
    const engine = new E2EEngine();
    const page = { screenshot: async () => {} };
    await expect(engine.captureScreenshot(page, '../etc/passwd')).rejects.toThrow('path traversal');
  });

  it('fills form using selector map', async () => {
    const engine = new E2EEngine();
    const filled: Array<[string, string]> = [];
    const page = {
      fill: async (selector: string, value: string) => {
        filled.push([selector, value]);
      },
    };

    await engine.fillForm(page, { '#name': 'Ada', '#email': 'ada@example.com' });
    expect(filled).toEqual([
      ['#name', 'Ada'],
      ['#email', 'ada@example.com'],
    ]);
  });

  it('waits for selector state', async () => {
    const engine = new E2EEngine({ timeout: 1234 });
    let waitArgs: any;
    const page = {
      waitForSelector: async (selector: string, options: any) => {
        waitArgs = { selector, ...options };
      },
    };

    await engine.waitForState(page, { selector: '#ready', state: 'visible' });
    expect(waitArgs.selector).toBe('#ready');
    expect(waitArgs.state).toBe('visible');
    expect(waitArgs.timeout).toBe(1234);
  });

  it('runAllScenarios returns empty for specId shorthand', async () => {
    const engine = new E2EEngine();
    const out = await engine.runAllScenarios('SPEC-42');
    expect(out).toEqual([]);
  });

  it('escapes quotes in generated playwright script', () => {
    const scenarios: PlaywrightScenario[] = [{
      id: 'S2',
      name: "Flow with 'quotes'",
      actions: [{ type: 'click', selector: "button[data-name='x']" }],
    }];

    const script = generatePlaywrightScript('SPEC-42', scenarios);
    expect(script).toContain('test.describe("Flow with \'quotes\'", () => {');
    expect(script).toContain('await page.click("button[data-name=\'x\']");');
  });
});
