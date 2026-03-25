#!/usr/bin/env node
import { createIndex } from '../src/cards/indexer.js';
import { existsSync, readdirSync } from 'fs';

const EXTRACTED_CARDS_DIR = 'data/extracted_cards';

async function main() {
  console.error('Checking for extracted cards...');

  if (!existsSync(EXTRACTED_CARDS_DIR)) {
    console.error('ERROR: No extracted cards directory found');
    console.error('Run: node scripts/run_epoch_extraction.mjs');
    process.exit(1);
  }

  const epochFiles = readdirSync(EXTRACTED_CARDS_DIR).filter(f => f.endsWith('.json'));
  if (epochFiles.length === 0) {
    console.error('ERROR: No epoch files found in ' + EXTRACTED_CARDS_DIR);
    console.error('Run: node scripts/run_epoch_extraction.mjs');
    process.exit(1);
  }

  console.error(`Found ${epochFiles.length} epoch files. Creating index...`);

  try {
    const result = await createIndex();
    console.error(`✓ Index created: ${result.cardCount} cards from ${result.topicCount} topics`);
    console.error(`✓ Index file: ${result.indexFile}`);
    console.error(`✓ Markdown: ${result.markdownFile}`);
    process.stdout.write(JSON.stringify(result) + '\n');
  } catch (e) {
    console.error('FATAL:', e.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };
