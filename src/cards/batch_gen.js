#!/usr/bin/env bun
import { readFileSync, appendFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT_DIR = join(import.meta.dir, '..', '..');
const SYLLABI_DIR = join(ROOT_DIR, 'syllabi');
const SERVER = 'http://localhost:3000';
const LOG_FILE = join(ROOT_DIR, 'data', 'batch_gen.log');

function loadTopics() {
  const manifest = JSON.parse(readFileSync(join(SYLLABI_DIR, 'mccqe1', 'manifest.json'), 'utf8'));
  const topicsPath = join(SYLLABI_DIR, 'mccqe1', manifest.topicsFile);
  return JSON.parse(readFileSync(topicsPath, 'utf8'));
}

function countForTopic(topic) {
  const ef = topic.examFrequency ?? 0.04;
  if (ef >= 0.07) return 20;
  if (ef >= 0.05) return 15;
  if (ef >= 0.04) return 10;
  return 7;
}

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.error(line);
  appendFileSync(LOG_FILE, line + '\n');
}

async function generateForTopic(topicId, count) {
  const res = await fetch(`${SERVER}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topicId, count }),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

  let done = false;
  let result = { generated: 0, total: 0 };

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (!done) {
    const { done: streamDone, value } = await reader.read();
    if (streamDone) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() ?? '';
    for (const chunk of lines) {
      if (chunk.startsWith('data: ')) {
        const data = JSON.parse(chunk.slice(6));
        if (data.done) { done = true; result = data; }
        if (data.error) throw new Error(`Generation error: ${data.error}`);
      }
    }
  }

  return result;
}

async function waitForServer() {
  for (let i = 0; i < 30; i++) {
    try {
      const r = await fetch(`${SERVER}/api/topics`);
      if (r.ok) return;
    } catch {}
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error('Server not responding at http://localhost:3000');
}

async function main() {
  const topics = loadTopics();
  const total = topics.length;
  let totalGenerated = 0;
  let totalCards = 0;

  log(`Starting batch generation for ${total} topics`);
  log(`Frequency tiers: >=7% → 20, >=5% → 15, >=4% → 10, else → 7`);

  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    const count = countForTopic(topic);
    log(`[${i + 1}/${total}] Starting: ${topic.name} (id=${topic.id}, freq=${(topic.examFrequency * 100).toFixed(0)}%, target=${count})`);

    try {
      const result = await generateForTopic(topic.id, count);
      totalGenerated += result.generated;
      totalCards = result.total;
      log(`[${i + 1}/${total}] DONE: ${topic.name} — generated=${result.generated}, total=${result.total}`);
    } catch (e) {
      log(`[${i + 1}/${total}] ERROR: ${topic.name} — ${e.message}`);
    }
  }

  log(`Batch complete. Total generated: ${totalGenerated}, Total cards: ${totalCards}`);
  console.log(JSON.stringify({ ok: true, totalGenerated, totalCards, topicsCovered: topics.length }));
}

waitForServer().then(main).catch(e => { console.error(e.message); process.exit(1); });
