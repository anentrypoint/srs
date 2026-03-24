import { join } from 'path';

let bbClient: any = null;
let bbPort = 54321;
let bbProc: ReturnType<typeof Bun.spawn> | null = null;

export async function startDB(dataDir: string): Promise<void> {
  const busybaseBin = join(import.meta.dir, '..', 'node_modules', '.bin', 'busybase');
  bbProc = Bun.spawn(
    [busybaseBin, 'serve'],
    { env: { ...process.env, BUSYBASE_PORT: String(bbPort), BUSYBASE_DATA: dataDir }, stdout: 'ignore', stderr: 'ignore', cwd: join(import.meta.dir, '..') }
  );
  for (let i = 0; i < 20; i++) {
    await Bun.sleep(300);
    try { const r = await fetch(`http://localhost:${bbPort}/`); if (r.status < 500) break; } catch {}
  }
  const { default: BB } = await import('busybase');
  bbClient = BB(`http://localhost:${bbPort}`, 'local');
}

export function db(): any {
  if (!bbClient) throw new Error('DB not started — call startDB() first');
  return bbClient;
}

export function stopDB(): void {
  bbProc?.kill();
  bbProc = null;
  bbClient = null;
}

export async function importJSONToTables(dataPath: string): Promise<void> {
  const client = db();
  const cardsPath = join(dataPath, 'cards.json');
  const statesPath = join(dataPath, 'card-states.json');

  if (await Bun.file(cardsPath).exists()) {
    const cards: any[] = JSON.parse(await Bun.file(cardsPath).text());
    const { data: existing } = await client.from('cards').select('id');
    const existingIds = new Set((existing ?? []).map((r: any) => r.id));
    const toInsert = cards.filter((c: any) => !existingIds.has(c.id));
    if (toInsert.length) await client.from('cards').insert(toInsert);
  }

  if (await Bun.file(statesPath).exists()) {
    const states: Record<string, any> = JSON.parse(await Bun.file(statesPath).text());
    const rows = Object.entries(states).map(([cardId, s]: [string, any]) => ({ cardId, ...s }));
    const { data: existing } = await client.from('card_states').select('cardId');
    const existingIds = new Set((existing ?? []).map((r: any) => r.cardId));
    const toInsert = rows.filter(r => !existingIds.has(r.cardId));
    if (toInsert.length) await client.from('card_states').insert(toInsert);
  }
}
