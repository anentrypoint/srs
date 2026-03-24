import { db } from './db.ts';
import { pack, unpack } from 'msgpackr';
import { loadConfig, deriveConfig, setConfigKey } from '../src/config.js';
import { activeSyllabus, listSyllabi } from '../src/syllabus/loader.js';
import { getDueCards, updateCard, getScheduleStats } from '../src/scheduler/index.js';
import { generateCardsForTopic } from '../src/cards/generator.js';
import { generateDailyPlan } from '../src/daily/planner.js';
import { SRSProtocol } from '../src/acp/index.js';

const wantsMsgpack = (req: Request) => req.headers.get('accept')?.includes('application/x-msgpack');

function respond(req: Request, data: any, status = 200): Response {
  if (wantsMsgpack(req)) return new Response(pack(data), { status, headers: { 'content-type': 'application/x-msgpack' } });
  return Response.json(data, { status });
}

async function body(req: Request): Promise<any> {
  if (req.headers.get('content-type')?.includes('msgpack')) return unpack(new Uint8Array(await req.arrayBuffer()));
  return req.json();
}

export async function handleAPI(req: Request, path: string): Promise<Response | null> {
  const method = req.method;

  if (path === '/api/config' && method === 'GET') return respond(req, deriveConfig(loadConfig()));

  if (path === '/api/config' && method === 'POST') {
    const { key, value } = await body(req);
    try { return respond(req, setConfigKey(key, value)); }
    catch (e: any) { return respond(req, { error: e.message }, 400); }
  }

  if (path === '/api/syllabus' && method === 'GET') {
    const s = activeSyllabus();
    return respond(req, { active: s.name, label: s.label, all: listSyllabi(), groupByField: s.groupByField, gradeMap: s.gradeMap, gradeScaleLabel: s.gradeScaleLabel });
  }

  if (path === '/api/topics' && method === 'GET') return respond(req, activeSyllabus().loadTopics());

  if (path === '/api/cards' && method === 'GET') {
    const { data } = await db().from('cards').select('*');
    return respond(req, data ?? []);
  }

  if (path === '/api/stats' && method === 'GET') {
    const { data: cards } = await db().from('cards').select('id');
    const ids = (cards ?? []).map((c: any) => c.id);
    return respond(req, { ...getScheduleStats(ids), dueCount: getDueCards(ids).length });
  }

  if (path === '/api/due' && method === 'GET') {
    const { data: cards } = await db().from('cards').select('*');
    const ids = getDueCards((cards ?? []).map((c: any) => c.id));
    return respond(req, (cards ?? []).filter((c: any) => ids.includes(c.id)));
  }

  if (path === '/api/plan' && method === 'GET') {
    try { return respond(req, await generateDailyPlan()); }
    catch (e: any) { return respond(req, { error: e.message }, 500); }
  }

  if (path === '/api/generate' && method === 'POST') {
    const { topicId, count } = await body(req);
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const enc = (d: any) => new TextEncoder().encode(`data: ${JSON.stringify(d)}\n\n`);
    (async () => {
      try {
        const r = await generateCardsForTopic(topicId, count ?? 8);
        const { data: cards } = await db().from('cards').select('*');
        await writer.write(enc({ done: true, generated: r.generated, total: cards?.length ?? 0 }));
      } catch (e: any) { await writer.write(enc({ error: e.message })); }
      finally { writer.close(); }
    })();
    return new Response(stream.readable, { headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' } });
  }

  if (path === '/api/session/score' && method === 'POST') {
    const { card, userAnswer } = await body(req);
    const s = activeSyllabus();
    const cfg = deriveConfig(loadConfig());
    const acp = new SRSProtocol(s.promptTemplates.plannerSystem, [{ cli: cfg.preferredCLI }, { cli: cfg.fallbackCLI }]);
    const prompt = s.interpolate('scoreAnswer', { question: card.question, answer: card.answer, explanation: card.explanation ?? '', userAnswer });
    const result = await acp.processLoop(prompt);
    const extracted = acp.extractJSON(result);
    const score = extracted?.score ?? 3;
    updateCard(card.id, score);
    return respond(req, { score, feedback: extracted?.feedback ?? result.text });
  }

  return null;
}
