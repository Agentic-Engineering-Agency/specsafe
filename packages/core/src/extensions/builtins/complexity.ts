import type { Extension, ExtensionContext, ExtensionResult } from '../types.js';

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Complexity Scorer Extension
 * Analyzes spec complexity based on various factors
 */
export const complexityExtension: Extension = {
  id: 'complexity-scorer',
  name: 'Complexity Scorer',
  description: 'Analyzes and scores spec complexity',
  version: '1.0.0',
  author: 'SpecSafe Team',
  enabled: true,
  hooks: {
    'post-validate': (context: ExtensionContext): ExtensionResult => {
      const { spec } = context;
      const warnings: string[] = [];
      const suggestions: string[] = [];

      // Calculate complexity factors
      const requirementCount = spec.requirements.length;
      const scenarioCount = spec.requirements.reduce(
        (sum, req) => sum + (req.scenarios?.length || 0),
        0
      );
      
      // Count integration points (mentions of external systems)
      const descLower = spec.description.toLowerCase();
      const integrationKeywords = ['api', 'service', 'integration', 'external', 'third-party', 'webhook'];
      const integrationPoints = integrationKeywords.filter(keyword => 
        new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'i').test(descLower)
      ).length;

      // Count dependencies (mentions of other systems/modules)
      const dependencyKeywords = ['depends', 'requires', 'dependency', 'module', 'component'];
      const dependencies = dependencyKeywords.filter(keyword => 
        new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'i').test(descLower)
      ).length;

      // Calculate complexity score (0-100)
      let complexityScore = 0;
      
      // Requirements contribute up to 40 points
      complexityScore += Math.min(requirementCount * 4, 40);
      
      // Scenarios contribute up to 30 points
      complexityScore += Math.min(scenarioCount * 2, 30);
      
      // Integration points contribute up to 15 points
      complexityScore += Math.min(integrationPoints * 5, 15);
      
      // Dependencies contribute up to 15 points
      complexityScore += Math.min(dependencies * 5, 15);

      // Determine complexity level
      let complexityLevel: 'low' | 'medium' | 'high' | 'very-high';
      if (complexityScore < 25) {
        complexityLevel = 'low';
      } else if (complexityScore < 50) {
        complexityLevel = 'medium';
      } else if (complexityScore < 75) {
        complexityLevel = 'high';
      } else {
        complexityLevel = 'very-high';
      }

      // Generate warnings and suggestions
      if (requirementCount > 10) {
        warnings.push(`High requirement count: ${requirementCount}`);
        suggestions.push('Consider breaking this spec into smaller, focused specs');
      }

      if (scenarioCount > 20) {
        warnings.push(`High scenario count: ${scenarioCount}`);
        suggestions.push('Review if all scenarios are necessary or can be simplified');
      }

      if (integrationPoints > 3) {
        warnings.push(`Many integration points detected: ${integrationPoints}`);
        suggestions.push('Consider documenting integration architecture separately');
      }

      if (complexityLevel === 'very-high') {
        warnings.push('Very high complexity detected');
        suggestions.push('Break this spec into multiple smaller specs for better maintainability');
      }

      const message = `Complexity: ${complexityLevel} (score: ${complexityScore}/100)`;
      const emoji = complexityLevel === 'low' ? '✓' : 
                    complexityLevel === 'medium' ? '⚡' :
                    complexityLevel === 'high' ? '⚠️' : '🔴';

      return {
        success: complexityLevel !== 'very-high',
        message: `${emoji} ${message}`,
        warnings,
        suggestions,
        data: {
          complexityScore,
          complexityLevel,
          metrics: {
            requirementCount,
            scenarioCount,
            integrationPoints,
            dependencies,
          },
        },
      };
    },
  },
};
