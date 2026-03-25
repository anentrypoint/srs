import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import { spawn } from 'child_process';

const STORE = 'C:/dev/srs-mccqe1/data/cards.json';
const LOG = 'C:/dev/srs-mccqe1/data/batch_gen.log';

const systemPrompt = "You are an expert Canadian medical educator creating MCCQE1 exam preparation flashcards.";
const generatorTemplate = "Generate ${count} MCCQE1 flashcards for the topic: \"${topicName}\" (${groupValue}).\n\nEach card must be a JSON object with:\n- question: clinical vignette or direct question (string)\n- answer: concise correct answer (string)\n- difficulty: 1-5 (1=easy recall, 5=hard analysis)\n- tags: array of relevant tags\n- bloomLevel: one of recall/apply/analyze\n- explanation: 2-3 sentence explanation linking to Canadian clinical guidelines\n\nOutput ONLY a JSON array of ${count} card objects. No preamble, no trailing text.";

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
  process.stderr.write(line + '\n');
  writeFileSync(LOG, line + '\n', { flag: 'a' });
}

async function generateTopicOpencode(topic, count) {
  const prompt = generatorTemplate
    .replace(/\${count}/g, count)
    .replace(/\${topicName}/g, topic.name)
    .replace(/\${groupValue}/g, topic.discipline ?? topic.id);

  const fullPrompt = `${systemPrompt}\n\n${prompt}`;

  return new Promise((resolve, reject) => {
    const args = ['run', '--format', 'json', fullPrompt];
    let output = '';
    let stderr = '';

    const child = spawn('opencode', args, { shell: true });
    child.stdout.on('data', (data) => { output += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });

    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error('Timeout after 180000ms'));
    }, 180000);

    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code !== 0 && code !== null) {
        reject(new Error(`opencode exited with code ${code}: ${stderr}`));
        return;
      }

      try {
        const jsonMatch = output.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          reject(new Error('No JSON array in response: ' + output.substring(0, 500)));
          return;
        }
        const cards = JSON.parse(jsonMatch[0]);
        resolve(cards);
      } catch (e) {
        reject(new Error('Failed to parse JSON: ' + e.message + ' | Output: ' + output.substring(0, 500)));
      }
    });
  });
}

log('Starting batch generation via opencode CLI for ' + topics.length + ' topics');
log('Frequency tiers: >=7% -> 20, >=5% -> 15, >=4% -> 10, else -> 7');

let totalAdded = 0;
let errors = 0;

for (let i = 0; i < topics.length; i++) {
  const t = topics[i];
  const count = Math.min(5, minCards(t.examFrequency ?? 0.04));
  log('[' + (i+1) + '/' + topics.length + '] Starting: ' + t.name + ' (id=' + t.id + ', target=' + count + ')');

  try {
    const cards = await generateTopicOpencode(t, count);
    const added = upsertCards(cards, t.id);
    totalAdded += added;
    log('[' + (i+1) + '/' + topics.length + '] DONE: ' + t.name + ' -> ' + added + ' new cards (total: ' + loadCards().length + ')');
  } catch(e) {
    errors++;
    log('[' + (i+1) + '/' + topics.length + '] ERROR: ' + t.name + ': ' + e.message.substring(0, 200));
  }

  await new Promise(r => setTimeout(r, 2000));
}

log('BATCH COMPLETE. Total new cards: ' + totalAdded + '. Errors: ' + errors + '. Total in store: ' + loadCards().length);
process.stdout.write(JSON.stringify({ totalAdded, errors, total: loadCards().length }) + '\n');
