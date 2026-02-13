/**
 * Self-Validation Checklists
 */

import type { Checklist, ChecklistItem, ChecklistResult, ChecklistItemFailure } from './types.js';

const CHECKLIST_VALIDATORS: Record<string, (spec: string) => ChecklistResult> = {
  'acceptance-criteria-testable': validateAcceptanceCriteriaTestable,
  'security-reqs-reference-standards': validateSecurityStandards,
  'performance-targets-quantified': validatePerformanceTargets,
};

export function parseChecklists(template: string): Checklist[] {
  const checklists: Checklist[] = [];
  const lines = template.split('\n');
  const checklistRegex = /<!--\s*@checklist:\s*([a-z-]+)\s*-->/;
  
  lines.forEach((line, index) => {
    const match = line.match(checklistRegex);
    if (match) {
      const [, checklistId] = match;
      const checklistDef = getChecklistDefinition(checklistId);
      if (checklistDef) {
        checklists.push({ ...checklistDef, line: index + 1 });
      }
    }
  });
  
  return checklists;
}

export function evaluateChecklists(spec: string, checklists: Checklist[]): ChecklistResult[] {
  return checklists.map(checklist => {
    const validator = CHECKLIST_VALIDATORS[checklist.id];
    if (validator) {
      return validator(spec);
    }
    return { checklist, passed: [], failed: [], skipped: checklist.items, valid: true, score: 0 };
  });
}

function getChecklistDefinition(id: string): Checklist | null {
  switch (id) {
    case 'acceptance-criteria-testable':
      return {
        id,
        name: 'Acceptance Criteria Testability',
        items: [
          { id: 'ac-1', description: 'All requirements have Given/When/Then scenarios', required: true, category: 'testability' },
          { id: 'ac-2', description: 'Scenarios are specific and measurable', required: true, category: 'testability' },
          { id: 'ac-3', description: 'Expected outcomes are clearly defined', required: true, category: 'testability' },
        ],
      };
    
    case 'security-reqs-reference-standards':
      return {
        id,
        name: 'Security Requirements Standards',
        items: [
          { id: 'sec-1', description: 'Security requirements reference industry standards (OWASP, NIST, etc.)', required: true, category: 'security' },
          { id: 'sec-2', description: 'Encryption standards are specified (AES-256, TLS 1.3, etc.)', required: true, category: 'security' },
          { id: 'sec-3', description: 'Authentication and authorization mechanisms are defined', required: true, category: 'security' },
        ],
      };
    
    case 'performance-targets-quantified':
      return {
        id,
        name: 'Performance Targets Quantified',
        items: [
          { id: 'perf-1', description: 'Response time targets include specific numbers (e.g., < 200ms)', required: true, category: 'performance' },
          { id: 'perf-2', description: 'Throughput requirements specify requests/second or similar', required: true, category: 'performance' },
          { id: 'perf-3', description: 'Resource limits are quantified (CPU, memory, storage)', required: false, category: 'performance' },
        ],
      };
    
    default:
      return null;
  }
}

function validateAcceptanceCriteriaTestable(spec: string): ChecklistResult {
  const checklist = getChecklistDefinition('acceptance-criteria-testable')!;
  const passed: ChecklistItem[] = [];
  const failed: ChecklistItemFailure[] = [];
  
  const hasScenarios = /(Given|When|Then)/i.test(spec);
  if (hasScenarios) passed.push(checklist.items[0]);
  else failed.push({ item: checklist.items[0], reason: 'No Given/When/Then scenarios found' });
  
  const vagueWords = /(properly|correctly|appropriate)/i;
  if (!vagueWords.test(spec) && hasScenarios) passed.push(checklist.items[1]);
  else if (hasScenarios) failed.push({ item: checklist.items[1], reason: 'Scenarios contain vague terms' });
  else failed.push({ item: checklist.items[1], reason: 'Cannot validate scenario specificity without scenarios' });
  
  const thenStatements = spec.match(/Then\s+(.+)/gi);
  if (thenStatements?.length) passed.push(checklist.items[2]);
  else if (hasScenarios) failed.push({ item: checklist.items[2], reason: 'Then statements not clearly defined' });
  else failed.push({ item: checklist.items[2], reason: 'No Then statements found without scenarios' });
  
  return { checklist, passed, failed, skipped: [], valid: !failed.length, score: Math.round((passed.length / checklist.items.length) * 100) };
}

function validateSecurityStandards(spec: string): ChecklistResult {
  const checklist = getChecklistDefinition('security-reqs-reference-standards')!;
  const passed: ChecklistItem[] = [];
  const failed: ChecklistItemFailure[] = [];
  
  if (/(OWASP|NIST|ISO|PCI DSS|GDPR)/i.test(spec)) passed.push(checklist.items[0]);
  else failed.push({ item: checklist.items[0], reason: 'No references to security standards found' });
  
  if (/(AES-256|TLS 1\.3|RSA|SHA-256)/i.test(spec)) passed.push(checklist.items[1]);
  else failed.push({ item: checklist.items[1], reason: 'No specific encryption standards mentioned' });
  
  if (/(authentication|authorization|OAuth|JWT|2FA|MFA)/i.test(spec)) passed.push(checklist.items[2]);
  else failed.push({ item: checklist.items[2], reason: 'Authentication/authorization mechanisms not defined' });
  
  return { checklist, passed, failed, skipped: [], valid: !failed.length, score: Math.round((passed.length / checklist.items.length) * 100) };
}

function validatePerformanceTargets(spec: string): ChecklistResult {
  const checklist = getChecklistDefinition('performance-targets-quantified')!;
  const passed: ChecklistItem[] = [];
  const failed: ChecklistItemFailure[] = [];
  
  if (/(<|≤|under)\s*\d+\s*(ms|second)/i.test(spec)) passed.push(checklist.items[0]);
  else failed.push({ item: checklist.items[0], reason: 'No quantified response time targets found' });
  
  if (/\d+\s*(request|req|transaction)s?\s*(per|\/)\s*(second|minute)/i.test(spec)) passed.push(checklist.items[1]);
  else failed.push({ item: checklist.items[1], reason: 'No throughput requirements specified' });
  
  if (/\d+\s*(GB|MB|CPU|core)/i.test(spec)) passed.push(checklist.items[2]);
  else failed.push({ item: checklist.items[2], reason: 'No resource limit quantifications found' });
  
  return { checklist, passed, failed, skipped: [], valid: !failed.filter(f => f.item.required).length, score: Math.round((passed.length / checklist.items.length) * 100) };
}
