/**
 * EARS Parser Tests
 */

import { describe, it, expect } from 'vitest';
import { parseEARSRequirement, hasEARSKeywords, extractRequirements } from '../parser.js';
import type { EARSType } from '../types.js';

describe('EARS Parser', () => {
  describe('parseEARSRequirement', () => {
    describe('Ubiquitous pattern', () => {
      it('should parse basic ubiquitous requirement', () => {
        const text = 'The system shall encrypt all data at rest';
        const result = parseEARSRequirement(text);
        
        expect(result.type).toBe('ubiquitous');
        expect(result.action).toBe('encrypt all data at rest');
        expect(result.confidence).toBeGreaterThan(0.8);
      });

      it('should parse ubiquitous with "must"', () => {
        const text = 'The system must validate all inputs';
        const result = parseEARSRequirement(text);
        
        expect(result.type).toBe('ubiquitous');
        expect(result.action).toBe('validate all inputs');
      });

      it('should parse ubiquitous with "will"', () => {
        const text = 'The application will log all errors';
        const result = parseEARSRequirement(text);
        
        expect(result.type).toBe('ubiquitous');
        expect(result.action).toBe('log all errors');
      });
    });

    describe('Event-driven pattern', () => {
      it('should parse event-driven requirement with "when"', () => {
        const text = 'When user clicks submit, the system shall validate the form';
        const result = parseEARSRequirement(text);
        
        expect(result.type).toBe('event');
        expect(result.event).toBe('user clicks submit');
        expect(result.action).toBe('validate the form');
        expect(result.confidence).toBeGreaterThan(0.9);
      });

      it('should parse event-driven with "upon"', () => {
        const text = 'Upon receiving payment, the system shall send confirmation';
        const result = parseEARSRequirement(text);
        
        expect(result.type).toBe('event');
        expect(result.event).toBe('receiving payment');
        expect(result.action).toBe('send confirmation');
      });

      it('should parse event-driven with "on"', () => {
        const text = 'On user logout, the application must clear session data';
        const result = parseEARSRequirement(text);
        
        expect(result.type).toBe('event');
        expect(result.event).toBe('user logout');
        expect(result.action).toBe('clear session data');
      });
    });

    describe('State-driven pattern', () => {
      it('should parse state-driven requirement with "while"', () => {
        const text = 'While user is authenticated, the system shall display dashboard';
        const result = parseEARSRequirement(text);
        
        expect(result.type).toBe('state');
        expect(result.state).toBe('user is authenticated');
        expect(result.action).toBe('display dashboard');
        expect(result.confidence).toBeGreaterThan(0.9);
      });

      it('should parse state-driven with "during"', () => {
        const text = 'During maintenance mode, the system shall return 503 status';
        const result = parseEARSRequirement(text);
        
        expect(result.type).toBe('state');
        expect(result.state).toBe('maintenance mode');
        expect(result.action).toBe('return 503 status');
      });

      it('should parse state-driven with "as long as"', () => {
        const text = 'As long as battery is low, the system must reduce background tasks';
        const result = parseEARSRequirement(text);
        
        expect(result.type).toBe('state');
        expect(result.state).toBe('battery is low');
        expect(result.action).toBe('reduce background tasks');
      });
    });

    describe('Optional pattern', () => {
      it('should parse optional requirement with "where"', () => {
        const text = 'Where user has admin role, the system shall allow configuration';
        const result = parseEARSRequirement(text);
        
        expect(result.type).toBe('optional');
        expect(result.condition).toBe('user has admin role');
        expect(result.action).toBe('allow configuration');
        expect(result.confidence).toBeGreaterThan(0.9);
      });

      it('should parse optional with "in case"', () => {
        const text = 'In case where GPS is enabled, the system shall track location';
        const result = parseEARSRequirement(text);
        
        expect(result.type).toBe('optional');
        expect(result.condition).toBe('GPS is enabled');
        expect(result.action).toBe('track location');
      });
    });

    describe('Unwanted behavior pattern', () => {
      it('should parse unwanted with "if...then"', () => {
        const text = 'If login fails, then the system shall display error message';
        const result = parseEARSRequirement(text);
        
        expect(result.type).toBe('unwanted');
        expect(result.unwantedCondition).toBe('login fails');
        expect(result.action).toBe('display error message');
        expect(result.confidence).toBeGreaterThan(0.9);
      });

      it('should parse unwanted with "in the event that"', () => {
        const text = 'In the event that connection is lost, the system shall retry request';
        const result = parseEARSRequirement(text);
        
        expect(result.type).toBe('unwanted');
        expect(result.unwantedCondition).toBe('connection is lost');
        expect(result.action).toBe('retry request');
      });

      it('should parse unwanted with "should"', () => {
        const text = 'Should timeout occur, the application will log the error';
        const result = parseEARSRequirement(text);
        
        expect(result.type).toBe('unwanted');
        expect(result.unwantedCondition).toBe('timeout occur');
        expect(result.action).toBe('log the error');
      });
    });

    describe('Complex pattern', () => {
      it('should parse complex with event and state', () => {
        const text = 'When user uploads file, while file size exceeds 10MB, the system shall compress the file';
        const result = parseEARSRequirement(text);
        
        expect(result.type).toBe('complex');
        expect(result.action).toBe('compress the file');
        expect(result.conditions).toBeDefined();
        expect(result.conditions!.length).toBeGreaterThan(1);
      });

      it('should parse complex with multiple conditions', () => {
        const text = 'When user downloads content, where premium subscription is active, the system shall enable offline mode';
        const result = parseEARSRequirement(text);
        
        expect(result.type).toBe('complex');
        expect(result.action).toBe('enable offline mode');
        expect(result.conditions).toBeDefined();
      });
    });

    describe('Diverse subjects', () => {
      it('should parse "the API shall" as ubiquitous', () => {
        const result = parseEARSRequirement('The API shall return JSON responses');
        expect(result.type).toBe('ubiquitous');
        expect(result.action).toBe('return JSON responses');
      });

      it('should parse "the module must" as ubiquitous', () => {
        const result = parseEARSRequirement('The module must validate all inputs');
        expect(result.type).toBe('ubiquitous');
        expect(result.action).toBe('validate all inputs');
      });

      it('should parse "the component shall" as ubiquitous', () => {
        const result = parseEARSRequirement('The component shall render within 100ms');
        expect(result.type).toBe('ubiquitous');
        expect(result.action).toBe('render within 100ms');
      });

      it('should parse "the server shall" in event pattern', () => {
        const result = parseEARSRequirement('When request is received, the server shall process it');
        expect(result.type).toBe('event');
        expect(result.event).toBe('request is received');
        expect(result.action).toBe('process it');
      });

      it('should parse "the platform shall" in state pattern', () => {
        const result = parseEARSRequirement('While under load, the platform shall maintain response times');
        expect(result.type).toBe('state');
        expect(result.action).toBe('maintain response times');
      });
    });

    describe('Complex pattern edge cases', () => {
      it('should not misparse "when" inside condition text', () => {
        // "when the user completes action and when timeout occurs" — two conditions
        const text = 'When the download completes, while the user is on the page, the system shall show notification';
        const result = parseEARSRequirement(text);
        expect(result.type).toBe('complex');
        expect(result.conditions!.length).toBe(2);
        expect(result.conditions![0].value).toBe('the download completes');
        expect(result.conditions![1].value).toBe('the user is on the page');
      });
    });

    describe('Unknown pattern', () => {
      it('should return unknown for non-EARS text', () => {
        const text = 'Users like fast applications';
        const result = parseEARSRequirement(text);
        
        expect(result.type).toBe('unknown');
        expect(result.confidence).toBe(0);
      });

      it('should return unknown for incomplete requirement', () => {
        const text = 'When user clicks button';
        const result = parseEARSRequirement(text);
        
        expect(result.type).toBe('unknown');
      });
    });
  });

  describe('hasEARSKeywords', () => {
    it('should detect EARS keywords', () => {
      expect(hasEARSKeywords('The system shall validate')).toBe(true);
      expect(hasEARSKeywords('When user clicks, the system shall respond')).toBe(true);
      expect(hasEARSKeywords('While processing, the system shall show progress')).toBe(true);
      expect(hasEARSKeywords('Where condition exists, the system shall act')).toBe(true);
      expect(hasEARSKeywords('If error then the system shall handle it')).toBe(true);
      expect(hasEARSKeywords('System must process')).toBe(true);
      expect(hasEARSKeywords('The API shall return 200')).toBe(true);
      expect(hasEARSKeywords('The module will handle requests')).toBe(true);
    });

    it('should not detect keywords in non-EARS text', () => {
      expect(hasEARSKeywords('This is a description')).toBe(false);
      expect(hasEARSKeywords('Users want speed')).toBe(false);
      // Bare trigger keywords without modal verbs should not match
      expect(hasEARSKeywords('When user clicks')).toBe(false);
      expect(hasEARSKeywords('While processing')).toBe(false);
      // Bare "will" without subject pattern should not match
      expect(hasEARSKeywords('This will be fun')).toBe(false);
      // "if...then" without modal verb should not match
      expect(hasEARSKeywords('If error then handle')).toBe(false);
    });
  });

  describe('extractRequirements', () => {
    it('should extract requirements from text block', () => {
      const text = `
# Requirements

The system shall encrypt data
When user logs in, the system shall create session
- While connected, the system shall sync data
Some other text
Where premium enabled, the system shall unlock features
      `.trim();
      
      const requirements = extractRequirements(text);
      
      expect(requirements.length).toBeGreaterThan(0);
      expect(requirements.some(r => r.includes('encrypt data'))).toBe(true);
      expect(requirements.some(r => r.includes('create session'))).toBe(true);
      expect(requirements.some(r => r.includes('sync data'))).toBe(true);
    });

    it('should extract requirements with diverse subjects', () => {
      const text = `
The API shall return JSON responses
The module must validate input parameters
The component will render correctly
The server shall handle 1000 concurrent connections
      `.trim();
      
      const requirements = extractRequirements(text);
      expect(requirements.length).toBe(4);
      expect(requirements.some(r => r.includes('return JSON'))).toBe(true);
      expect(requirements.some(r => r.includes('handle 1000'))).toBe(true);
    });

    it('should handle bullet points', () => {
      const text = `
- The system shall validate inputs
* When error occurs, the system shall log
• While processing, the system shall show progress
      `.trim();
      
      const requirements = extractRequirements(text);
      
      expect(requirements.length).toBe(3);
      expect(requirements[0]).not.toMatch(/^[-*•]/);
    });
  });
});
