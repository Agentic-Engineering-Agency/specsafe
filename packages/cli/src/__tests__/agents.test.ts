import { describe, it, expect } from 'vitest';
import {
  getSupportedAgents,
  getAgent,
  isValidAgent,
  getAgentDefinition,
  AGENT_DEFINITIONS,
} from '@specsafe/core';

describe('Agent System', () => {
  describe('Agent Registry', () => {
    it('should return list of supported agents', () => {
      const agents = getSupportedAgents();
      
      expect(agents).toBeInstanceOf(Array);
      expect(agents.length).toBeGreaterThan(0);
      expect(agents).toContain('claude-code');
      expect(agents).toContain('cursor');
      expect(agents).toContain('copilot');
    });

    it('should validate agent IDs', () => {
      expect(isValidAgent('claude-code')).toBe(true);
      expect(isValidAgent('cursor')).toBe(true);
      expect(isValidAgent('invalid-agent')).toBe(false);
    });

    it('should get agent definition by ID', () => {
      const claudeDef = getAgentDefinition('claude-code');
      
      expect(claudeDef).toBeDefined();
      expect(claudeDef?.id).toBe('claude-code');
      expect(claudeDef?.name).toBe('Claude Code');
      expect(claudeDef?.fileExtension).toBe('.md');
    });

    it('should get registered agent with adapter', () => {
      const claudeEntry = getAgent('claude-code');
      
      expect(claudeEntry).toBeDefined();
      expect(claudeEntry?.id).toBe('claude-code');
      expect(claudeEntry?.adapter).toBeDefined();
      expect(typeof claudeEntry?.adapter.generateConfig).toBe('function');
    });
  });

  describe('Agent Definitions', () => {
    it('should have required fields for all agents', () => {
      for (const agent of AGENT_DEFINITIONS) {
        expect(agent.id).toBeDefined();
        expect(agent.name).toBeDefined();
        expect(agent.fileExtension).toBeDefined();
        expect(agent.commandFormat).toBeDefined();
        expect(agent.detectionFiles).toBeInstanceOf(Array);
        expect(agent.detectionFiles.length).toBeGreaterThan(0);
      }
    });

    it('should have unique agent IDs', () => {
      const ids = AGENT_DEFINITIONS.map((a) => a.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should include all required agents', () => {
      const requiredAgents = [
        'claude-code',
        'cursor',
        'copilot',
        'gemini-cli',
        'opencode',
        'windsurf',
        'continue',
        'crush',
        'codex',
        'qwen-code',
      ];

      const agentIds = AGENT_DEFINITIONS.map((a) => a.id);
      
      for (const required of requiredAgents) {
        expect(agentIds).toContain(required);
      }
    });
  });

  describe('Agent Adapters', () => {
    it('should have adapters for main agents', () => {
      const mainAgents = ['claude-code', 'cursor', 'copilot', 'gemini-cli', 'opencode'];
      
      for (const agentId of mainAgents) {
        const entry = getAgent(agentId);
        expect(entry).toBeDefined();
        expect(entry?.adapter).toBeDefined();
      }
    });

    it('should generate config files', async () => {
      const claudeEntry = getAgent('claude-code');
      expect(claudeEntry).toBeDefined();
      
      const files = await claudeEntry!.adapter.generateConfig('/tmp/test', {});
      
      expect(files).toBeInstanceOf(Array);
      expect(files.length).toBeGreaterThan(0);
      expect(files[0]).toHaveProperty('path');
      expect(files[0]).toHaveProperty('content');
    });

    it('should generate command files', async () => {
      const claudeEntry = getAgent('claude-code');
      expect(claudeEntry).toBeDefined();
      
      const files = await claudeEntry!.adapter.generateCommands('/tmp/test', {});
      
      expect(files).toBeInstanceOf(Array);
      expect(files.length).toBeGreaterThan(0);
    });

    it('should provide usage instructions', () => {
      const claudeEntry = getAgent('claude-code');
      expect(claudeEntry).toBeDefined();
      
      const instructions = claudeEntry!.adapter.getInstructions();
      
      expect(instructions).toBeDefined();
      expect(typeof instructions).toBe('string');
      expect(instructions.length).toBeGreaterThan(0);
    });
  });

  describe('File Generation', () => {
    it('should generate valid file paths for Claude Code', async () => {
      const entry = getAgent('claude-code');
      const configFiles = await entry!.adapter.generateConfig('/tmp/test');
      
      expect(configFiles.some((f) => f.path === 'CLAUDE.md')).toBe(true);
    });

    it('should generate valid file paths for Cursor', async () => {
      const entry = getAgent('cursor');
      const configFiles = await entry!.adapter.generateConfig('/tmp/test');
      
      expect(configFiles.some((f) => f.path === '.cursorrules')).toBe(true);
    });

    it('should generate valid file paths for Copilot', async () => {
      const entry = getAgent('copilot');
      const configFiles = await entry!.adapter.generateConfig('/tmp/test');
      
      expect(configFiles.some((f) => f.path === '.github/copilot-instructions.md')).toBe(true);
    });

    it('should generate command files for Claude Code', async () => {
      const entry = getAgent('claude-code');
      const commandFiles = await entry!.adapter.generateCommands('/tmp/test');
      
      const commandNames = commandFiles.map((f) => f.path);
      expect(commandNames.some((p) => p.includes('specsafe'))).toBe(true);
      expect(commandNames.some((p) => p.includes('.claude/skills'))).toBe(true);
    });
  });

  describe('Command Format', () => {
    it('should have correct command format for each agent', () => {
      const formats: Record<string, string> = {
        'claude-code': '/command-name',
        'cursor': '@command',
        'copilot': '@workspace /command',
        'gemini-cli': '/command',
        'opencode': '/command',
      };

      for (const [agentId, expectedFormat] of Object.entries(formats)) {
        const def = getAgentDefinition(agentId);
        expect(def?.commandFormat).toBe(expectedFormat);
      }
    });
  });
});
