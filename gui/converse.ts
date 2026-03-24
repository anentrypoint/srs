import { join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { SRSProtocol } from '../src/acp/index.js';
import { activeSyllabus } from '../src/syllabus/loader.js';
import { loadConfig, deriveConfig } from '../src/config.js';
import { getDueCards, getScheduleStats } from '../src/scheduler/index.js';

const dataDir = join(process.cwd(), 'data');
const convPath = () => join(dataDir, `conversation-${new Date().toISOString().slice(0,10)}.json`);

type Turn = { role: 'user' | 'assistant'; content: string };

function load(): Turn[] {
  const p = convPath();
  if (!existsSync(p)) return [];
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return []; }
}

function save(history: Turn[]) {
  writeFileSync(convPath(), JSON.stringify(history, null, 2));
}

function makeACP(s: any, cfg: any) {
  const systemPrompt = s.interpolate('sessionCoach', { label: s.label });
  return new SRSProtocol(systemPrompt, [{ cli: cfg.preferredCLI }, { cli: cfg.fallbackCLI }]);
}

export async function converseStart(cardIds: string[]) {
  const s = activeSyllabus();
  const cfg = deriveConfig(loadConfig());
  const topics = s.loadTopics();
  const dueTopicIds = [...new Set(cardIds.map(() => cardIds).flat())];
  const topicsSummary = cardIds.length
    ? [...new Set(cardIds)].slice(0, 8).map(id => {
        const t = topics.find((x: any) => x.id === id);
        return t ? t.name : id;
      }).join(', ')
    : 'general review';
  const stats = getScheduleStats(cardIds);
  const acp = makeACP(s, cfg);
  const prompt = s.interpolate('converseStart', {
    label: s.label,
    dueCount: cardIds.length,
    topicsSummary,
    daysRemaining: cfg.daysRemaining,
    avgEF: stats.avgEaseFactor.toFixed(2),
    avgScore: stats.avgLastScore?.toFixed(1) ?? '0.0',
  });
  const result = await acp.processLoop(prompt);
  const history: Turn[] = [{ role: 'assistant', content: result.text }];
  save(history);
  return { date: new Date().toISOString().slice(0, 10), starterMessage: result.text, topicsSummary };
}

export async function converseTurn(userMessage: string) {
  const s = activeSyllabus();
  const cfg = deriveConfig(loadConfig());
  const history = load();
  const acp = makeACP(s, cfg);
  acp.history = history;
  const prompt = s.interpolate('converseTurn', { userMessage });
  const result = await acp.processLoop(prompt);
  const updated: Turn[] = [...history, { role: 'user', content: userMessage }, { role: 'assistant', content: result.text }];
  save(updated);
  return { reply: result.text, history: updated };
}

export function converseGet() {
  return { date: new Date().toISOString().slice(0, 10), history: load() };
}
