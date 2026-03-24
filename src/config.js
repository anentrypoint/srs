import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const CONFIG_PATH = join(process.cwd(), 'config.json');

const GRADE_MAP = { pass: 439, good: 500, excellent: 540 };
const DEFAULTS = { targetGrade: 439, examDate: null, headroomDays: 7, dailyStudyMinutes: 60, preferredCLI: 'opencode', fallbackCLI: 'kilo' };

export function loadConfig() {
  if (!existsSync(CONFIG_PATH)) return { ...DEFAULTS };
  return { ...DEFAULTS, ...JSON.parse(readFileSync(CONFIG_PATH, 'utf8')) };
}

export function saveConfig(cfg) {
  writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

export function deriveConfig(cfg) {
  const grade = typeof cfg.targetGrade === 'string' ? GRADE_MAP[cfg.targetGrade] ?? 439 : cfg.targetGrade;
  const examDate = cfg.examDate ? new Date(cfg.examDate) : null;
  const now = new Date();
  const daysRemaining = examDate ? Math.ceil((examDate - now) / 86400000) : 999;
  const effectiveDays = Math.max(1, daysRemaining - (cfg.headroomDays ?? 7));
  const minEaseFactor = grade >= 540 ? 2.5 : grade >= 500 ? 2.2 : 1.8;
  return { ...cfg, targetGrade: grade, daysRemaining, effectiveDays, minEaseFactor };
}

export function setConfigKey(key, value) {
  const cfg = loadConfig();
  if (key === 'examDate') {
    const d = new Date(value);
    if (isNaN(d.getTime()) || d <= new Date()) throw new Error('examDate must be a future ISO date');
    cfg.examDate = d.toISOString().slice(0, 10);
  } else if (key === 'targetGrade') {
    cfg.targetGrade = GRADE_MAP[value] ? value : parseInt(value, 10);
    if (!GRADE_MAP[value] && (isNaN(cfg.targetGrade) || cfg.targetGrade < 300 || cfg.targetGrade > 600))
      throw new Error('targetGrade: 300-600 or pass/good/excellent');
  } else if (key === 'headroomDays') {
    cfg.headroomDays = parseInt(value, 10);
    const d = deriveConfig(cfg);
    if (cfg.headroomDays >= d.daysRemaining) throw new Error('headroomDays must be less than daysRemaining');
  } else if (key === 'dailyStudyMinutes') {
    cfg.dailyStudyMinutes = parseInt(value, 10);
  } else if (key === 'preferredCLI') {
    cfg.preferredCLI = value;
  } else {
    throw new Error(`Unknown config key: ${key}`);
  }
  saveConfig(cfg);
  return cfg;
}
