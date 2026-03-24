import * as readline from 'readline/promises';
import { SRSProtocol } from '../acp/index.js';
import { loadConfig, deriveConfig } from '../config.js';
import { activeSyllabus } from '../syllabus/loader.js';
import { getDueCards, updateCard, getScheduleStats } from '../scheduler/index.js';
import { loadCards } from '../cards/store.js';

async function scoreAnswer(acp, s, card, userAnswer) {
  const prompt = s.interpolate('scoreAnswer', {
    question: card.question, answer: card.answer,
    explanation: card.explanation ?? '', userAnswer,
  });
  const result = await acp.processLoop(prompt);
  const extracted = acp.extractJSON(result);
  if (extracted?.score != null) return extracted;
  const match = result.rawOutput?.match(/"score"\s*:\s*(\d)/);
  return { score: match ? parseInt(match[1]) : 3, feedback: result.text?.slice(0, 200) ?? '' };
}

export async function runSession() {
  const s = activeSyllabus();
  const cfg = deriveConfig(loadConfig());
  const allCards = loadCards();
  if (allCards.length === 0) throw new Error('No cards generated yet. Run: srs generate');

  const dueIds = getDueCards(allCards.map(c => c.id));
  if (dueIds.length === 0) { console.log('No cards due today! Run: srs plan'); return; }

  const topics = s.loadTopics();
  const findGroup = (topicId) => topics.find(t => t.id === topicId)?.[s.groupByField] ?? topicId;

  const acp = new SRSProtocol(s.interpolate('sessionCoach', { label: s.label }), [
    { cli: cfg.preferredCLI }, { cli: cfg.fallbackCLI }
  ]);

  console.log(`\n--- ${s.label} Study Session (${dueIds.length} cards due) ---\n`);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const sessionResults = [];

  for (const cardId of dueIds) {
    const card = allCards.find(c => c.id === cardId);
    if (!card) continue;
    console.log(`\n[${findGroup(card.topicId)}] ${card.question}\n`);

    let userAnswer;
    try { userAnswer = await rl.question('Your answer: '); } catch { break; }
    if (userAnswer.toLowerCase() === 'q') break;

    const { score, feedback } = await scoreAnswer(acp, s, card, userAnswer);
    updateCard(cardId, score);
    console.log(`Score: ${score}/5 — ${feedback}`);
    console.log(`Correct answer: ${card.answer}`);
    sessionResults.push({ cardId, score, topicId: card.topicId });
  }

  rl.close();
  const scored = sessionResults.filter(r => r.score != null);
  if (scored.length === 0) return;

  const avgScore = (scored.reduce((s, r) => s + r.score, 0) / scored.length).toFixed(1);
  const weakTopics = [...new Set(scored.filter(r => r.score < 3).map(r => findGroup(r.topicId)))];
  const stats = getScheduleStats(allCards.map(c => c.id));

  console.log(`\n--- Session Summary ---`);
  console.log(`Cards reviewed: ${scored.length} | Avg score: ${avgScore}/5`);
  if (weakTopics.length) console.log(`Weak areas: ${weakTopics.join(', ')}`);
  console.log(`Progress: avg ease factor ${stats.avgEaseFactor.toFixed(2)} | target ${cfg.targetGrade}`);

  if (weakTopics.length) {
    const prompt = s.interpolate('sessionSummary', { avgScore, weakTopics: weakTopics.join(', '), daysRemaining: cfg.daysRemaining, targetGrade: cfg.targetGrade });
    const summary = await acp.processLoop(prompt);
    console.log(`\nCoach: ${summary.text}`);
  }
}
