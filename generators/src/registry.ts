import type { ToolAdapter } from './adapters/types.js';
import { adapters as adapterMap } from './adapters/index.js';

export function getAdapter(name: string): ToolAdapter | undefined {
  return adapterMap[name];
}

export function getAllAdapters(): ToolAdapter[] {
  return Object.values(adapterMap);
}
