import { SRSProtocol } from '../acp/index.js';
import { loadConfig, deriveConfig } from '../config.js';
import { getDueCards, getScheduleStats } from '../scheduler/index.js';
import { loadCards } from '../cards/store.js';
import topics from '../cards/topics.json' with { type: 'json' };
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const PLAN_PATH = join(process.cwd(), 'data', 'daily-plan.json');

function groupByDiscipline(cardIds, allCards) {
  const map = {};
  for (const id of cardIds) {
    const card = allCards.find(c => c.id === id);
    if (!card) continue;
    const topic = topics.find(t => t.id === card.topicId);
    const disc = topic?.discipline ?? 'Unknown';
    if (!map[disc]) map[disc] = [];
    map[disc].push(card);
  }
  return map;
}

export async function generateDailyPlan() {
  const cfg = deriveConfig(loadConfig());
  const allCards = loadCards();
  const allIds = allCards.map(c => c.id);
  const dueIds = getDueCards(allIds);
  const stats = getScheduleStats(allIds);
  const grouped = groupByDiscipline(dueIds, allCards);

  if (dueIds.length === 0) {
    return { date: new Date().toISOString().slice(0, 10), blocks: [], rationale: 'No cards due today — all up to date!', stats };
  }

  const disciplineSummary = Object.entries(grouped).map(([d, cards]) =>
    `${d}: ${cards.length} cards`).join(', ');

  const acp = new SRSProtocol(
    'You are a medical education expert. Analyze the student study data and generate a personalized daily study plan.',
    [{ cli: cfg.preferredCLI }, { cli: cfg.fallbackCLI }]
  );

  const prompt = `Today's study data:
- Due cards: ${dueIds.length} across disciplines: ${disciplineSummary}
- Days remaining until exam: ${cfg.daysRemaining} (effective: ${cfg.effectiveDays})
- Target grade: ${cfg.targetGrade} (MCC scale 300-600)
- Average ease factor: ${stats.avgEaseFactor.toFixed(2)} (below 2.0 = struggling)
- Average last score: ${stats.avgLastScore.toFixed(2)} (out of 5)
- Daily study budget: ${cfg.dailyStudyMinutes} minutes

Generate a study plan JSON with:
- blocks: array of {discipline, cardCount, estimatedMinutes, priority, rationale}
- rationale: one paragraph explaining WHY these topics today, connecting to exam performance
- gradeProgress: estimated % toward target grade based on avg ease factor
- recommendation: urgent action if days < 14 or avgScore < 2.5

Output valid JSON only.`;

  const result = await acp.processLoop(prompt);
  const plan = acp.extractJSON(result) ?? { blocks: Object.entries(grouped).map(([d, c]) => ({ discipline: d, cardCount: c.length, estimatedMinutes: Math.ceil(c.length * 2.5), priority: 1, rationale: `${c.length} due cards` })), rationale: result.text, gradeProgress: Math.round((stats.avgEaseFactor - 1.3) / (2.5 - 1.3) * 100) };

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
