import { db } from './db.ts';
import { pack, unpack } from 'msgpackr';
import { loadConfig, deriveConfig, setConfigKey } from '../src/config.js';
import { activeSyllabus, listSyllabi } from '../src/syllabus/loader.js';
import { getDueCards, updateCard, getScheduleStats } from '../src/scheduler/index.js';
import { generateCardsForTopic } from '../src/cards/generator.js';
import { generateDailyPlan } from '../src/daily/planner.js';
import { SRSProtocol } from '../src/acp/index.js';
import { validateCoverage } from './validate.ts';
import { converseStart, converseTurn, converseGet } from './converse.ts';

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
    try { const { data } = await db().from('cards').select('*'); return respond(req, data ?? []); }
    catch { return respond(req, []); }
  }

  if (path === '/api/stats' && method === 'GET') {
    try {
      const { data: cards } = await db().from('cards').select('id');
      const ids = (cards ?? []).map((c: any) => c.id);
      return respond(req, { ...getScheduleStats(ids), dueCount: getDueCards(ids).length });
    } catch { return respond(req, { total: 0, dueCount: 0, avgEaseFactor: 1.3, avgLastScore: null }); }
  }

  if (path === '/api/due' && method === 'GET') {
    try {
      const { data: cards } = await db().from('cards').select('*');
      const ids = getDueCards((cards ?? []).map((c: any) => c.id));
      return respond(req, (cards ?? []).filter((c: any) => ids.includes(c.id)));
    } catch { return respond(req, []); }
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
        let total = 0;
        try { const { data: cards } = await db().from('cards').select('*'); total = cards?.length ?? 0; } catch {}
        await writer.write(enc({ done: true, generated: r.generated, total }));
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

  if (path === '/api/validate' && method === 'GET') {
    try {
      let cards: any[] = [];
      try { const { data } = await db().from('cards').select('*'); cards = data ?? []; } catch {}
      return respond(req, await validateCoverage(cards));
    } catch (e: any) { return respond(req, { error: e.message }, 500); }
  }

  if (path === '/api/converse' && method === 'GET') {
    return respond(req, converseGet());
  }

  if (path === '/api/converse/start' && method === 'POST') {
    try {
      let topicIds: string[] = [];
      try { const { data: cards } = await db().from('cards').select('id,topicId'); topicIds = (cards ?? []).map((c: any) => c.topicId); } catch {}
      return respond(req, await converseStart(topicIds));
    } catch (e: any) { return respond(req, { error: e.message }, 500); }
  }

  if (path === '/api/converse/turn' && method === 'POST') {
    try {
      const { message } = await body(req);
      return respond(req, await converseTurn(message));
    } catch (e: any) { return respond(req, { error: e.message }, 500); }
  }

  return null;
}
