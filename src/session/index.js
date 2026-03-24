import * as readline from 'readline/promises';
import { SRSProtocol } from '../acp/index.js';
import { loadConfig, deriveConfig } from '../config.js';
import { getDueCards, updateCard, getScheduleStats } from '../scheduler/index.js';
import { loadCards } from '../cards/store.js';
import topics from '../cards/topics.json' with { type: 'json' };

function findTopic(topicId) { return topics.find(t => t.id === topicId); }

async function scoreAnswer(acp, card, userAnswer) {
  const prompt = `Score this answer on the SM-2 scale (0-5):
Card question: ${card.question}
Correct answer: ${card.answer}
Explanation: ${card.explanation}
Student's answer: ${userAnswer}

SM-2 scoring: 5=perfect, 4=correct with hesitation, 3=correct with difficulty, 2=incorrect but remembered, 1=incorrect, 0=blank/wrong.

Respond with JSON: {"score": <0-5>, "feedback": "<one sentence>"}`;

  const result = await acp.processLoop(prompt);
  const extracted = acp.extractJSON(result);
  if (extracted?.score != null) return extracted;
  const match = result.rawOutput?.match(/"score"s*:s*(d)/);
  return { score: match ? parseInt(match[1]) : 3, feedback: result.text?.slice(0, 200) ?? '' };
}

export async function runSession() {
  const cfg = deriveConfig(loadConfig());
  const allCards = loadCards();
  if (allCards.length === 0) throw new Error('No cards generated yet. Run: srs generate');

  const dueIds = getDueCards(allCards.map(c => c.id));
  if (dueIds.length === 0) { console.log('No cards due today! Run: srs plan to see what is coming up.'); return; }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const acp = new SRSProtocol(
    'You are a medical exam coach helping a student prepare for the MCCQE1. You have been observing their session.',
    [{ cli: cfg.preferredCLI }, { cli: cfg.fallbackCLI }]
  );

  console.log(`\n--- MCCQE1 Study Session (${dueIds.length} cards due) ---\n`);
  const sessionResults = [];

  for (const cardId of dueIds) {
    const card = allCards.find(c => c.id === cardId);
    if (!card) continue;
    const topic = findTopic(card.topicId);
    console.log(`\n[${topic?.discipline ?? card.topicId}] ${card.question}\n`);

    let userAnswer;
    try { userAnswer = await rl.question('Your answer: '); } catch { break; }
    if (userAnswer.toLowerCase() === 'q') break;

    const { score, feedback } = await scoreAnswer(acp, card, userAnswer);
    updateCard(cardId, score);

    console.log(`Score: ${score}/5 — ${feedback}`);
    console.log(`Correct answer: ${card.answer}`);
    sessionResults.push({ cardId, score, topicId: card.topicId });
  }

  rl.close();

  const scored = sessionResults.filter(r => r.score != null);
  if (scored.length === 0) return;

  const avgScore = scored.reduce((s, r) => s + r.score, 0) / scored.length;
  const weakTopics = [...new Set(scored.filter(r => r.score < 3).map(r => r.topicId))];
  const stats = getScheduleStats(allCards.map(c => c.id));

  console.log(`\n--- Session Summary ---`);
  console.log(`Cards reviewed: ${scored.length} | Avg score: ${avgScore.toFixed(1)}/5`);
  if (weakTopics.length > 0) console.log(`Weak areas: ${weakTopics.map(id => findTopic(id)?.name ?? id).join(', ')}`);
  console.log(`Overall progress: avg ease factor ${stats.avgEaseFactor.toFixed(2)} | target grade ${cfg.targetGrade}`);

  if (weakTopics.length > 0) {
    const sumPrompt = `After this session, student scored avg ${avgScore.toFixed(1)}/5. Weak in: ${weakTopics.join(', ')}. Days to exam: ${cfg.daysRemaining}. Target grade: ${cfg.targetGrade}. Give 2-sentence actionable advice.`;
    const summary = await acp.processLoop(sumPrompt);
    console.log(`\nCoach: ${summary.text}`);
  }
}
