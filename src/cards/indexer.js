import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

const EXTRACTED_CARDS_DIR = 'data/extracted_cards';
const OUTPUT_DIR = 'data';
const INDEX_FILE = join(OUTPUT_DIR, 'cards_index.json');
const MARKDOWN_FILE = join(OUTPUT_DIR, 'INDEX.md');

function loadTopics() {
  return JSON.parse(readFileSync('syllabi/mccqe1/topics.json', 'utf8'));
}

function loadAllCards() {
  const cards = [];
  const files = readdirSync(EXTRACTED_CARDS_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();

  for (const file of files) {
    try {
      const content = readFileSync(join(EXTRACTED_CARDS_DIR, file), 'utf8');
      const epochCards = JSON.parse(content);
      if (Array.isArray(epochCards)) {
        cards.push(...epochCards);
      }
    } catch (e) {
      console.error(`Failed to load ${file}: ${e.message}`);
    }
  }

  return cards;
}

function deduplicateCards(cards) {
  const seen = new Set();
  const unique = [];
  for (const card of cards) {
    if (!seen.has(card.id)) {
      unique.push(card);
      seen.add(card.id);
    }
  }
  return unique;
}

function buildTopicIndex(cards, topics) {
  const topicMap = {};
  const topicsById = Object.fromEntries(topics.map(t => [t.id, t]));

  for (const topic of topics) {
    topicMap[topic.id] = {
      name: topic.name,
      discipline: topic.discipline || 'General',
      cards: []
    };
  }

  for (const card of cards) {
    const cardTopic = card.checkpointEpoch ? 'extracted' : 'generated';
    if (!topicMap[cardTopic]) {
      topicMap[cardTopic] = { name: 'Other', cards: [] };
    }
    topicMap[cardTopic].cards.push(card.id);
  }

  return topicMap;
}

function buildSearchIndex(cards) {
  const index = {};
  for (const card of cards) {
    const searchKey = (card.question + ' ' + card.answer)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '');

    const words = searchKey.split(/\s+/).filter(w => w.length > 2);
    for (const word of words) {
      if (!index[word]) {
        index[word] = [];
      }
      if (!index[word].includes(card.id)) {
        index[word].push(card.id);
      }
    }
  }
  return index;
}

function generateMarkdownIndex(cards, topicMap, topics) {
  let md = '# MCCQE1 Flashcard Index\n\n';
  md += `**Total Cards:** ${cards.length}\n\n`;
  md += `**Generated:** ${new Date().toISOString()}\n\n`;

  md += '## Cards by Difficulty\n\n';
  const byDifficulty = {};
  for (const card of cards) {
    const diff = card.difficulty || 3;
    if (!byDifficulty[diff]) byDifficulty[diff] = [];
    byDifficulty[diff].push(card);
  }

  for (let d = 1; d <= 5; d++) {
    if (byDifficulty[d]) {
      md += `### Level ${d}\n${byDifficulty[d].length} cards\n\n`;
    }
  }

  md += '## Cards by Bloom Level\n\n';
  const byBloom = {};
  for (const card of cards) {
    const bloom = card.bloomLevel || 'unknown';
    if (!byBloom[bloom]) byBloom[bloom] = [];
    byBloom[bloom].push(card);
  }

  for (const [bloom, cards] of Object.entries(byBloom)) {
    md += `### ${bloom.charAt(0).toUpperCase() + bloom.slice(1)}\n${cards.length} cards\n\n`;
  }

  md += '## Topics\n\n';
  for (const [topicId, topic] of Object.entries(topicMap)) {
    if (topic.cards.length > 0) {
      md += `- **${topic.name}** (${topic.discipline}): ${topic.cards.length} cards\n`;
    }
  }

  return md;
}

async function createIndex() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const topics = loadTopics();
  const allCards = loadAllCards();
  const uniqueCards = deduplicateCards(allCards);

  const topicMap = buildTopicIndex(uniqueCards, topics);
  const searchIndex = buildSearchIndex(uniqueCards);

  const indexData = {
    totalCards: uniqueCards.totalCards,
    generatedAt: new Date().toISOString(),
    cards: uniqueCards,
    topicMap,
    searchIndex
  };

  writeFileSync(INDEX_FILE, JSON.stringify(indexData, null, 2));

  const markdown = generateMarkdownIndex(uniqueCards, topicMap, topics);
  writeFileSync(MARKDOWN_FILE, markdown);

  return {
    cardCount: uniqueCards.length,
    topicCount: Object.keys(topicMap).length,
    indexFile: INDEX_FILE,
    markdownFile: MARKDOWN_FILE
  };
}

export { createIndex, loadAllCards, deduplicateCards, buildTopicIndex };
