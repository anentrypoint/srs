import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

const STORE_PATH = join(process.cwd(), 'data', 'cards.json');

export function loadCards() {
  if (!existsSync(STORE_PATH)) return [];
  return JSON.parse(readFileSync(STORE_PATH, 'utf8'));
}

export function saveCards(cards) {
  const dir = join(process.cwd(), 'data');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(STORE_PATH, JSON.stringify(cards, null, 2));
}

export function hashQuestion(q) {
  return createHash('sha256').update(q.trim().toLowerCase()).digest('hex').slice(0, 12);
}

export function upsertCards(newCards) {
  const existing = loadCards();
  const seen = new Set(existing.map(c => c.id));
  const added = [];
  for (const c of newCards) {
    const id = c.id ?? `card-${hashQuestion(c.question)}`;
    if (!seen.has(id)) { existing.push({ ...c, id }); seen.add(id); added.push(id); }
  }
  saveCards(existing);
  return { total: existing.length, added: added.length, ids: added };
}

export function getCardsByTopic(topicId) {
  return loadCards().filter(c => c.topicId === topicId);
}
