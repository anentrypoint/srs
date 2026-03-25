// Loop runner: repeatedly calls extract_cards_from_ocr.mjs until epoch 160
import { spawn } from 'child_process';
import { readFileSync } from 'fs';

const CHECKPOINT = 'C:/dev/srs-mccqe1/data/ocr_extraction_checkpoint.json';
const TOTAL_EPOCHS = 160;

function getEpoch() {
  try { return JSON.parse(readFileSync(CHECKPOINT, 'utf8')).lastEpoch; }
  catch { return 0; }
}

async function runOnce() {
  return new Promise(resolve => {
    const child = spawn('node', ['scripts/extract_cards_from_ocr.mjs'], {
      cwd: 'C:/dev/srs-mccqe1',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stdout.on('data', d => process.stdout.write(d));
    child.stderr.on('data', d => process.stderr.write(d));
    child.on('close', resolve);
  });
}

let runs = 0;
while (getEpoch() < TOTAL_EPOCHS) {
  runs++;
  const epoch = getEpoch();
  console.log(`\n=== Run ${runs}: starting from epoch ${epoch}/${TOTAL_EPOCHS} ===`);
  await runOnce();
  await new Promise(r => setTimeout(r, 3000));
}

const cards = JSON.parse(readFileSync('C:/dev/srs-mccqe1/data/cards.json', 'utf8'));
console.log(`\n=== COMPLETE after ${runs} runs. Total cards: ${cards.length} ===`);
