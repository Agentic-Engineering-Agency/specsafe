import type { Extension, ExtensionContext, ExtensionResult } from '../types.js';

/**
 * OWASP Security Extension
 * Checks specs for security requirements and flags missing considerations
 */
export const owaspExtension: Extension = {
  id: 'owasp-security',
  name: 'OWASP Security Checker',
  description: 'Validates spec against OWASP security best practices',
  version: '1.0.0',
  author: 'SpecSafe Team',
  enabled: true,
  hooks: {
    'post-validate': (context: ExtensionContext): ExtensionResult => {
      const { spec } = context;
      const warnings: string[] = [];
      const suggestions: string[] = [];
      const errors: string[] = [];

      // Convert spec description and requirements to lowercase for checking
      const descLower = (spec.description || '').toLowerCase();
      const reqTexts = Array.isArray(spec.requirements) 
        ? spec.requirements.map(r => 
            `${r.text || ''} ${(r.scenarios || []).map(s => s.when).join(' ')}`.toLowerCase()
          )
        : [];
      const allText = [descLower, ...reqTexts].join(' ');

      // Security keywords to check
      const securityChecks = {
        authentication: ['authentication', 'login', 'signin', 'auth'],
        authorization: ['authorization', 'permission', 'access control', 'role'],
        inputValidation: ['validation', 'sanitize', 'input', 'escape'],
        encryption: ['encryption', 'encrypt', 'ssl', 'tls', 'https'],
        dataProtection: ['data protection', 'privacy', 'gdpr', 'sensitive data'],
      };

      let foundCount = 0;

      // Check for each security aspect
      for (const [aspect, keywords] of Object.entries(securityChecks)) {
        const found = keywords.some(keyword => allText.includes(keyword));
        if (!found) {
          warnings.push(`No mention of ${aspect} found`);
          suggestions.push(`Consider adding ${aspect} requirements`);
        } else {
          foundCount++;
        }
      }

      // Determine result
      const totalChecks = Object.keys(securityChecks).length;
      const coverage = (foundCount / totalChecks) * 100;

      let message = `Security coverage: ${foundCount}/${totalChecks} aspects (${Math.round(coverage)}%)`;
      let success = true;

      if (foundCount === 0) {
        errors.push('No security considerations found in spec');
        message = '⚠️ Critical: No security requirements detected';
        success = false;
      } else if (foundCount < 3) {
        warnings.push('Low security coverage detected');
        message = `⚠️ Warning: ${message}`;
      } else {
        message = `✓ ${message}`;
      }

      return {
        success,
        message,
        warnings,
        suggestions,
        errors,
        data: {
          coverage,
          foundCount,
          totalChecks,
        },
      };
    },
  },
};
