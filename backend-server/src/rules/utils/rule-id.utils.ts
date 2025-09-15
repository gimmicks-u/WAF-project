import { Rule } from '../entities/rule.entity';

export function calculateUserIdBlock(userId: string): [number, number] {
  // Reserve 1000 ids per user within a large custom range starting at 1200000
  // Block = [1200000 + userId*1000, 1200000 + userId*1000 + 999]
  let uid = 0;
  try {
    uid = Number(BigInt(userId));
  } catch {
    // hash fallback for non-numeric id
    uid = hashString(userId) % 10000; // avoid overflow
  }
  const start = 1200000 + uid * 1000;
  return [start, start + 999];
}

export function extractRuleId(content: string): number | null {
  const m = content.match(/\bid\s*:\s*(\d+)/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

export function injectRuleId(content: string, id: number): string {
  if (/\bid\s*:\s*\d+/i.test(content)) {
    return content.replace(/(\bid\s*:)\s*\d+/i, `$1 ${id}`);
  }
  // Try to append into the last quoted actions string
  // Example: SecRule ... "phase:1,deny,status:403,msg:'..'"
  const quoteMatches = [...content.matchAll(/"([^"]*)"/g)];
  if (quoteMatches.length > 0) {
    const last = quoteMatches[quoteMatches.length - 1];
    const full = last[0];
    const inner = last[1];
    const hasTrailingComma = inner.trim().length > 0 && !inner.trim().endsWith(',');
    const sep = inner.trim().length === 0 ? '' : ',';
    const injectedInner = `${inner}${sep}id:${id}`;
    return content.replace(full, `"${injectedInner}"`);
  }
  // Fallback: append a new actions string
  return `${content} "id:${id}"`;
}

export function findNextAvailableId(existingRules: Rule[], range: [number, number]): number | null {
  const used = new Set<number>();
  for (const r of existingRules) {
    const id = extractRuleId(r.content);
    if (id != null) used.add(id);
  }
  for (let i = range[0]; i <= range[1]; i++) {
    if (!used.has(i)) return i;
  }
  return null;
}

export function validateIdInRange(id: number, range: [number, number]) {
  return id >= range[0] && id <= range[1];
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}
