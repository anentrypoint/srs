#!/usr/bin/env node
import { loadConfig, deriveConfig, setConfigKey } from '../config.js';
import { activeSyllabus, listSyllabi } from '../syllabus/loader.js';
import { getScheduleStats, getDueCards } from '../scheduler/index.js';
import { loadCards } from '../cards/store.js';

const [,, cmd, ...args] = process.argv;

async function ensureConfig() {
  const cfg = loadConfig();
  if (!cfg.examDate) { console.error('No exam date set. Run: srs config set examDate YYYY-MM-DD'); process.exit(1); }
  return cfg;
}

async function cmdStudy() {
  await ensureConfig();
  if (!loadCards().length) { console.error('No cards. Run: srs generate'); process.exit(1); }
  const { runSession } = await import('../session/index.js');
  await runSession();
}

async function cmdPlan() {
  await ensureConfig();
  const { generateDailyPlan } = await import('../daily/planner.js');
  const plan = await generateDailyPlan();
  const cfg = deriveConfig(loadConfig());
  const s = activeSyllabus();
  console.log(`\n=== Study Plan for ${plan.date} ===`);
  console.log(`Due cards: ${plan.dueIds?.length ?? 0} | Days remaining: ${cfg.daysRemaining}`);
  if (plan.rationale) console.log(`\nWhy today:\n${plan.rationale}`);
  if (plan.blocks?.length) {
    console.log(`\nStudy blocks:`);
    for (const b of plan.blocks) console.log(`  [${b.priority ?? '-'}] ${b[s.groupByField] ?? Object.values(b)[0] ?? '?'}: ${b.cardCount} cards (~${b.estimatedMinutes}min) — ${b.rationale}`);
  }
  if (plan.gradeProgress != null) console.log(`\nGrade progress: ~${plan.gradeProgress}% toward target ${cfg.targetGrade}`);
}

async function cmdGenerate() {
  await ensureConfig();
  const { generateCardsForTopic, generateAllTopics } = await import('../cards/generator.js');
  if (args[0]) {
    const r = await generateCardsForTopic(args[0]);
    console.log(`Generated ${r.generated} new cards for ${args[0]}`);
  } else {
    console.log('Generating cards for all topics...');
    const results = await generateAllTopics();
    console.log(`Generated ${results.reduce((s,r) => s+r.generated, 0)} new cards across ${results.length} topics`);
  }
}

async function cmdConfig() {
  const [sub, key, value] = args;
  if (sub === 'get') {
    const cfg = loadConfig();
    console.log(key ? (cfg[key] ?? 'not set') : JSON.stringify(deriveConfig(cfg), null, 2));
  } else if (sub === 'set' && key && value) {
    const cfg = setConfigKey(key, value);
    console.log(`Set ${key} = ${cfg[key]}`);
  } else {
    const s = activeSyllabus();
    console.log('Usage: srs config get [key] | srs config set <key> <value>');
    console.log(`Keys: examDate, targetGrade (${Object.keys(s.gradeMap).join('/')} or ${s.gradeRange.join('-')}), headroomDays, dailyStudyMinutes, preferredCLI, syllabus`);
  }
}

async function cmdStats() {
  const cards = loadCards();
  if (!cards.length) { console.log('No cards yet. Run: srs generate'); return; }
  const s = activeSyllabus();
  const cfg = deriveConfig(loadConfig());
  const stats = getScheduleStats(cards.map(c => c.id));
  const due = getDueCards(cards.map(c => c.id));
  const gradeProgress = Math.round(Math.max(0, Math.min(100, (stats.avgEaseFactor - 1.3) / (cfg.efCeiling - 1.3) * 100)));
  console.log(`\n=== ${s.label} Progress ===`);
  console.log(`Total cards: ${stats.total} | Due today: ${due.length}`);
  console.log(`Avg ease factor: ${stats.avgEaseFactor.toFixed(2)} | Avg last score: ${stats.avgLastScore.toFixed(2)}/5`);
  console.log(`Grade progress: ~${gradeProgress}% toward ${cfg.targetGrade} (target)`);
  console.log(`Days remaining: ${cfg.daysRemaining} (effective: ${cfg.effectiveDays})`);
}

async function cmdTopics() {
  const s = activeSyllabus();
  const topics = s.loadTopics();
  const grouped = {};
  for (const t of topics) (grouped[t[s.groupByField] ?? 'Other'] ??= []).push(t);
  for (const [key, ts] of Object.entries(grouped)) {
    console.log(`\n${key}:`);
    for (const t of ts) console.log(`  ${t.id.padEnd(30)} ${t.name}${t.examFrequency != null ? ` (freq: ${(t.examFrequency*100).toFixed(0)}%)` : ''}`);
  }
}

async function cmdSyllabus() {
  const active = activeSyllabus();
  const all = listSyllabi();
  console.log('Available syllabi:');
  for (const s of all) console.log(`  ${s.name === active.name ? '*' : ' '} ${s.name} — ${s.label}`);
  console.log(`\nActive: ${active.name}. Switch with: srs config set syllabus <name>`);
}

const commands = { study: cmdStudy, plan: cmdPlan, generate: cmdGenerate, config: cmdConfig, stats: cmdStats, topics: cmdTopics, syllabus: cmdSyllabus };

if (!cmd || !commands[cmd]) {
  console.log('Usage: srs <command>');
  console.log('Commands: study | plan | generate [topicId] | config | stats | topics | syllabus');
  process.exit(0);
}

commands[cmd]().catch(err => { console.error(err.message); process.exit(1); });
