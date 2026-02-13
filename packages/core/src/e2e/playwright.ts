/**
 * Playwright Integration for E2E Testing
 * Automated browser testing with Playwright
 */

import { dirname, isAbsolute, normalize } from 'path';
import { mkdir } from 'fs/promises';

// Check if @playwright/test is available
let playwrightModule: any = null;
let playwrightAvailable = false;

try {
  // Use dynamic import to avoid errors if not installed
  // @ts-ignore - optional dependency may not be installed
  playwrightModule = await import('playwright');
  playwrightAvailable = true;
} catch {
  // Playwright not installed - will handle gracefully
  playwrightAvailable = false;
}

/**
 * Playwright-specific types
 */

export interface PlaywrightConfig {
  browser?: 'chromium' | 'firefox' | 'webkit';
  headless?: boolean;
  timeout?: number;
  viewport?: { width: number; height: number };
  slowMo?: number;
}

export interface PlaywrightAction {
  type: 'click' | 'fill' | 'navigate' | 'screenshot' | 'wait' | 'select' | 'hover' | 'press';
  selector?: string;
  value?: string;
  timeout?: number;
  text?: string;
  key?: string;
  screenshotPath?: string;
  waitFor?: 'visible' | 'hidden' | 'attached' | 'detached';
}

export interface PlaywrightScenario {
  id: string;
  name: string;
  steps?: string[];
  url?: string;
  actions: PlaywrightAction[];
  description?: string;
}

export interface PlaywrightResult {
  scenarioId: string;
  status: 'pass' | 'fail' | 'error' | 'skipped';
  duration: number;
  screenshots: string[];
  error?: string;
  steps: Array<{
    action: PlaywrightAction;
    status: 'pass' | 'fail' | 'error';
    duration: number;
    error?: string;
  }>;
}

const MAX_INPUT_LENGTH = 2000;

function ensureSafeInput(value: string, label: string): string {
  if (!value || typeof value !== 'string') {
    throw new Error(`${label} must be a non-empty string`);
  }
  if (value.length > MAX_INPUT_LENGTH) {
    throw new Error(`${label} exceeds maximum length of ${MAX_INPUT_LENGTH}`);
  }
  return value;
}

function ensureSafeScreenshotPath(filePath: string): string {
  const safePath = ensureSafeInput(filePath, 'Screenshot path');
  const normalized = normalize(safePath);
  if (normalized.includes('..')) {
    throw new Error('Screenshot path cannot contain path traversal segments');
  }
  if (isAbsolute(normalized)) {
    throw new Error('Screenshot path must be relative');
  }
  return normalized;
}

function escapeJsString(value: string): string {
  return JSON.stringify(value);
}

/**
 * E2E Engine with Playwright integration
 */
export class E2EEngine {
  private config: PlaywrightConfig;
  private browser: any = null;
  private context: any = null;
  private page: any = null;

  constructor(config: PlaywrightConfig = {}) {
    this.config = {
      browser: 'chromium',
      headless: true,
      timeout: 30000,
      viewport: { width: 1280, height: 720 },
      ...config
    };
  }

  /**
   * Initialize the browser
   */
  async initialize(): Promise<void> {
    if (!playwrightAvailable) {
      throw new Error('Playwright is not installed. Install it with: npm install @playwright/test');
    }

    const browserType = playwrightModule[this.config.browser!];
    this.browser = await browserType.launch({
      headless: this.config.headless,
      slowMo: this.config.slowMo
    });

    this.context = await this.browser.newContext({
      viewport: this.config.viewport
    });

    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(this.config.timeout!);
  }

  /**
   * Run a single scenario
   */
  async runScenario(scenario: PlaywrightScenario): Promise<PlaywrightResult> {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const steps: PlaywrightResult['steps'] = [];

    if (!this.page) {
      await this.initialize();
    }

    try {
      // Navigate to URL if provided
      if (scenario.url) {
        const action: PlaywrightAction = {
          type: 'navigate',
          value: scenario.url
        };
        await this.executeAction(action, steps);
      }

      // Execute all actions
      for (const action of scenario.actions) {
        await this.executeAction(action, steps, screenshots);
      }

      return {
        scenarioId: scenario.id,
        status: 'pass',
        duration: Date.now() - startTime,
        screenshots,
        steps
      };
    } catch (error: any) {
      return {
        scenarioId: scenario.id,
        status: 'error',
        duration: Date.now() - startTime,
        screenshots,
        error: error?.message || 'Scenario execution failed',
        steps
      };
    }
  }

  /**
   * Run multiple scenarios
   * Accepts either a scenario list or a specId placeholder (for API compatibility)
   */
  async runAllScenarios(specIdOrScenarios: string | PlaywrightScenario[]): Promise<PlaywrightResult[]> {
    if (typeof specIdOrScenarios === 'string') {
      void specIdOrScenarios;
      return [];
    }

    const results: PlaywrightResult[] = [];
    for (const scenario of specIdOrScenarios) {
      const result = await this.runScenario(scenario);
      results.push(result);
    }
    return results;
  }

  /**
   * Run with Playwright config override
   */
  async runWithPlaywright(config: PlaywrightConfig, scenarios: PlaywrightScenario[]): Promise<PlaywrightResult[]> {
    // Temporarily override config
    const oldConfig = { ...this.config };
    Object.assign(this.config, config);

    // Reinitialize with new config
    await this.close();
    await this.initialize();

    const results = await this.runAllScenarios(scenarios);

    // Restore config
    Object.assign(this.config, oldConfig);
    await this.close();
    await this.initialize();

    return results;
  }

  /**
   * Execute a single Playwright action
   */
  private async executeAction(
    action: PlaywrightAction,
    steps: PlaywrightResult['steps'],
    screenshots?: string[]
  ): Promise<void> {
    const stepStart = Date.now();

    if (!this.page) {
      throw new Error('Playwright page is not initialized');
    }

    try {
      switch (action.type) {
        case 'navigate': {
          const targetUrl = ensureSafeInput(action.value || '', 'Navigation URL');
          if (!/^https?:\/\//i.test(targetUrl)) {
            throw new Error('Navigation URL must start with http:// or https://');
          }
          await this.page.goto(targetUrl);
          break;
        }

        case 'click': {
          const selector = ensureSafeInput(action.selector || '', 'Selector');
          await this.page.click(selector);
          break;
        }

        case 'fill': {
          const selector = ensureSafeInput(action.selector || '', 'Selector');
          await this.page.fill(selector, (action.value || '').slice(0, MAX_INPUT_LENGTH));
          break;
        }

        case 'screenshot': {
          const rawPath = action.screenshotPath || `screenshot-${Date.now()}.png`;
          const path = ensureSafeScreenshotPath(rawPath);
          await mkdir(dirname(path), { recursive: true });
          await this.page.screenshot({ path });
          if (screenshots) screenshots.push(path);
          break;
        }

        case 'wait':
          if (action.waitFor) {
            const selector = ensureSafeInput(action.selector || '', 'Selector');
            switch (action.waitFor) {
              case 'visible':
                await this.page.waitForSelector(selector, { state: 'visible', timeout: action.timeout });
                break;
              case 'hidden':
                await this.page.waitForSelector(selector, { state: 'hidden', timeout: action.timeout });
                break;
              case 'attached':
                await this.page.waitForSelector(selector, { state: 'attached', timeout: action.timeout });
                break;
              case 'detached':
                await this.page.waitForSelector(selector, { state: 'detached', timeout: action.timeout });
                break;
            }
          } else {
            await this.page.waitForTimeout(action.timeout || 1000);
          }
          break;

        case 'select': {
          const selector = ensureSafeInput(action.selector || '', 'Selector');
          if (action.value) {
            await this.page.selectOption(selector, action.value.slice(0, MAX_INPUT_LENGTH));
          }
          break;
        }

        case 'hover': {
          const selector = ensureSafeInput(action.selector || '', 'Selector');
          await this.page.hover(selector);
          break;
        }

        case 'press': {
          const key = ensureSafeInput(action.key || '', 'Key');
          await this.page.keyboard.press(key);
          break;
        }
      }

      steps.push({
        action,
        status: 'pass',
        duration: Date.now() - stepStart
      });
    } catch (error: any) {
      const message = error?.message || 'Unknown Playwright action error';
      steps.push({
        action,
        status: 'error',
        duration: Date.now() - stepStart,
        error: message
      });
      throw new Error(`Action "${action.type}" failed: ${message}`);
    }
  }

  /**
   * Capture screenshot with consistent naming
   */
  async captureScreenshot(page: any, path: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safePath = ensureSafeScreenshotPath(path);
    const finalPath = safePath.endsWith('.png') ? safePath : `${safePath}-${timestamp}.png`;
    await mkdir(dirname(finalPath), { recursive: true });
    await page.screenshot({ path: finalPath, fullPage: true });
    return finalPath;
  }

  /**
   * Fill form with smart selector mapping
   */
  async fillForm(page: any, data: Record<string, string>): Promise<void> {
    for (const [selector, value] of Object.entries(data)) {
      await page.fill(selector, value);
    }
  }

  /**
   * Wait for state condition (element appear/disappear)
   */
  async waitForState(
    page: any,
    condition: { selector: string; state: 'visible' | 'hidden' | 'attached' | 'detached'; timeout?: number }
  ): Promise<void> {
    await page.waitForSelector(condition.selector, {
      state: condition.state,
      timeout: condition.timeout || this.config.timeout
    });
  }

  /**
   * Get current page object (for advanced usage)
   */
  getPage(): any {
    return this.page;
  }

  /**
   * Close browser and cleanup
   */
  async close(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    this.page = null;
  }

  /**
   * Check if Playwright is available
   */
  static isAvailable(): boolean {
    return playwrightAvailable;
  }
}

/**
 * Convert TestGuide scenarios to Playwright scenarios
 */
export function convertToPlaywrightScenarios(
  testGuide: import('./types.js').TestGuide
): PlaywrightScenario[] {
  const scenarios: PlaywrightScenario[] = [];

  for (const testScenario of testGuide.scenarios) {
    const actions: PlaywrightAction[] = [];

    for (const step of testScenario.steps) {
      // Map test steps to Playwright actions
      // This is a simplified conversion - in practice, you'd need more sophisticated parsing

      if (step.action.startsWith('http')) {
        actions.push({
          type: 'navigate',
          value: step.action
        });
      } else if (step.action.toLowerCase().includes('click')) {
        // Extract selector from step notes or description
        const selector = extractSelector(step);
        if (selector) {
          actions.push({
            type: 'click',
            selector
          });
        }
      } else if (step.action.toLowerCase().includes('fill') || step.action.toLowerCase().includes('enter')) {
        const selector = extractSelector(step);
        const value = extractValue(step);
        if (selector && value) {
          actions.push({
            type: 'fill',
            selector,
            value
          });
        }
      }

      // Take screenshot if required
      if (step.screenshotRequired) {
        actions.push({
          type: 'screenshot',
          screenshotPath: `screenshots/${testScenario.id}-${step.id}.png`
        });
      }
    }

    scenarios.push({
      id: testScenario.id,
      name: testScenario.name,
      actions,
      description: testScenario.description
    });
  }

  return scenarios;
}

/**
 * Extract selector from step (simplified)
 */
function extractSelector(step: import('./types.js').TestStep): string | null {
  // Bound user-provided strings to avoid pathological regex behavior
  const notes = step.notes?.slice(0, MAX_INPUT_LENGTH);
  const action = step.action.slice(0, MAX_INPUT_LENGTH);

  if (notes) {
    const match = /data-testid="([a-zA-Z0-9_-]{1,100})"/.exec(notes);
    if (match) return `[data-testid="${match[1]}"]`;
  }

  const selectorMatch = /'([^'\n\r]{1,200})'/.exec(action) || /"([^"\n\r]{1,200})"/.exec(action);
  if (selectorMatch) {
    return selectorMatch[1];
  }

  return null;
}

/**
 * Extract value from step (simplified)
 */
function extractValue(step: import('./types.js').TestStep): string | null {
  const action = step.action.slice(0, MAX_INPUT_LENGTH);
  const valueMatch = /["']([^"'\n\r]{1,500})["']/.exec(action);
  return valueMatch ? valueMatch[1] : null;
}

/**
 * Generate Playwright test script from scenarios
 */
export function generatePlaywrightScript(
  specId: string,
  scenarios: PlaywrightScenario[]
): string {
  const lines: string[] = [];

  lines.push(`import { test, expect } from '@playwright/test';`);
  lines.push('');
  lines.push(`/**`);
  lines.push(` * Auto-generated Playwright test for ${specId}`);
  lines.push(` * Generated: ${new Date().toISOString()}`);
  lines.push(` */`);
  lines.push('');

  // Generate test cases
  for (const scenario of scenarios) {
    lines.push(`test.describe(${escapeJsString(scenario.name)}, () => {`);
    lines.push('');

    // Generate before hook for navigation
    if (scenario.url) {
      lines.push(`  test.beforeEach(async ({ page }) => {`);
      lines.push(`    await page.goto(${escapeJsString(scenario.url)});`);
      lines.push(`  });`);
      lines.push('');
    }

    lines.push(`  test(${escapeJsString(scenario.description || 'Execute scenario')}, async ({ page }) => {`);

    // Generate actions
    for (const action of scenario.actions) {
      const code = generateActionCode(action, 'page');
      if (code) {
        lines.push(`    ${code}`);
      }
    }

    lines.push(`  });`);
    lines.push(`});`);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Generate code for a Playwright action
 */
function generateActionCode(action: PlaywrightAction, pageVar: string = 'page'): string | null {
  switch (action.type) {
    case 'navigate':
      return action.value ? `await ${pageVar}.goto(${escapeJsString(action.value)});` : null;

    case 'click':
      return action.selector ? `await ${pageVar}.click(${escapeJsString(action.selector)});` : null;

    case 'fill':
      return action.selector
        ? `await ${pageVar}.fill(${escapeJsString(action.selector)}, ${escapeJsString(action.value || '')});`
        : null;

    case 'screenshot':
      if (action.screenshotPath) {
        return `await ${pageVar}.screenshot({ path: ${escapeJsString(action.screenshotPath)} });`;
      }
      return `await ${pageVar}.screenshot();`;

    case 'wait':
      if (action.waitFor && action.selector) {
        return `await ${pageVar}.waitForSelector(${escapeJsString(action.selector)}, { state: ${escapeJsString(action.waitFor)} });`;
      }
      if (action.timeout) {
        return `await ${pageVar}.waitForTimeout(${action.timeout});`;
      }
      return `await ${pageVar}.waitForTimeout(1000);`;

    case 'select':
      return action.selector && action.value
        ? `await ${pageVar}.selectOption(${escapeJsString(action.selector)}, ${escapeJsString(action.value)});`
        : null;

    case 'hover':
      return action.selector ? `await ${pageVar}.hover(${escapeJsString(action.selector)});` : null;

    case 'press':
      return action.key ? `await ${pageVar}.keyboard.press(${escapeJsString(action.key)});` : null;

    default:
      return null;
  }
}
