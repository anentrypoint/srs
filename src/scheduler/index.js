import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { calcSM2, compressInterval, defaultCardState } from './sm2.js';
import { deriveConfig, loadConfig } from '../config.js';

const STATES_PATH = join(process.cwd(), 'data', 'card-states.json');

export function loadStates() {
  if (!existsSync(STATES_PATH)) return {};
  return JSON.parse(readFileSync(STATES_PATH, 'utf8'));
}

export function saveStates(states) {
  const dir = join(process.cwd(), 'data');
  if (!existsSync(dir)) { const { mkdirSync } = require('fs'); mkdirSync(dir, { recursive: true }); }
  writeFileSync(STATES_PATH, JSON.stringify(states, null, 2));
}

export function getDueCards(cardIds) {
  const states = loadStates();
  const today = new Date().toISOString().slice(0, 10);
  return cardIds.filter(id => {
    const s = states[id] ?? defaultCardState();
    return s.dueDate <= today;
  });
}

export function updateCard(cardId, score) {
  const states = loadStates();
  const cfg = deriveConfig(loadConfig());
  const state = states[cardId] ?? defaultCardState();
  const allIds = Object.keys(states);
  const pendingCount = allIds.filter(id => (states[id] ?? defaultCardState()).dueDate <= new Date().toISOString().slice(0, 10)).length;
  const next = calcSM2(state, score);
  const compressed = compressInterval(next.interval, cfg.effectiveDays, pendingCount);
  const dueDate = new Date(Date.now() + compressed * 86400000).toISOString().slice(0, 10);
  states[cardId] = { ...next, dueDate, lastScore: score };
  saveStates(states);
  return states[cardId];
}

export function getScheduleStats(cardIds) {
  const states = loadStates();
  const today = new Date().toISOString().slice(0, 10);
  const due = cardIds.filter(id => (states[id] ?? defaultCardState()).dueDate <= today).length;
  const avgEF = cardIds.length === 0 ? 0 : cardIds.reduce((s, id) => s + (states[id]?.easeFactor ?? 2.5), 0) / cardIds.length;
  const avgScore = cardIds.filter(id => states[id]?.lastScore != null).reduce((s, id, _, arr) => s + states[id].lastScore / arr.length, 0);
  return { total: cardIds.length, due, avgEaseFactor: avgEF, avgLastScore: avgScore };
}
