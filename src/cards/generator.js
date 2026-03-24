import { SRSProtocol } from '../acp/index.js';
import { loadConfig, deriveConfig } from '../config.js';
import { activeSyllabus } from '../syllabus/loader.js';
import { upsertCards } from './store.js';

export function getTopics() { return activeSyllabus().loadTopics(); }

export async function generateCardsForTopic(topicId, count = 10) {
  const s = activeSyllabus();
  const topics = s.loadTopics();
  const topic = topics.find(t => t.id === topicId);
  if (!topic) throw new Error(`Topic not found: ${topicId}`);
  const cfg = deriveConfig(loadConfig());
  const extrasDesc = s.cardExtras.map(e => `- ${e.description}`).join('\n');
  const groupValue = topic[s.groupByField] ?? topicId;

  const acp = new SRSProtocol(s.promptTemplates.generatorSystem, [
    { cli: cfg.preferredCLI }, { cli: cfg.fallbackCLI }
  ]);
  let savedCards = [];

  acp.registerTool('save_cards', 'Save generated flashcards to the store', {
    type: 'object', properties: { cards: { type: 'array' } }, required: ['cards'],
  }, async ({ cards }) => {
    const result = upsertCards(cards.map(c => ({ ...c, topicId, id: undefined })));
    savedCards = result.ids;
    return { saved: result.added, total: result.total };
  });

  const prompt = s.interpolate('generator', { count, topicName: topic.name, groupValue, extrasDesc });
  const result = await acp.processLoop(prompt);

  if (savedCards.length === 0) {
    const extracted = acp.extractJSON(result);
    if (extracted && Array.isArray(extracted)) {
      const r = upsertCards(extracted.map(c => ({ ...c, topicId })));
      savedCards = r.ids;
    }
  }
  return { topicId, generated: savedCards.length, ids: savedCards };
}

export async function generateAllTopics(countPerTopic = 8) {
  const topics = activeSyllabus().loadTopics();
  if (!topics.length) { console.error('No topics in active syllabus'); return []; }
  const results = [];
  for (const topic of topics) {
    const r = await generateCardsForTopic(topic.id, countPerTopic);
    results.push(r);
    console.error(`Generated ${r.generated} cards for ${topic.name}`);
  }
  return results;
}
