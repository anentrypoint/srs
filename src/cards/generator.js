import { SRSProtocol } from '../acp/index.js';
import { loadConfig, deriveConfig } from '../config.js';
import { upsertCards } from './store.js';
import topics from './topics.json' with { type: 'json' };

const BLOOM_LEVELS = ['recall', 'apply', 'analyze'];

function buildGeneratorPrompt(topic, count) {
  return `Generate ${count} MCCQE1 flashcards for the topic: "${topic.name}" (discipline: ${topic.discipline}).

Each card must be a JSON object with:
- question: clinical vignette or direct question (string)
- answer: concise correct answer (string)
- explanation: 2-3 sentence explanation linking to Canadian clinical guidelines (string)
- difficulty: 1-5 (1=easy recall, 5=hard analysis)
- bloomLevel: one of recall/apply/analyze
- tags: array of relevant tags

Output ONLY a JSON array of ${count} card objects. No preamble, no trailing text.`;
}

export async function generateCardsForTopic(topicId, count = 10) {
  const topic = topics.find(t => t.id === topicId);
  if (!topic) throw new Error(`Topic not found: ${topicId}`);
  const cfg = deriveConfig(loadConfig());
  const acp = new SRSProtocol('You are an expert Canadian medical educator creating MCCQE1 exam preparation flashcards.', [
    { cli: cfg.preferredCLI },
    { cli: cfg.fallbackCLI },
  ]);

  let savedCards = [];

  acp.registerTool('save_cards', 'Save generated flashcards to the store', {
    type: 'object', properties: { cards: { type: 'array' } }, required: ['cards'],
  }, async ({ cards }) => {
    const enriched = cards.map(c => ({ ...c, topicId, id: undefined }));
    const result = upsertCards(enriched);
    savedCards = result.ids;
    return { saved: result.added, total: result.total };
  });

  const prompt = buildGeneratorPrompt(topic, count);
  const result = await acp.processLoop(prompt);

  if (savedCards.length === 0) {
    const extracted = acp.extractJSON(result);
    if (extracted && Array.isArray(extracted)) {
      const enriched = extracted.map(c => ({ ...c, topicId }));
      const r = upsertCards(enriched);
      savedCards = r.ids;
    }
  }

  return { topicId, generated: savedCards.length, ids: savedCards };
}

export async function generateAllTopics(countPerTopic = 8) {
  const results = [];
  for (const topic of topics) {
    const r = await generateCardsForTopic(topic.id, countPerTopic);
    results.push(r);
    console.error(`Generated ${r.generated} cards for ${topic.name}`);
  }
  return results;
}

export { topics };
