/**
 * Playwright Integration for E2E Testing
 * Automated browser testing with Playwright
 */

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
        error: error.message,
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

    try {
      switch (action.type) {
        case 'navigate':
          await this.page.goto(action.value!);
          break;

        case 'click':
          if (!action.selector) throw new Error('Selector required for click action');
          await this.page.click(action.selector);
          break;

        case 'fill':
          if (!action.selector) throw new Error('Selector required for fill action');
          await this.page.fill(action.selector, action.value || '');
          break;

        case 'screenshot':
          const path = action.screenshotPath || `screenshot-${Date.now()}.png`;
          await this.page.screenshot({ path });
          if (screenshots) screenshots.push(path);
          break;

        case 'wait':
          if (action.waitFor) {
            if (!action.selector) throw new Error('Selector required for wait action with waitFor state');
            switch (action.waitFor) {
              case 'visible':
                await this.page.waitForSelector(action.selector, { state: 'visible', timeout: action.timeout });
                break;
              case 'hidden':
                await this.page.waitForSelector(action.selector, { state: 'hidden', timeout: action.timeout });
                break;
              case 'attached':
                await this.page.waitForSelector(action.selector, { state: 'attached', timeout: action.timeout });
                break;
              case 'detached':
                await this.page.waitForSelector(action.selector, { state: 'detached', timeout: action.timeout });
                break;
            }
          } else {
            await this.page.waitForTimeout(action.timeout || 1000);
          }
          break;

        case 'select':
          if (!action.selector) throw new Error('Selector required for select action');
          if (action.value) {
            await this.page.selectOption(action.selector, action.value);
          }
          break;

        case 'hover':
          if (!action.selector) throw new Error('Selector required for hover action');
          await this.page.hover(action.selector);
          break;

        case 'press':
          if (!action.key) throw new Error('Key required for press action');
          await this.page.keyboard.press(action.key);
          break;
      }

      steps.push({
        action,
        status: 'pass',
        duration: Date.now() - stepStart
      });
    } catch (error: any) {
      steps.push({
        action,
        status: 'error',
        duration: Date.now() - stepStart,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Capture screenshot with consistent naming
   */
  async captureScreenshot(page: any, path: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const finalPath = path.endsWith('.png') ? path : `${path}-${timestamp}.png`;
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
  // Look for data-testid or other patterns in notes/expected
  if (step.notes) {
    const match = step.notes.match(/data-testid="([^"]+)"/);
    if (match) return `[data-testid="${match[1]}"]`;
  }

  // Look for quoted text that might be a selector
  const selectorMatch = step.action.match(/'([^']+)'/) || step.action.match(/"([^"]+)"/);
  if (selectorMatch) {
    return selectorMatch[1];
  }

  return null;
}

/**
 * Extract value from step (simplified)
 */
function extractValue(step: import('./types.js').TestStep): string | null {
  const valueMatch = step.action.match(/["']([^"']+)["']/);
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
    lines.push(`test.describe('${scenario.name}', () => {`);
    lines.push('');

    // Generate before hook for navigation
    if (scenario.url) {
      lines.push(`  test.beforeEach(async ({ page }) => {`);
      lines.push(`    await page.goto('${scenario.url}');`);
      lines.push(`  });`);
      lines.push('');
    }

    lines.push(`  test('${scenario.description || 'Execute scenario'}', async ({ page }) => {`);

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
      return `await ${pageVar}.goto('${action.value}');`;

    case 'click':
      return `await ${pageVar}.click('${action.selector}');`;

    case 'fill':
      return `await ${pageVar}.fill('${action.selector}', '${action.value}');`;

    case 'screenshot':
      if (action.screenshotPath) {
        return `await ${pageVar}.screenshot({ path: '${action.screenshotPath}' });`;
      }
      return `await ${pageVar}.screenshot();`;

    case 'wait':
      if (action.waitFor && action.selector) {
        return `await ${pageVar}.waitForSelector('${action.selector}', { state: '${action.waitFor}' });`;
      }
      if (action.timeout) {
        return `await ${pageVar}.waitForTimeout(${action.timeout});`;
      }
      return `await ${pageVar}.waitForTimeout(1000);`;

    case 'select':
      return `await ${pageVar}.selectOption('${action.selector}', '${action.value}');`;

    case 'hover':
      return `await ${pageVar}.hover('${action.selector}');`;

    case 'press':
      return `await ${pageVar}.keyboard.press('${action.key}');`;

    default:
      return null;
  }
}
