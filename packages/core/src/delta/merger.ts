/**
 * Semantic Merger
 * Applies delta specs to base specs at the requirement level
 */

import type { DeltaSpec, MergeResult, MergeConflict, MergeStats } from './types.js';

export class SemanticMerger {
  merge(baseContent: string, deltaSpec: DeltaSpec): MergeResult {
    const conflicts: MergeConflict[] = [];
    const stats: MergeStats = { added: 0, modified: 0, removed: 0, conflicts: 0 };
    let content = baseContent;

    const requirements = this.parseRequirements(content);
    const requirementMap = new Map(requirements.map(r => [r.id, r]));

    for (const id of deltaSpec.removed) {
      if (!requirementMap.has(id)) {
        conflicts.push({ type: 'requirement_not_found', requirementId: id, message: `Cannot remove requirement ${id}: not found in base spec` });
        stats.conflicts++;
        continue;
      }
      const req = requirementMap.get(id)!;
      content = this.removeRequirementBlock(content, req);
      requirementMap.delete(id);
      stats.removed++;
    }

    for (const modReq of deltaSpec.modified) {
      if (!requirementMap.has(modReq.id)) {
        conflicts.push({ type: 'requirement_not_found', requirementId: modReq.id, message: `Cannot modify requirement ${modReq.id}: not found in base spec` });
        stats.conflicts++;
        continue;
      }
      const oldReq = requirementMap.get(modReq.id)!;
      const newReqBlock = this.formatRequirement(modReq);
      content = this.replaceRequirementBlock(content, oldReq, newReqBlock);
      requirementMap.set(modReq.id, { id: modReq.id, text: modReq.text, priority: modReq.priority || oldReq.priority, startLine: oldReq.startLine, endLine: oldReq.endLine });
      stats.modified++;
    }

    for (const addReq of deltaSpec.added) {
      if (requirementMap.has(addReq.id)) {
        conflicts.push({ type: 'duplicate_add', requirementId: addReq.id, message: `Cannot add requirement ${addReq.id}: already exists in base spec` });
        stats.conflicts++;
        continue;
      }
      const newReqBlock = this.formatRequirement(addReq);
      content = this.insertRequirementBlock(content, newReqBlock);
      stats.added++;
    }

    return { success: conflicts.length === 0, content, conflicts, stats };
  }

  private parseRequirements(content: string): Array<{ id: string; text: string; priority?: string; startLine: number; endLine: number; }> {
    const lines = content.split('\n');
    const requirements: Array<{ id: string; text: string; priority?: string; startLine: number; endLine: number; }> = [];
    let inRequirementsSection = false;
    let currentReq: any = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/^##\s+(Functional\s+)?Requirements?/i)) {
        inRequirementsSection = true;
        continue;
      }
      if (inRequirementsSection && line.match(/^##\s+/) && !line.match(/^##\s+(Functional\s+)?Requirements?/i)) {
        if (currentReq) {
          currentReq.endLine = i - 1;
          requirements.push(currentReq);
          currentReq = null;
        }
        inRequirementsSection = false;
        continue;
      }
      if (!inRequirementsSection) continue;

      const tableMatch = line.match(/\|\s*([A-Z][A-Z0-9-]+)\s*\|([^|]+)\|\s*(P[012])?\s*\|/);
      if (tableMatch) {
        if (currentReq) {
          currentReq.endLine = i - 1;
          requirements.push(currentReq);
        }
        currentReq = { id: tableMatch[1], text: tableMatch[2].trim(), priority: tableMatch[3], startLine: i, endLine: i };
        continue;
      }

      const headerMatch = line.match(/^###\s+([A-Z][A-Z0-9-]+)|^\*\*([A-Z][A-Z0-9-]+):/);
      if (headerMatch) {
        if (currentReq) {
          currentReq.endLine = i - 1;
          requirements.push(currentReq);
        }
        currentReq = { id: headerMatch[1] || headerMatch[2], text: '', startLine: i, endLine: i };
        continue;
      }

      if (currentReq && line.trim()) {
        currentReq.text = (currentReq.text + ' ' + line.trim()).trim();
        currentReq.endLine = i;
      }
    }

    if (currentReq) requirements.push(currentReq);
    return requirements;
  }

  private formatRequirement(req: { id: string; text: string; priority?: string; scenarios?: string[] }): string {
    let block = `| ${req.id} | ${req.text} | ${req.priority || 'P1'} | |\n`;
    if (req.scenarios && req.scenarios.length > 0) {
      block += `\n**Scenarios:**\n`;
      for (const scenario of req.scenarios) block += `- ${scenario}\n`;
    }
    return block;
  }

  private removeRequirementBlock(content: string, req: { startLine: number; endLine: number }): string {
    const lines = content.split('\n');
    lines.splice(req.startLine, req.endLine - req.startLine + 1);
    return lines.join('\n');
  }

  private replaceRequirementBlock(content: string, oldReq: { startLine: number; endLine: number }, newBlock: string): string {
    const lines = content.split('\n');
    const newLines = newBlock.split('\n').filter(l => l);
    lines.splice(oldReq.startLine, oldReq.endLine - oldReq.startLine + 1, ...newLines);
    return lines.join('\n');
  }

  private insertRequirementBlock(content: string, newBlock: string): string {
    const lines = content.split('\n');
    let insertIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^##\s+(Functional\s+)?Requirements?/i)) {
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].match(/^##\s+/) && !lines[j].match(/^##\s+(Functional\s+)?Requirements?/i)) {
            insertIndex = j - 1;
            break;
          }
        }
        break;
      }
    }
    if (insertIndex === -1) return content + '\n' + newBlock;
    lines.splice(insertIndex + 1, 0, newBlock);
    return lines.join('\n');
  }

  diff(baseContent: string, deltaSpec: DeltaSpec): string {
    let diff = `# Delta Spec Preview: ${deltaSpec.id}\n\n**Base Spec:** ${deltaSpec.baseSpecId}\n**Description:** ${deltaSpec.description}\n\n`;
    if (deltaSpec.added.length > 0) {
      diff += `## Added Requirements (${deltaSpec.added.length})\n\n`;
      for (const req of deltaSpec.added) diff += `+ ${req.id}: ${req.text}\n`;
      diff += '\n';
    }
    if (deltaSpec.modified.length > 0) {
      diff += `## Modified Requirements (${deltaSpec.modified.length})\n\n`;
      for (const req of deltaSpec.modified) {
        diff += `~ ${req.id}: ${req.text}\n`;
        if (req.oldText) diff += `  (was: ${req.oldText})\n`;
      }
      diff += '\n';
    }
    if (deltaSpec.removed.length > 0) {
      diff += `## Removed Requirements (${deltaSpec.removed.length})\n\n`;
      for (const id of deltaSpec.removed) diff += `- ${id}\n`;
      diff += '\n';
    }
    return diff;
  }
}
