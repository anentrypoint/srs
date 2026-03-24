import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const SYLLABI_DIR = join(process.cwd(), 'syllabi');
const CONFIG_PATH = join(process.cwd(), 'config.json');

const REQUIRED = ['name','label','gradeMap','gradeRange','gradeTiers','defaults','groupByField','gradeScaleLabel','topicsFile','cardExtras','promptTemplates'];
const REQUIRED_PT = ['generatorSystem','generator','plannerSystem','planner','sessionCoach','scoreAnswer','sessionSummary'];

export function interpolate(tmpl, ctx) {
  return tmpl.replace(/\$\{(\w+)\}/g, (_, k) => ctx[k] != null ? ctx[k] : `{${k}}`);
}

export function listSyllabi() {
  if (!existsSync(SYLLABI_DIR)) throw new Error(`syllabi/ directory not found at ${SYLLABI_DIR}. Create syllabi/<name>/manifest.json to get started.`);
  return readdirSync(SYLLABI_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && existsSync(join(SYLLABI_DIR, d.name, 'manifest.json')))
    .map(d => {
      const m = JSON.parse(readFileSync(join(SYLLABI_DIR, d.name, 'manifest.json'), 'utf8'));
      return { name: m.name, label: m.label };
    });
}

export function loadSyllabus(name) {
  const manifestPath = join(SYLLABI_DIR, name, 'manifest.json');
  if (!existsSync(manifestPath)) throw new Error(`Syllabus not found: ${name} (expected ${manifestPath})`);
  let m;
  try { m = JSON.parse(readFileSync(manifestPath, 'utf8')); } catch (e) { throw new Error(`Malformed manifest at ${manifestPath}: ${e.message}`); }
  const missing = REQUIRED.filter(k => !(k in m));
  if (missing.length) throw new Error(`Manifest ${name} missing required fields: ${missing.join(', ')}`);
  const missingPT = REQUIRED_PT.filter(k => !(k in m.promptTemplates));
  if (missingPT.length) throw new Error(`Manifest ${name} missing promptTemplates: ${missingPT.join(', ')}`);
  const syllabusDir = join(SYLLABI_DIR, name);
  const topicsPath = join(syllabusDir, m.topicsFile);
  if (!existsSync(topicsPath)) throw new Error(`topicsFile not found: ${topicsPath}`);
  return {
    ...m,
    loadTopics() { return JSON.parse(readFileSync(topicsPath, 'utf8')); },
    interpolate(key, ctx) { return interpolate(m.promptTemplates[key], ctx); }
  };
}

export function activeSyllabus() {
  let name;
  if (existsSync(CONFIG_PATH)) {
    try { name = JSON.parse(readFileSync(CONFIG_PATH, 'utf8')).syllabus; } catch {}
  }
  if (!name) {
    const all = listSyllabi();
    if (!all.length) throw new Error('No syllabi found. Create syllabi/<name>/manifest.json.');
    name = all[0].name;
  }
  return loadSyllabus(name);
}
