
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const STORE = 'C:/dev/srs-mccqe1/data/cards.json';
const LOG = 'C:/dev/srs-mccqe1/data/batch_gen.log';

const systemPrompt = "You are an expert Canadian medical educator creating MCCQE1 exam preparation flashcards.";
const generatorTemplate = "Generate ${count} MCCQE1 flashcards for the topic: \"${topicName}\" (${groupValue}).\n\nEach card must be a JSON object with:\n- question: clinical vignette or direct question (string)\n- answer: concise correct answer (string)\n- difficulty: 1-5 (1=easy recall, 5=hard analysis)\n- tags: array of relevant tags\n${extrasDesc}\n\nOutput ONLY a JSON array of ${count} card objects. No preamble, no trailing text.";
const extrasDesc = "- bloomLevel: one of recall/apply/analyze\\n- explanation: 2-3 sentence explanation linking to Canadian clinical guidelines";

const topics = JSON.parse(readFileSync('C:/dev/srs-mccqe1/syllabi/mccqe1/topics.json', 'utf8'));
const minCards = ef => ef >= 0.07 ? 20 : ef >= 0.05 ? 15 : ef >= 0.04 ? 10 : 7;
const hashQ = q => createHash('sha256').update(q.trim().toLowerCase()).digest('hex').slice(0, 12);

function loadCards() {
  if (!existsSync(STORE)) return [];
  return JSON.parse(readFileSync(STORE, 'utf8'));
}

function upsertCards(newCards, topicId) {
  const existing = loadCards();
  const seen = new Set(existing.map(c => c.id));
  const added = [];
  for (const c of newCards) {
    const id = 'card-' + hashQ(c.question);
    if (!seen.has(id)) { existing.push({ ...c, id, topicId }); seen.add(id); added.push(id); }
  }
  writeFileSync(STORE, JSON.stringify(existing, null, 2));
  return added.length;
}

function log(msg) {
  const line = '[' + new Date().toISOString() + '] ' + msg;
  process.stdout.write(line + '\n');
  writeFileSync(LOG, line + '\n', { flag: 'a' });
}

async function generateTopic(topic, count) {
  const prompt = generatorTemplate
    .replace(/\${count}/g, count)
    .replace(/\${topicName}/g, topic.name)
    .replace(/\${groupValue}/g, topic.discipline ?? topic.id)
    .replace(/\${extrasDesc}/g, extrasDesc);

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + OPENAI_KEY },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!resp.ok) throw new Error('OpenAI error: ' + resp.status + ' ' + await resp.text());
  const data = await resp.json();
  const text = data.choices[0].message.content.trim();
  const jsonMatch = text.match(/\[([\s\S]*)\]/);
  if (!jsonMatch) throw new Error('No JSON array in response');
  return JSON.parse('[' + jsonMatch[1] + ']');
}

log('Starting batch generation for ' + topics.length + ' topics');
log('Frequency tiers: >=7% -> 20, >=5% -> 15, >=4% -> 10, else -> 7');

let totalAdded = 0;
for (let i = 0; i < topics.length; i++) {
  const t = topics[i];
  const count = minCards(t.examFrequency ?? 0.04);
  log('[' + (i+1) + '/' + topics.length + '] Starting: ' + t.name + ' (id=' + t.id + ', target=' + count + ')');
  try {
    const cards = await generateTopic(t, count);
    const added = upsertCards(cards, t.id);
    totalAdded += added;
    log('[' + (i+1) + '/' + topics.length + '] DONE: ' + t.name + ' -> ' + added + ' new cards (total: ' + loadCards().length + ')');
  } catch(e) {
    log('[' + (i+1) + '/' + topics.length + '] ERROR: ' + t.name + ': ' + e.message);
  }
}

log('BATCH COMPLETE. Total new cards: ' + totalAdded + '. Total in store: ' + loadCards().length);
