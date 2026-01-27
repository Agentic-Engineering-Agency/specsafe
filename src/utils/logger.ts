import chalk from 'chalk';

/**
 * Logger utilities with colored output
 */
export const logger = {
  success: (...args: string[]) => console.log(chalk.green('✓'), ...args),
  error: (...args: string[]) => console.error(chalk.red('✗'), ...args),
  warning: (...args: string[]) => console.log(chalk.yellow('⚠'), ...args),
  info: (...args: string[]) => console.log(chalk.blue('ℹ'), ...args),
  debug: (...args: string[]) => {
    if (process.env.DEBUG) {
      console.log(chalk.gray('🔍'), ...args);
    }
  },
  step: (step: number, total: number, message: string) => {
    console.log(chalk.cyan(`[${step}/${total}]`), message);
  },
  header: (message: string) => {
    console.log();
    console.log(chalk.bold.cyan(message));
    console.log(chalk.cyan('─'.repeat(message.length)));
    console.log();
  },
  spec: (name: string, phase: string) => {
    console.log(chalk.bold.blue(name), chalk.dim(`[${phase}]`));
  },
};

export function getTimestamp(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}
