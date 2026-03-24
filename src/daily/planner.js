import { SRSProtocol } from '../acp/index.js';
import { loadConfig, deriveConfig } from '../config.js';
import { activeSyllabus } from '../syllabus/loader.js';
import { getDueCards, getScheduleStats } from '../scheduler/index.js';
import { loadCards } from '../cards/store.js';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const PLAN_PATH = join(process.cwd(), 'data', 'daily-plan.json');

function groupCards(cardIds, allCards, groupByField) {
  const map = {};
  const topics = activeSyllabus().loadTopics();
  for (const id of cardIds) {
    const card = allCards.find(c => c.id === id);
    if (!card) continue;
    const topic = topics.find(t => t.id === card.topicId);
    const key = topic?.[groupByField] ?? card.topicId;
    (map[key] ??= []).push(card);
  }
  return map;
}

export async function generateDailyPlan() {
  const s = activeSyllabus();
  const cfg = deriveConfig(loadConfig());
  const allCards = loadCards();
  const dueIds = getDueCards(allCards.map(c => c.id));
  const stats = getScheduleStats(allCards.map(c => c.id));

  if (dueIds.length === 0) {
    return { date: new Date().toISOString().slice(0, 10), blocks: [], rationale: 'No cards due today — all up to date!', stats };
  }

  const grouped = groupCards(dueIds, allCards, s.groupByField);
  const groupLabel = s.groupByField;
  const groupSummary = Object.entries(grouped).map(([k, cs]) => `${k}: ${cs.length} cards`).join(', ');
  const efRange = cfg.efCeiling - 1.3;
  const gradeProgress = Math.round(Math.max(0, Math.min(100, (stats.avgEaseFactor - 1.3) / efRange * 100)));

  const acp = new SRSProtocol(s.promptTemplates.plannerSystem, [{ cli: cfg.preferredCLI }, { cli: cfg.fallbackCLI }]);
  const prompt = s.interpolate('planner', {
    dueCount: dueIds.length, groupLabel, groupSummary,
    daysRemaining: cfg.daysRemaining, effectiveDays: cfg.effectiveDays,
    targetGrade: cfg.targetGrade, gradeScaleLabel: s.gradeScaleLabel,
    avgEF: stats.avgEaseFactor.toFixed(2), avgScore: stats.avgLastScore.toFixed(2),
    dailyMinutes: cfg.dailyStudyMinutes,
  });

  const result = await acp.processLoop(prompt);
  const fallbackBlocks = Object.entries(grouped).map(([k, cs]) => ({ [groupLabel]: k, cardCount: cs.length, estimatedMinutes: Math.ceil(cs.length * 2.5), priority: 1, rationale: `${cs.length} due cards` }));
  const plan = acp.extractJSON(result) ?? { blocks: fallbackBlocks, rationale: result.text, gradeProgress };

  const output = { date: new Date().toISOString().slice(0, 10), dueIds, stats, ...plan };
  const dir = join(process.cwd(), 'data');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(PLAN_PATH, JSON.stringify(output, null, 2));
  return output;
}

export function loadDailyPlan() {
  if (!existsSync(PLAN_PATH)) return null;
  return JSON.parse(require('fs').readFileSync(PLAN_PATH, 'utf8'));
}
