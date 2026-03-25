const fs = require('fs');
const path = require('path');

const parts = [
  'gen_cards_part1.js',
  'gen_cards_part2.js',
  'gen_cards_part3.js',
  'gen_cards_part4.js',
  'gen_cards_part5.js',
  'gen_cards_part6.js',
  'gen_cards_part7.js',
  'gen_cards_part8.js',
  'gen_cards_part9.js',
];

let allCards = [];

for (const part of parts) {
  const scriptPath = path.join(__dirname, part);
  // Capture stdout by running in a child process via require hack:
  // Each script writes JSON to stdout. We'll use execSync to capture.
  const { execSync } = require('child_process');
  const output = execSync(`node "${scriptPath}"`, { maxBuffer: 50 * 1024 * 1024 }).toString();
  const cards = JSON.parse(output);
  console.log(`${part}: ${cards.length} cards`);
  allCards = allCards.concat(cards);
}

// Deduplicate by id
const seen = new Set();
const deduped = [];
for (const card of allCards) {
  if (!seen.has(card.id)) {
    seen.add(card.id);
    deduped.push(card);
  }
}

const outPath = path.join(__dirname, '..', 'data', 'cards.json');
fs.writeFileSync(outPath, JSON.stringify(deduped, null, 2));
console.log(`\nTotal unique cards written: ${deduped.length}`);
console.log(`Output: ${outPath}`);
