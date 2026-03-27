#!/usr/bin/env node
import { processEpoch, loadCheckpoint, EPOCH_SIZE } from '../src/cards/extractor.js';
import { writeFileSync, readFileSync } from 'fs';

const LOG_FILE = 'data/epoch_extraction.log';

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.error(line);
  writeFileSync(LOG_FILE, line + '\n', { flag: 'a' });
}

async function runExtractionPipeline() {
  log('=== Card Extraction Pipeline Started ===');

  const checkpoint = loadCheckpoint();
  const startEpoch = checkpoint.lastCompletedEpoch + 1;
  const endEpoch = checkpoint.totalEpochs;

  log(`Total epochs: ${endEpoch}, starting from epoch ${startEpoch}`);

  let successCount = 0;
  let errorCount = 0;
  let totalCardsExtracted = checkpoint.extractedCards;

  for (let epoch = startEpoch; epoch < endEpoch; epoch++) {
    try {
      log(`Processing epoch ${epoch + 1}/${endEpoch}...`);
      const result = await processEpoch(epoch);

      if (result.status === 'success') {
        successCount++;
        totalCardsExtracted += result.cardCount;
        log(`✓ Epoch ${epoch}: ${result.cardCount} cards (tool: ${result.tool}, file: ${result.filePath})`);
      } else if (result.status === 'error') {
        errorCount++;
        log(`✗ Epoch ${epoch}: ERROR - ${result.error}`);
      } else if (result.status === 'skipped') {
        log(`⊘ Epoch ${epoch}: skipped (already processed)`);
      }

      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      errorCount++;
      log(`✗ Epoch ${epoch}: FATAL - ${e.message}`);
    }

    // Log progress every 10 epochs
    if ((epoch + 1) % 10 === 0 || epoch === endEpoch - 1) {
      const processed = epoch + 1;
      const progress = ((processed / endEpoch) * 100).toFixed(1);
      log(`Progress: ${processed}/${endEpoch} epochs (${progress}%) | Success: ${successCount} | Errors: ${errorCount} | Cards: ${totalCardsExtracted}`);
    }
  }

  log(`=== Pipeline Complete ===`);
  log(`Epochs processed: ${successCount} success, ${errorCount} errors`);
  log(`Total cards extracted: ${totalCardsExtracted}`);
  log(`Output directory: data/extracted_cards`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runExtractionPipeline().catch(e => {
    console.error('Fatal error:', e);
    process.exit(1);
  });
}

export { runExtractionPipeline };
