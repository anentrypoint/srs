import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { activeSyllabus, listSyllabi } from './syllabus/loader.js';

const CONFIG_PATH = join(process.cwd(), 'config.json');
const STATIC_DEFAULTS = { examDate: null, preferredCLI: 'opencode', fallbackCLI: 'kilo' };

export function loadConfig() {
  const s = activeSyllabus();
  const defaults = { ...s.defaults, ...STATIC_DEFAULTS };
  if (!existsSync(CONFIG_PATH)) return defaults;
  return { ...defaults, ...JSON.parse(readFileSync(CONFIG_PATH, 'utf8')) };
}

export function saveConfig(cfg) {
  writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

export function deriveConfig(cfg) {
  const s = activeSyllabus();
  const resolved = typeof cfg.targetGrade === 'string' ? (s.gradeMap[cfg.targetGrade] ?? s.defaults.targetGrade) : cfg.targetGrade;
  const examDate = cfg.examDate ? new Date(cfg.examDate) : null;
  const daysRemaining = examDate ? Math.ceil((examDate - new Date()) / 86400000) : 999;
  const effectiveDays = Math.max(1, daysRemaining - (cfg.headroomDays ?? 7));
  const minEaseFactor = (() => { for (const t of s.gradeTiers) if (resolved >= t.threshold) return t.minEaseFactor; return s.gradeTiers[s.gradeTiers.length - 1].minEaseFactor; })();
  const efCeiling = s.gradeTiers[0].minEaseFactor;
  return { ...cfg, targetGrade: resolved, daysRemaining, effectiveDays, minEaseFactor, efCeiling };
}

export function setConfigKey(key, value) {
  const cfg = loadConfig();
  const s = activeSyllabus();
  if (key === 'examDate') {
    const d = new Date(value);
    if (isNaN(d.getTime()) || d <= new Date()) throw new Error('examDate must be a future ISO date');
    cfg.examDate = d.toISOString().slice(0, 10);
  } else if (key === 'targetGrade') {
    const alias = s.gradeMap[value];
    const num = alias ?? parseInt(value, 10);
    const [lo, hi] = s.gradeRange;
    if (isNaN(num) || num < lo || num > hi) throw new Error(`targetGrade: ${lo}-${hi} or ${Object.keys(s.gradeMap).join('/')}`);
    cfg.targetGrade = alias ? value : num;
  } else if (key === 'headroomDays') {
    cfg.headroomDays = parseInt(value, 10);
    if (cfg.headroomDays >= deriveConfig(cfg).daysRemaining) throw new Error('headroomDays must be less than daysRemaining');
  } else if (key === 'dailyStudyMinutes') {
    cfg.dailyStudyMinutes = parseInt(value, 10);
  } else if (key === 'preferredCLI') {
    cfg.preferredCLI = value;
  } else if (key === 'syllabus') {
    const names = listSyllabi().map(s => s.name);
    if (!names.includes(value)) throw new Error(`Unknown syllabus: ${value}. Available: ${names.join(', ')}`);
    cfg.syllabus = value;
  } else {
    throw new Error(`Unknown config key: ${key}`);
  }
  saveConfig(cfg);
  return cfg;
}
