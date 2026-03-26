const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TEXT_DIR = path.join(__dirname, '..', 'pdf_pages', 'text');
const DATA_DIR = path.join(__dirname, '..', 'data');
const CARDS_FILE = path.join(DATA_DIR, 'cards.json');
const CHECKPOINT = path.join(DATA_DIR, 'agent_epoch_checkpoint.json');
const EPOCH_SIZE = 10;

const topics = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'syllabi', 'mccqe1', 'topics.json'), 'utf8'));
const TOPIC_WORDS = {};
topics.forEach(t => {
  TOPIC_WORDS[t.id] = (t.name + ' ' + (t.discipline || '')).toLowerCase().split(/\W+/).filter(w => w.length > 2);
});
const TOPIC_LIST = topics.map(t => t.id + ' — ' + t.name).join('\n');

const pad = n => String(n).padStart(4, '0');
const hashQ = q => 'card-' + crypto.createHash('sha256').update(q.trim().toLowerCase()).digest('hex').slice(0, 12);

function guessTopicId(text) {
  const lower = text.toLowerCase();
  let best = 'general', bestScore = 0;
  for (const [tid, words] of Object.entries(TOPIC_WORDS)) {
    const score = words.filter(w => lower.includes(w)).length;
    if (score > bestScore) { best = tid; bestScore = score; }
  }
  return best;
}

function loadCards() {
  if (!fs.existsSync(CARDS_FILE)) return [];
  return JSON.parse(fs.readFileSync(CARDS_FILE, 'utf8'));
}

function loadCheckpoint() {
  if (!fs.existsSync(CHECKPOINT)) return { lastEpoch: 0 };
  return JSON.parse(fs.readFileSync(CHECKPOINT, 'utf8'));
}

function saveCheckpoint(epoch) {
  fs.writeFileSync(CHECKPOINT, JSON.stringify({ lastEpoch: epoch, updatedAt: new Date().toISOString() }, null, 2));
}

function loadEpochText(startPage, count) {
  const pages = [];
  for (let i = startPage; i < startPage + count; i++) {
    const f = path.join(TEXT_DIR, `page_${pad(i)}.txt`);
    if (!fs.existsSync(f)) continue;
    const text = fs.readFileSync(f, 'utf8').trim();
    if (text.length > 20) pages.push({ page: i, text });
  }
  return pages;
}

function buildPrompt(pages) {
  const pageText = pages.map(p => `=== PAGE ${p.page} ===\n${p.text}`).join('\n\n');
  const pageNums = pages.map(p => p.page).join(', ');
  return `You are an expert Canadian medical educator. Extract MCCQE1 flashcards from the following Toronto Notes 2025 textbook pages (${pageNums}).

VALID TOPIC IDs (use ONLY these):
${TOPIC_LIST}

TEXT:
${pageText}

Generate high-quality flashcards covering ALL testable content. Each card MUST be a JSON object:
- question: clinical vignette or direct question
- answer: concise correct answer
- explanation: 1-2 sentences linking to Canadian guidelines
- difficulty: 1-5
- bloomLevel: recall | apply | analyze
- tags: array of relevant tags
- topicId: one of the valid topic IDs above

Output ONLY a JSON array. No preamble, no markdown fences, no explanation.`;
}

function parseCards(text) {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try { return JSON.parse(match[0]); } catch { return []; }
}

function processAgentResult(raw, existingIds) {
  const cards = parseCards(raw);
  const structured = [];
  for (const c of cards) {
    if (!c.question || !c.answer) continue;
    const id = hashQ(c.question);
    if (existingIds.has(id)) continue;
    const topicId = c.topicId && topics.some(t => t.id === c.topicId) ? c.topicId : guessTopicId(c.question + ' ' + c.answer);
    structured.push({
      id, question: c.question, answer: c.answer,
      explanation: c.explanation ?? '',
      difficulty: Math.max(1, Math.min(5, c.difficulty ?? 3)),
      bloomLevel: ['recall', 'apply', 'analyze'].includes(c.bloomLevel) ? c.bloomLevel : 'recall',
      tags: Array.isArray(c.tags) ? c.tags : [],
      topicId,
    });
    existingIds.add(id);
  }
  return structured;
}

function saveEpochCards(epochStart, epochEnd, newCards) {
  const outFile = path.join(DATA_DIR, `agent_cards_${epochStart}_${epochEnd}.json`);
  fs.writeFileSync(outFile, JSON.stringify(newCards, null, 2));
  const all = loadCards();
  const existingIds = new Set(all.map(c => c.id));
  let added = 0;
  for (const c of newCards) {
    if (!existingIds.has(c.id)) { all.push(c); existingIds.add(c.id); added++; }
  }
  fs.writeFileSync(CARDS_FILE, JSON.stringify(all, null, 2));
  return added;
}

const totalPages = fs.readdirSync(TEXT_DIR).filter(f => f.endsWith('.txt')).length;
const totalEpochs = Math.ceil(totalPages / EPOCH_SIZE);

module.exports = {
  EPOCH_SIZE, totalPages, totalEpochs, loadCheckpoint, saveCheckpoint,
  loadEpochText, buildPrompt, parseCards, processAgentResult, saveEpochCards,
  loadCards, guessTopicId, hashQ, pad, topics, TOPIC_LIST,
};
