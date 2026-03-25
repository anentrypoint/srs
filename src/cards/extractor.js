import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { spawn } from 'child_process';
import { createHash } from 'crypto';

const IMAGES_DIR = 'pdf_pages/images';
const OUTPUT_DIR = 'data/extracted_cards';
const CHECKPOINT_FILE = 'data/extraction_checkpoint.json';
const EPOCH_SIZE = 10;

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function hashQuestion(q) {
  return 'card-' + createHash('sha256').update(q.trim().toLowerCase()).digest('hex').slice(0, 12);
}

function loadCheckpoint() {
  if (existsSync(CHECKPOINT_FILE)) {
    return JSON.parse(readFileSync(CHECKPOINT_FILE, 'utf8'));
  }
  const pages = readdirSync(IMAGES_DIR).length;
  return {
    lastCompletedEpoch: -1,
    totalEpochs: Math.ceil(pages / EPOCH_SIZE),
    processedPages: 0,
    extractedCards: 0,
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString()
  };
}

function saveCheckpoint(checkpoint) {
  checkpoint.lastUpdatedAt = new Date().toISOString();
  writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
}

function getEpochPages(epochNum) {
  const pageFiles = readdirSync(IMAGES_DIR).sort();
  const start = epochNum * EPOCH_SIZE;
  const end = Math.min(start + EPOCH_SIZE, pageFiles.length);
  const pages = pageFiles.slice(start, end);
  return pages.map(p => `${IMAGES_DIR}/${p}`);
}

function buildExtractionPrompt(pageFiles) {
  const pageList = pageFiles.join(', ');
  const systemPrompt = "You are an expert medical educator extracting MCCQE1 flashcards from Toronto Notes page images. Analyze the images and extract every possible clinical flashcard. Each card must follow MCCQE1 standards.";

  const userPrompt = `Extract all MCCQE1 flashcards from these pages: ${pageList}

For each card, output a JSON object with:
- question: clinical vignette or question (string)
- answer: concise correct answer (string)
- difficulty: 1-5 scale (1=recall, 5=analysis)
- tags: array of relevant medical topics
- bloomLevel: 'recall' | 'apply' | 'analyze'
- explanation: 2-3 sentence explanation

Output ONLY a valid JSON array of card objects. No preamble or commentary.`;

  return `${systemPrompt}\n\n${userPrompt}`;
}

async function extractEpoch(epochNum) {
  const checkpoint = loadCheckpoint();

  if (epochNum <= checkpoint.lastCompletedEpoch) {
    return { skipped: true, epochNum };
  }

  const pageFiles = getEpochPages(epochNum);
  if (pageFiles.length === 0) return { cards: [], epochNum };

  const prompt = buildExtractionPrompt(pageFiles);

  return new Promise((resolve, reject) => {
    let output = '';
    let stderr = '';

    const child = spawn('opencode', ['run', '--format', 'json', prompt], { shell: true });

    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error(`Epoch ${epochNum} timeout after 300000ms`));
    }, 300000);

    child.stdout.on('data', (data) => { output += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });

    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code !== 0 && code !== null) {
        reject(new Error(`opencode exited with ${code}: ${stderr}`));
        return;
      }

      try {
        const jsonMatch = output.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          reject(new Error(`No JSON in epoch ${epochNum}: ${output.substring(0, 200)}`));
          return;
        }

        const cards = JSON.parse(jsonMatch[0]);
        const enriched = cards.map((c, i) => ({
          ...c,
          id: hashQuestion(c.question),
          sourcePageStart: epochNum * EPOCH_SIZE + 1,
          sourcePageEnd: Math.min((epochNum + 1) * EPOCH_SIZE, 1595),
          sourcePageImages: pageFiles,
          extractedAt: new Date().toISOString(),
          checkpointEpoch: epochNum
        }));

        resolve({ cards: enriched, epochNum, pageFiles });
      } catch (e) {
        reject(new Error(`Failed to parse epoch ${epochNum}: ${e.message}`));
      }
    });
  });
}

function saveEpochCards(cards, epochNum) {
  ensureDir(OUTPUT_DIR);
  const filePath = `${OUTPUT_DIR}/epoch_${String(epochNum).padStart(3, '0')}.json`;
  writeFileSync(filePath, JSON.stringify(cards, null, 2));
  return filePath;
}

async function processEpoch(epochNum) {
  try {
    const result = await extractEpoch(epochNum);

    if (result.skipped) {
      return { status: 'skipped', epochNum };
    }

    const filePath = saveEpochCards(result.cards, epochNum);

    const checkpoint = loadCheckpoint();
    checkpoint.lastCompletedEpoch = epochNum;
    checkpoint.processedPages = (epochNum + 1) * EPOCH_SIZE;
    checkpoint.extractedCards += result.cards.length;
    saveCheckpoint(checkpoint);

    return { status: 'success', epochNum, cardCount: result.cards.length, filePath };
  } catch (e) {
    return { status: 'error', epochNum, error: e.message };
  }
}

export { extractEpoch, processEpoch, loadCheckpoint, saveCheckpoint, getEpochPages, EPOCH_SIZE };
