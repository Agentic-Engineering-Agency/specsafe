#!/usr/bin/env node

/**
 * Capsule Command
 * Manage story context capsules for specs
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { input, select, confirm, checkbox } from '@inquirer/prompts';
import { writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import {
  CapsuleManager,
  getTemplate,
  getTemplateChoices,
  isValidTemplateType,
  formatContent,
  CapsuleType,
  TEMPLATE_NAMES,
} from '@specsafe/core';

export const capsuleCommand = new Command('capsule')
  .description('Manage story context capsules for specs')
  .addHelpText('after', `
Examples:
  specsafe capsule add specs/checkout.md --type user-story
  specsafe capsule list specs/checkout.md
  specsafe capsule show specs/checkout.md capsule-abc123
  specsafe capsule export specs/checkout.md
`);

// Add subcommand
capsuleCommand
  .command('add')
  .description('Add a new context capsule to a spec')
  .argument('<spec>', 'Spec ID or path (e.g., specs/checkout.md)')
  .option('-t, --type <type>', 'Capsule type (user-story, technical-context, business-justification, discovery-note)')
  .option('--title <title>', 'Capsule title')
  .option('--author <author>', 'Author name')
  .action(async (
    spec: string,
    options: { type?: string; title?: string; author?: string }
  ) => {
    const manager = new CapsuleManager();

    // Determine capsule type
    let type: CapsuleType;
    if (options.type) {
      if (!isValidTemplateType(options.type)) {
        console.error(chalk.red(`Error: Invalid capsule type: ${options.type}`));
        console.log(chalk.gray(`\nValid types: user-story, technical-context, business-justification, discovery-note`));
        process.exit(1);
      }
      type = options.type;
    } else {
      type = await select({
        message: 'Select capsule type:',
        choices: getTemplateChoices(),
      });
    }

    const template = getTemplate(type);
    console.log(chalk.blue(`\n${template.name}`));
    console.log(chalk.gray(template.description));
    console.log('');

    // Get title
    const title = options.title || await input({
      message: 'Title:',
      validate: (value) => value.trim().length > 0 || 'Title is required',
    });

    // Get author
    const author = options.author || await input({
      message: 'Author:',
      default: process.env.USER || 'unknown',
    });

    // Get content from template fields
    const fields: Record<string, string> = {};
    for (const field of template.fields) {
      const value = await input({
        message: field.label + ':',
        default: field.placeholder || '',
      });
      fields[field.name] = value;
    }

    // Get tags (optional)
    const tagInput = await input({
      message: 'Tags (comma-separated, optional):',
      default: '',
    });
    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    // Confirm
    console.log('');
    console.log(chalk.blue('Preview:'));
    console.log(chalk.cyan(`Type: ${TEMPLATE_NAMES[type]}`));
    console.log(chalk.cyan(`Title: ${title}`));
    console.log(chalk.cyan(`Author: ${author}`));
    if (tags.length > 0) {
      console.log(chalk.cyan(`Tags: ${tags.join(', ')}`));
    }
    console.log('');

    const confirmed = await confirm({
      message: 'Create this capsule?',
      default: true,
    });

    if (!confirmed) {
      console.log(chalk.yellow('Cancelled.'));
      return;
    }

    // Create capsule
    const content = formatContent(type, fields);
    const capsule = await manager.add(spec, {
      type,
      title: title.trim(),
      content,
      author: author.trim(),
      tags,
    });

    console.log('');
    console.log(chalk.green(`✓ Created capsule: ${capsule.id}`));
  });

// List subcommand
capsuleCommand
  .command('list')
  .description('List all capsules for a spec')
  .argument('<spec>', 'Spec ID or path (e.g., specs/checkout.md)')
  .option('-t, --type <types...>', 'Filter by type(s)')
  .option('--tag <tags...>', 'Filter by tag(s)')
  .option('--author <author>', 'Filter by author')
  .action(async (
    spec: string,
    options: { type?: string[]; tag?: string[]; author?: string }
  ) => {
    const manager = new CapsuleManager();

    // Validate types if provided
    if (options.type) {
      for (const t of options.type) {
        if (!isValidTemplateType(t)) {
          console.error(chalk.red(`Error: Invalid capsule type: ${t}`));
          process.exit(1);
        }
      }
    }

    const filter = {
      types: options.type as CapsuleType[] | undefined,
      tags: options.tag,
      author: options.author,
    };

    const capsules = await manager.list(spec, filter);

    if (capsules.length === 0) {
      console.log(chalk.yellow('No capsules found for this spec.'));
      return;
    }

    console.log('');
    console.log(chalk.blue(`Capsules for ${spec}:`));
    console.log(chalk.gray(`Total: ${capsules.length}`));
    console.log('');

    // Group by type
    const byType: Record<string, typeof capsules> = {};
    for (const capsule of capsules) {
      if (!byType[capsule.type]) {
        byType[capsule.type] = [];
      }
      byType[capsule.type].push(capsule);
    }

    for (const [type, typeCapsules] of Object.entries(byType)) {
      console.log(chalk.cyan(`\n[${type}]`));
      for (const capsule of typeCapsules) {
        console.log(`  ${chalk.white(capsule.title)}`);
        console.log(`    ${chalk.gray(capsule.id)}`);
        console.log(`    ${chalk.gray(`by ${capsule.author} on ${new Date(capsule.createdAt).toLocaleDateString()}`)}`);
        if (capsule.tags.length > 0) {
          console.log(`    ${chalk.gray(`tags: ${capsule.tags.join(', ')}`)}`);
        }
      }
    }
  });

// Show subcommand
capsuleCommand
  .command('show')
  .description('View a specific capsule')
  .argument('<spec>', 'Spec ID or path')
  .argument('<capsule-id>', 'Capsule ID')
  .action(async (spec: string, capsuleId: string) => {
    const manager = new CapsuleManager();
    const capsule = await manager.get(spec, capsuleId);

    if (!capsule) {
      console.error(chalk.red(`Error: Capsule not found: ${capsuleId}`));
      process.exit(1);
    }

    console.log('');
    console.log(chalk.cyan.bold(capsule.title));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(`${chalk.blue('Type:')} ${TEMPLATE_NAMES[capsule.type]}`);
    console.log(`${chalk.blue('ID:')} ${capsule.id}`);
    console.log(`${chalk.blue('Author:')} ${capsule.author}`);
    console.log(`${chalk.blue('Created:')} ${new Date(capsule.createdAt).toLocaleString()}`);
    if (capsule.tags.length > 0) {
      console.log(`${chalk.blue('Tags:')} ${capsule.tags.join(', ')}`);
    }
    console.log('');
    console.log(capsule.content);
    console.log('');
  });

// Remove subcommand
capsuleCommand
  .command('remove')
  .description('Remove a capsule')
  .argument('<spec>', 'Spec ID or path')
  .argument('<capsule-id>', 'Capsule ID')
  .option('-y, --yes', 'Skip confirmation')
  .action(async (
    spec: string,
    capsuleId: string,
    options: { yes?: boolean }
  ) => {
    const manager = new CapsuleManager();
    const capsule = await manager.get(spec, capsuleId);

    if (!capsule) {
      console.error(chalk.red(`Error: Capsule not found: ${capsuleId}`));
      process.exit(1);
    }

    let confirmed = options.yes;
    if (!confirmed) {
      confirmed = await confirm({
        message: `Delete "${capsule.title}"?`,
        default: false,
      });
    }

    if (!confirmed) {
      console.log(chalk.yellow('Cancelled.'));
      return;
    }

    const removed = await manager.remove(spec, capsuleId);
    if (removed) {
      console.log(chalk.green(`✓ Removed capsule: ${capsuleId}`));
    } else {
      console.error(chalk.red(`Failed to remove capsule: ${capsuleId}`));
      process.exit(1);
    }
  });

// Export subcommand
capsuleCommand
  .command('export')
  .description('Export capsules to markdown')
  .argument('<spec>', 'Spec ID or path')
  .option('-o, --output <file>', 'Output file (default: prints to stdout)')
  .action(async (
    spec: string,
    options: { output?: string }
  ) => {
    const manager = new CapsuleManager();
    const markdown = await manager.exportToMarkdown(spec);

    if (options.output) {
      await writeFile(options.output, markdown, 'utf-8');
      console.log(chalk.green(`✓ Exported to ${options.output}`));
    } else {
      console.log(markdown);
    }
  });

// Edit subcommand
capsuleCommand
  .command('edit')
  .description('Edit an existing capsule')
  .argument('<spec>', 'Spec ID or path')
  .argument('<capsule-id>', 'Capsule ID')
  .action(async (spec: string, capsuleId: string) => {
    const manager = new CapsuleManager();
    const capsule = await manager.get(spec, capsuleId);

    if (!capsule) {
      console.error(chalk.red(`Error: Capsule not found: ${capsuleId}`));
      process.exit(1);
    }

    console.log(chalk.blue('Editing capsule (leave blank to keep current value)'));
    console.log('');

    const title = await input({
      message: 'Title:',
      default: capsule.title,
    });

    const author = await input({
      message: 'Author:',
      default: capsule.author,
    });

    const tagInput = await input({
      message: 'Tags (comma-separated):',
      default: capsule.tags.join(', '),
    });
    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const content = await input({
      message: 'Content:',
      default: capsule.content,
    });

    const updated = await manager.update(spec, capsuleId, {
      title: title || capsule.title,
      author: author || capsule.author,
      tags,
      content: content || capsule.content,
    });

    if (updated) {
      console.log(chalk.green(`✓ Updated capsule: ${capsuleId}`));
    } else {
      console.error(chalk.red(`Failed to update capsule: ${capsuleId}`));
      process.exit(1);
    }
  });
