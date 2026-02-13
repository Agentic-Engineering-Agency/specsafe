/**
 * Shard Command - Analyze and split specs into AI-consumable chunks
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';
import { ShardEngine } from '@specsafe/core';
import type { ShardStrategy, ShardOptions } from '@specsafe/core';

export const shardCommand = new Command('shard')
  .description('Analyze and split specs into AI-consumable chunks')
  .argument('<spec>', 'Path to the spec file')
  .option('-s, --strategy <strategy>', 'Sharding strategy (by-section|by-requirement|by-scenario|auto)')
  .option('-m, --max-tokens <number>', 'Maximum tokens per shard for auto strategy', '2000')
  .option('-o, --output <dir>', 'Output directory for shard files')
  .option('--no-preserve-context', 'Do not preserve context across shards')
  .option('--no-include-metadata', 'Do not include metadata in shards')
  .option('--json', 'Output as JSON')
  .action(async (specPath: string, options) => {
    try {
      // Read spec file
      const resolvedPath = resolve(process.cwd(), specPath);
      
      if (!existsSync(resolvedPath)) {
        console.error(chalk.red(`Error: Spec file not found: ${specPath}`));
        process.exit(1);
      }
      
      const specContent = readFileSync(resolvedPath, 'utf-8');
      
      // Parse options
      const strategy: ShardStrategy = (options.strategy as ShardStrategy) || 'auto';
      const maxTokensPerShard = parseInt(options.maxTokens, 10);
      const preserveContext = options.preserveContext !== false;
      const includeMetadata = options.includeMetadata !== false;
      
      const shardOptions: Partial<ShardOptions> = {
        strategy,
        maxTokensPerShard,
        preserveContext,
        includeMetadata,
      };
      
      // Create engine and shard
      const engine = new ShardEngine(shardOptions);
      const result = engine.shard(specContent, shardOptions);
      
      if (!result.success) {
        console.error(chalk.red('Error sharding spec:'), result.error);
        process.exit(1);
      }
      
      const { plan, durationMs } = result;
      
      // Output results
      if (options.json) {
        console.log(JSON.stringify({
          success: true,
          durationMs,
          plan: {
            ...plan,
            shards: plan.shards.map(s => ({
              id: s.id,
              type: s.type,
              tokenCount: s.tokenCount,
              priority: s.priority,
              sectionName: s.sectionName,
            })),
          },
        }, null, 2));
        return;
      }
      
      // Display analysis
      displayAnalysis(plan);
      
      // Display shard plan
      displayShardPlan(plan);
      
      // Write shards if output directory specified
      if (options.output) {
        await writeShards(plan, options.output, specPath);
      }
      
      console.log(chalk.gray(`\nCompleted in ${durationMs}ms`));
      
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

/**
 * Display analysis results
 */
function displayAnalysis(plan: any): void {
  const { analysis } = plan;
  
  console.log(chalk.bold.blue(`\n📊 Spec Analysis\n`));
  
  console.log(chalk.gray('Complexity:'), chalk.cyan(`${analysis.complexity}/100`));
  console.log(chalk.gray('Total Tokens:'), chalk.cyan(analysis.totalTokens.toLocaleString()));
  console.log(chalk.gray('Sections:'), chalk.cyan(analysis.sectionCount));
  console.log(chalk.gray('Requirements:'), chalk.cyan(analysis.requirementCount));
  console.log(chalk.gray('Scenarios:'), chalk.cyan(analysis.scenarioCount));
  
  console.log(chalk.gray('\nRecommended Strategy:'), chalk.green(analysis.recommendedStrategy));
  console.log(chalk.gray(analysis.recommendationReason));
}

/**
 * Display shard plan
 */
function displayShardPlan(plan: any): void {
  console.log(chalk.bold.blue(`\n📝 Shard Plan\n`));
  
  console.log(chalk.gray('Total Shards:'), chalk.cyan(plan.shards.length));
  console.log(chalk.gray('Estimated Tokens:'), chalk.cyan(plan.estimatedTokens.toLocaleString()));
  
  if (plan.crossReferences.length > 0) {
    console.log(chalk.gray('Cross-References:'), chalk.cyan(plan.crossReferences.length));
  }
  
  console.log(chalk.bold('\nShards:'));
  for (const shard of plan.shards) {
    const tokens = shard.tokenCount || 0;
    const typeColor = shard.type === 'metadata' ? chalk.gray :
                     shard.type === 'requirement' ? chalk.yellow :
                     shard.type === 'scenario' ? chalk.blue : chalk.white;
    
    console.log(`  ${chalk.cyan(shard.id.padEnd(20))} ${typeColor(shard.type.padEnd(12))} ${tokens.toString().padStart(6)} tokens${shard.sectionName ? ` - ${chalk.gray(shard.sectionName)}` : ''}`);
    
    if (shard.dependencies.length > 0) {
      console.log(`    ${chalk.gray('└─ Dependencies:')} ${shard.dependencies.map((d: string) => chalk.gray(d)).join(', ')}`);
    }
  }
  
  if (plan.recommendedOrder.length > 0 && plan.recommendedOrder.length !== plan.shards.length) {
    console.log(chalk.bold('\nRecommended Processing Order:'));
    console.log(`  ${plan.recommendedOrder.map((id: string) => chalk.cyan(id)).join(' → ')}`);
  }
  
  if (plan.crossReferences.length > 0) {
    console.log(chalk.bold('\nCross-References:'));
    for (const ref of plan.crossReferences.slice(0, 10)) {
      console.log(`  ${chalk.cyan(ref.from)} ${chalk.gray('→')} ${chalk.cyan(ref.to)} (${chalk.yellow(ref.type)})`);
    }
    if (plan.crossReferences.length > 10) {
      console.log(`  ${chalk.gray(`... and ${plan.crossReferences.length - 10} more`)}`);
    }
  }
}

/**
 * Write shards to files
 */
async function writeShards(plan: any, outputDir: string, specPath: string): Promise<void> {
  const resolvedDir = resolve(process.cwd(), outputDir);
  
  if (!existsSync(resolvedDir)) {
    mkdirSync(resolvedDir, { recursive: true });
  }
  
  // Extract base name from spec path
  const baseName = specPath.split('/').pop()?.replace(/\.(md|txt|spec)$/, '') || 'spec';
  
  console.log(chalk.bold.blue(`\n💾 Writing Shards\n`));
  console.log(chalk.gray(`Output directory: ${resolvedDir}\n`));
  
  for (const shard of plan.shards) {
    const fileName = `${baseName}-${shard.id}.md`;
    const filePath = resolve(resolvedDir, fileName);
    
    // Build file content
    let content = shard.content;
    
    // Add metadata header if requested
    if (shard.tokenCount && shard.type !== 'metadata') {
      content = `<!--\nShard: ${shard.id}\nType: ${shard.type}\nTokens: ${shard.tokenCount}\nPriority: ${shard.priority}\n` +
               (shard.sectionName ? `Section: ${shard.sectionName}\n` : '') +
               (shard.dependencies.length > 0 ? `Dependencies: ${shard.dependencies.join(', ')}\n` : '') +
               '-->\n\n' + content;
    }
    
    writeFileSync(filePath, content, 'utf-8');
    console.log(chalk.green(`✓`) + ` ${fileName}`);
  }
  
  // Write plan summary
  const summaryPath = resolve(resolvedDir, `${baseName}-plan.json`);
  const summary = {
    specPath,
    generatedAt: new Date().toISOString(),
    plan: {
      ...plan,
      shards: plan.shards.map((s: any) => ({
        id: s.id,
        type: s.type,
        tokenCount: s.tokenCount,
        priority: s.priority,
        sectionName: s.sectionName,
      })),
    },
  };
  
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');
  console.log(chalk.green(`✓`) + ` ${baseName}-plan.json`);
}
