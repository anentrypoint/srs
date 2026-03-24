#!/usr/bin/env node
import { loadConfig, deriveConfig, setConfigKey, saveConfig } from '../config.js';
import { getScheduleStats, getDueCards } from '../scheduler/index.js';
import { loadCards } from '../cards/store.js';
import topics from '../cards/topics.json' with { type: 'json' };

const [,, cmd, ...args] = process.argv;

async function ensureConfig() {
  const cfg = loadConfig();
  if (!cfg.examDate) {
    console.error('No exam date set. Run: srs config set examDate YYYY-MM-DD');
    process.exit(1);
  }
  return cfg;
}

async function cmdStudy() {
  await ensureConfig();
  const cards = loadCards();
  if (cards.length === 0) { console.error('No cards. Run: srs generate'); process.exit(1); }
  const { runSession } = await import('../session/index.js');
  await runSession();
}

async function cmdPlan() {
  await ensureConfig();
  const { generateDailyPlan } = await import('../daily/planner.js');
  const plan = await generateDailyPlan();
  console.log(`\n=== Study Plan for ${plan.date} ===`);
  console.log(`Due cards: ${plan.dueIds?.length ?? 0} | Days remaining: ${deriveConfig(loadConfig()).daysRemaining}`);
  if (plan.rationale) console.log(`\nWhy today's plan:\n${plan.rationale}`);
  if (plan.blocks?.length > 0) {
    console.log(`\nStudy blocks:`);
    for (const b of plan.blocks) console.log(`  [${b.priority ?? '-'}] ${b.discipline}: ${b.cardCount} cards (~${b.estimatedMinutes}min) — ${b.rationale}`);
  }
  if (plan.gradeProgress != null) console.log(`\nGrade progress: ~${plan.gradeProgress}% toward target ${loadConfig().targetGrade}`);
}

async function cmdGenerate() {
  await ensureConfig();
  const topicId = args[0];
  const { generateCardsForTopic, generateAllTopics } = await import('../cards/generator.js');
  if (topicId) {
    const r = await generateCardsForTopic(topicId);
    console.log(`Generated ${r.generated} new cards for ${topicId}`);
  } else {
    console.log('Generating cards for all topics (this may take a while)...');
    const results = await generateAllTopics();
    const total = results.reduce((s, r) => s + r.generated, 0);
    console.log(`Generated ${total} new cards across ${results.length} topics`);
  }
}

async function cmdConfig() {
  const [subCmd, key, value] = args;
  if (subCmd === 'get') {
    const cfg = loadConfig();
    console.log(key ? (cfg[key] ?? 'not set') : JSON.stringify(deriveConfig(cfg), null, 2));
  } else if (subCmd === 'set' && key && value) {
    const cfg = setConfigKey(key, value);
    console.log(`Set ${key} = ${cfg[key]}`);
  } else {
    console.log('Usage: srs config get [key] | srs config set <key> <value>');
    console.log('Keys: examDate, targetGrade, headroomDays, dailyStudyMinutes, preferredCLI');
  }
}

async function cmdStats() {
  const cards = loadCards();
  if (cards.length === 0) { console.log('No cards yet. Run: srs generate'); return; }
  const cfg = deriveConfig(loadConfig());
  const stats = getScheduleStats(cards.map(c => c.id));
  const due = getDueCards(cards.map(c => c.id));
  const gradeProgress = Math.round(Math.max(0, Math.min(100, (stats.avgEaseFactor - 1.3) / (2.5 - 1.3) * 100)));
  console.log(`\n=== MCCQE1 Progress ===`);
  console.log(`Total cards: ${stats.total} | Due today: ${due.length}`);
  console.log(`Avg ease factor: ${stats.avgEaseFactor.toFixed(2)} | Avg last score: ${stats.avgLastScore.toFixed(2)}/5`);
  console.log(`Grade progress: ~${gradeProgress}% toward ${cfg.targetGrade} (target)`);
  console.log(`Days remaining: ${cfg.daysRemaining} (effective: ${cfg.effectiveDays})`);
}

async function cmdTopics() {
  const grouped = {};
  for (const t of topics) {
    if (!grouped[t.discipline]) grouped[t.discipline] = [];
    grouped[t.discipline].push(t);
  }
  for (const [disc, ts] of Object.entries(grouped)) {
    console.log(`\n${disc}:`);
    for (const t of ts) console.log(`  ${t.id.padEnd(30)} ${t.name} (freq: ${(t.examFrequency * 100).toFixed(0)}%)`);
  }
}

const commands = { study: cmdStudy, plan: cmdPlan, generate: cmdGenerate, config: cmdConfig, stats: cmdStats, topics: cmdTopics };

if (!cmd || !commands[cmd]) {
  console.log('Usage: srs <command>');
  console.log('Commands: study | plan | generate [topicId] | config | stats | topics');
  process.exit(0);
}

commands[cmd]().catch(err => { console.error(err.message); process.exit(1); });
