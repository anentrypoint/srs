import { join, extname } from 'path';
import { startDB, importJSONToTables, stopDB } from './db.ts';
import { handleAPI } from './api.ts';

const CLIENT_DIR = join(import.meta.dir, 'client');
const DATA_DIR = join(import.meta.dir, '..', 'data');
const PORT = parseInt(process.env.PORT ?? '3000', 10);

const transpiler = new Bun.Transpiler({
  loader: 'jsx',
  tsconfig: JSON.stringify({ compilerOptions: { jsxFactory: 'webjsx.createElement', jsxFragmentFactory: 'webjsx.Fragment', jsx: 'react' } }),
});

const MIME: Record<string, string> = { '.js': 'text/javascript', '.jsx': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };

async function serveStatic(filePath: string): Promise<Response | null> {
  const file = Bun.file(filePath);
  if (!await file.exists()) return null;
  const ext = extname(filePath);
  if (ext === '.jsx') {
    const src = await file.text();
    const js = transpiler.transformSync(src);
    return new Response(js, { headers: { 'content-type': 'text/javascript' } });
  }
  return new Response(file, { headers: { 'content-type': MIME[ext] ?? 'application/octet-stream' } });
}

async function fetch(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path.startsWith('/api/')) {
    const res = await handleAPI(req, path);
    if (res) return res;
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  if (path.startsWith('/node_modules/')) {
    const filePath = join(import.meta.dir, '..', path.slice(1));
    const res = await serveStatic(filePath);
    return res ?? new Response('Not found', { status: 404 });
  }

  const staticPath = path === '/' ? join(CLIENT_DIR, 'index.html') : join(CLIENT_DIR, path.slice(1));
  const staticRes = await serveStatic(staticPath);
  if (staticRes) return staticRes;

  return new Response(await Bun.file(join(CLIENT_DIR, 'index.html')).text(), { headers: { 'content-type': 'text/html' } });
}

console.log(`Starting busybase...`);
await startDB(DATA_DIR);
await importJSONToTables(DATA_DIR);
console.log(`SRS GUI ready → http://localhost:${PORT}`);

const server = Bun.serve({ port: PORT, fetch });

process.on('SIGINT', () => { stopDB(); server.stop(); process.exit(0); });
process.on('SIGTERM', () => { stopDB(); server.stop(); process.exit(0); });
