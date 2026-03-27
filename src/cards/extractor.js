import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { spawnSync } from 'child_process';
import { createHash } from 'crypto';
import { join } from 'path';

const TEXT_DIR = 'pdf_pages/text';
const OUTPUT_DIR = 'data/extracted_cards';
const CHECKPOINT_FILE = 'data/extraction_checkpoint.json';
const EPOCH_SIZE = 10;
const CHUNK_SIZE = 3;
const KILO_BIN = 'C:/Users/user/AppData/Roaming/npm/node_modules/@kilocode/cli-windows-x64/bin/kilo.exe';
const KILO_MODEL = 'kilo/kilo-auto/free';
const OPENCODE_CMD = 'opencode';
const OPENCODE_MODEL = 'opencode/big-pickle';
const EXTRACTION_PROMPT = 'You are an expert MCCQE1 medical educator. Extract every possible flashcard from the provided Toronto Notes pages as a JSON array. Output ONLY a valid JSON array with no other text or commentary. Each card: {"question":"clinical vignette or direct question","answer":"concise correct answer","difficulty":1-5,"tags":["medical topics"],"bloomLevel":"recall|apply|analyze","explanation":"2-3 sentence rationale"}';

function ensureDir(dir) { mkdirSync(dir, { recursive: true }); }
function hashQ(q) { return 'card-' + createHash('sha256').update(q.trim().toLowerCase()).digest('hex').slice(0, 12); }

export function loadCheckpoint() {
  if (existsSync(CHECKPOINT_FILE)) return JSON.parse(readFileSync(CHECKPOINT_FILE, 'utf8'));
  const pages = readdirSync(TEXT_DIR).length;
  return { lastCompletedEpoch: -1, totalEpochs: Math.ceil(pages / EPOCH_SIZE), processedPages: 0, extractedCards: 0, startedAt: new Date().toISOString(), lastUpdatedAt: new Date().toISOString() };
}

export function saveCheckpoint(cp) { cp.lastUpdatedAt = new Date().toISOString(); writeFileSync(CHECKPOINT_FILE, JSON.stringify(cp, null, 2)); }

export function getEpochPages(epochNum) {
  const files = readdirSync(TEXT_DIR).sort();
  const start = epochNum * EPOCH_SIZE;
  return files.slice(start, Math.min(start + EPOCH_SIZE, files.length)).map(f => join(TEXT_DIR, f));
}

function parseStream(raw) {
  let text = '';
  for (const line of raw.trim().split('\n')) {
    try {
      const ev = JSON.parse(line);
      if (ev.type === 'text' && ev.part?.text) text += ev.part.text;
      if (ev.type === 'error') {
        const s = JSON.stringify(ev.error);
        return { text, isRateLimit: (ev.error?.data?.statusCode === 429) || /rate.?limit|too many requests|quota exceeded/i.test(s), errorMsg: ev.error?.data?.message || s };
      }
    } catch {}
  }
  return { text, isRateLimit: false };
}

function extractCards(text) {
  const stripped = text.replace(/```[a-z]*\n?/g, '').replace(/```/g, '');
  const match = stripped.match(/\[[\s\S]*\]/);
  if (!match) return null;
  return JSON.parse(match[0]);
}

function runCLI(bin, args) {
  return spawnSync(bin, args, { timeout: 300000, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
}

function runChunk(tool, pageFiles, epochNum, chunkStart) {
  const sections = pageFiles.map((f, i) => {
    const pageNum = chunkStart + i + 1;
    try { return `=== PAGE ${pageNum} ===\n${readFileSync(f, 'utf8')}`; }
    catch { return `=== PAGE ${pageNum} ===\n[page unavailable]`; }
  });
  const message = `${EXTRACTION_PROMPT}\n\n${sections.join('\n\n')}`;
  const r = runCLI(tool.bin, ['run', '-m', tool.model, '--format', 'json', message]);
  return parseStream(r.stdout || '');
}

export async function extractEpoch(epochNum, preferredTool = 'kilo') {
  const cp = loadCheckpoint();
  if (epochNum <= cp.lastCompletedEpoch) return { skipped: true, epochNum };

  const pageFiles = getEpochPages(epochNum);
  if (pageFiles.length === 0) return { cards: [], epochNum, tool: preferredTool };

  const tools = preferredTool === 'kilo'
    ? [{ bin: KILO_BIN, model: KILO_MODEL, name: 'kilo' }, { bin: OPENCODE_CMD, model: OPENCODE_MODEL, name: 'opencode' }]
    : [{ bin: OPENCODE_CMD, model: OPENCODE_MODEL, name: 'opencode' }, { bin: KILO_BIN, model: KILO_MODEL, name: 'kilo' }];

  const allCards = [];
  let activeTool = tools[0];
  let rateLimitedTools = new Set();

  for (let i = 0; i < pageFiles.length; i += CHUNK_SIZE) {
    const chunk = pageFiles.slice(i, i + CHUNK_SIZE);
    const chunkStart = epochNum * EPOCH_SIZE + i;
    let chunkDone = false;

    for (const tool of tools) {
      if (rateLimitedTools.has(tool.name)) continue;
      const parsed = runChunk(tool, chunk, epochNum, chunkStart);

      if (parsed.isRateLimit) { rateLimitedTools.add(tool.name); continue; }
      if (!parsed.text) continue;

      const cards = extractCards(parsed.text);
      if (!cards) continue;

      activeTool = tool;
      allCards.push(...cards);
      chunkDone = true;
      break;
    }

    if (!chunkDone && rateLimitedTools.size === tools.length) {
      throw new Error(`All tools rate-limited during epoch ${epochNum} chunk at page ${chunkStart + 1}`);
    }
  }

  const enriched = allCards.map(c => ({
    ...c, id: hashQ(c.question),
    sourcePageStart: epochNum * EPOCH_SIZE + 1,
    sourcePageEnd: Math.min((epochNum + 1) * EPOCH_SIZE, 1595),
    sourcePageImages: pageFiles,
    extractedAt: new Date().toISOString(),
    checkpointEpoch: epochNum
  }));

  return { cards: enriched, epochNum, pageFiles, tool: activeTool.name };
}

export async function processEpoch(epochNum, preferredTool = 'kilo') {
  try {
    const result = await extractEpoch(epochNum, preferredTool);
    if (result.skipped) return { status: 'skipped', epochNum };

    ensureDir(OUTPUT_DIR);
    const filePath = `${OUTPUT_DIR}/epoch_${String(epochNum).padStart(3, '0')}.json`;
    writeFileSync(filePath, JSON.stringify(result.cards, null, 2));

    const cp = loadCheckpoint();
    cp.lastCompletedEpoch = epochNum;
    cp.processedPages = (epochNum + 1) * EPOCH_SIZE;
    cp.extractedCards += result.cards.length;
    saveCheckpoint(cp);

    return { status: 'success', epochNum, cardCount: result.cards.length, filePath, tool: result.tool };
  } catch (e) {
    return { status: 'error', epochNum, error: e.message };
  }
}

export { EPOCH_SIZE };
