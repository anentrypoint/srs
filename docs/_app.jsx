/** @jsxRuntime classic */
/** @jsx h */
/** @jsxFrag Fragment */
import { createElement as h, applyDiff, Fragment } from './webjsx.js';

// ─── SM2 ─────────────────────────────────────────────────────────────────────
function calcSM2(state, score) {
  if (score < 3) return { ...state, interval: 1, repetitions: 0 };
  const ef = Math.max(1.3, state.easeFactor + 0.1 - (5 - score) * (0.08 + (5 - score) * 0.02));
  const interval = state.repetitions === 0 ? 1 : state.repetitions === 1 ? 6 : Math.round(state.interval * ef);
  return { easeFactor: ef, interval, repetitions: state.repetitions + 1 };
}
function defState() { return { easeFactor: 2.5, interval: 1, repetitions: 0, dueDate: today(), lastScore: null }; }
function today() { return new Date().toISOString().slice(0, 10); }
function addDays(n) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

// ─── Storage ──────────────────────────────────────────────────────────────────
const SK = 'mccqe1_states', CK = 'mccqe1_cfg';
const loadStates = () => { try { return JSON.parse(localStorage.getItem(SK) || '{}'); } catch { return {}; } };
const saveStates = s => localStorage.setItem(SK, JSON.stringify(s));
const loadCfg = () => ({ examDate: '2026-06-15', dailyStudyMinutes: 60, newCardsPerDay: 0, targetGrade: 'pass', ...JSON.parse(localStorage.getItem(CK) || '{}') });
const saveCfg = c => localStorage.setItem(CK, JSON.stringify(c));
const daysLeft = cfg => cfg.examDate ? Math.max(0, Math.ceil((new Date(cfg.examDate) - new Date()) / 86400000)) : 999;

// ─── SRS ─────────────────────────────────────────────────────────────────────
const isSeen = (states, id) => !!states[id]?.lastScore;
const isReviewDue = (states, id) => isSeen(states, id) && states[id].dueDate <= today();
function calcNewPerDay(cards, states, cfg) {
  const unseen = cards.filter(c => !isSeen(states, c.id)).length;
  const dr = daysLeft(cfg);
  const deadline = Math.max(1, dr - 14); // finish 2 weeks before exam
  const auto = Math.ceil(unseen / deadline);
  // 0 = auto-calculate from deadline; otherwise use user override
  const perDay = cfg.newCardsPerDay > 0 ? cfg.newCardsPerDay : auto;
  return { perDay, auto, unseen, deadline };
}
function getNewCardsToday(cards, states, cfg) {
  const { perDay } = calcNewPerDay(cards, states, cfg);
  const t = today();
  const introducedToday = cards.filter(c => states[c.id]?.introducedOn === t).length;
  const remaining = Math.max(0, perDay - introducedToday);
  return cards.filter(c => !isSeen(states, c.id) && !states[c.id]?.introducedOn).slice(0, remaining);
}
function getDue(cards) {
  const s = loadStates(), cfg = loadCfg();
  const reviews = cards.filter(c => isReviewDue(s, c.id));
  const newCards = getNewCardsToday(cards, s, cfg);
  return [...reviews, ...newCards];
}
function updateCard(id, score) {
  const states = loadStates();
  const prev = states[id] ?? defState();
  const next = calcSM2(prev, score);
  states[id] = { ...next, dueDate: addDays(next.interval), lastScore: score, introducedOn: prev.introducedOn || today() };
  saveStates(states);
}
function getStats(cards) {
  const states = loadStates(), cfg = loadCfg(), t = today();
  const seen = cards.filter(c => isSeen(states, c.id));
  const unseen = cards.filter(c => !isSeen(states, c.id));
  const reviews = cards.filter(c => isReviewDue(states, c.id));
  const newToday = getNewCardsToday(cards, states, cfg);
  const due = reviews.length + newToday.length;
  const avgEF = seen.length ? seen.reduce((s, c) => s + (states[c.id]?.easeFactor ?? 2.5), 0) / seen.length : 0;
  const scored = cards.filter(c => states[c.id]?.lastScore != null);
  const avgScore = scored.length ? scored.reduce((s, c) => s + states[c.id].lastScore, 0) / scored.length : null;
  return { total: cards.length, due, reviews: reviews.length, newToday: newToday.length, seen: seen.length, unseen: unseen.length, avgEF, avgScore };
}

// ─── App state ────────────────────────────────────────────────────────────────
let CARDS = [], view = 'loading', ctx = {};
const go = (v, extra = {}) => { view = v; ctx = { ...ctx, ...extra }; render(); };
const root = document.getElementById('app');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const bloomClass = b => b === 'recall' ? 'bloom-recall' : b === 'apply' ? 'bloom-apply' : 'bloom-analyze';
const bloomLabel = b => b ?? 'recall';

// ─── Views ────────────────────────────────────────────────────────────────────
function Loading() {
  return (
    <div class="shell" style="display:flex;align-items:center;justify-content:center;min-height:100vh;">
      <div style="text-align:center;display:flex;flex-direction:column;align-items:center;gap:16px;">
        <div class="spinner"></div>
        <p style="color:var(--text2);font-size:0.875rem;">Loading cards…</p>
      </div>
    </div>
  );
}

function Dashboard() {
  const cfg = loadCfg(), stats = getStats(CARDS), dr = daysLeft(cfg);
  const gp = Math.round(Math.max(0, Math.min(100, (stats.avgEF - 1.3) / (2.5 - 1.3) * 100)));
  const pct = v => Math.round(Math.max(0, Math.min(100, (v - 1.3) / (2.5 - 1.3) * 100)));
  const grades = [['Fail','1.3', pct(1.3)], ['Pass','2.0', pct(2.0)], ['Honours','2.5', pct(2.5)]];

  return (
    <div class="shell fade-in">
      <div class="page">

        {/* header */}
        <div class="nav">
          <div>
            <div class="title">MCCQE1 SRS</div>
            <div class="subtitle">Spaced Repetition · Canadian Medical Licensing</div>
          </div>
          <button class="btn-ghost" onclick={() => render()} title="Refresh">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M1 4v6h6"/><path d="M23 20v-6h-6"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
            </svg>
            Refresh
          </button>
        </div>

        {/* stat tiles */}
        <div class="stat-grid" style="margin-bottom:20px;">
          {[
            { key: 'Reviews Due', val: stats.reviews,         hi: stats.reviews > 0 },
            { key: 'New Today',   val: stats.newToday,        hi: stats.newToday > 0 },
            { key: 'Learned',     val: stats.seen.toLocaleString() + ' / ' + stats.total.toLocaleString(), hi: false },
            { key: 'Days Left',   val: dr,                    hi: dr <= 14 },
          ].map(({ key, val, hi }) =>
            <div class={'stat-tile' + (hi ? ' hi' : '')}>
              <div class="val">{String(val)}</div>
              <div class="key">{key}</div>
            </div>
          )}
        </div>

        {/* grade progress */}
        <div class="gcard" style="padding:1.25rem 1.5rem;margin-bottom:20px;">
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px;">
            <span style="font-weight:600;font-size:0.9375rem;">Grade Progress</span>
            <span style="font-size:0.8125rem;color:var(--text2);">EF {stats.avgEF.toFixed(2)} / 2.50</span>
          </div>
          <div class="prog-track" style="margin-bottom:10px;">
            <div class="prog-fill" style={'width:' + Math.max(gp, 1) + '%'}></div>
          </div>
          <div style="display:flex;justify-content:space-between;">
            {grades.map(([label, val, pos]) =>
              <div style="text-align:center;">
                <div style="font-size:0.75rem;font-weight:600;color:var(--text2);">{val}</div>
                <div style={'font-size:0.6875rem;color:' + (pos <= gp ? 'var(--accent)' : 'var(--text3)') + ';text-transform:uppercase;letter-spacing:0.05em;margin-top:2px;'}>{label}</div>
              </div>
            )}
          </div>
        </div>

        {/* exam countdown */}
        {cfg.examDate &&
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;padding:12px 16px;background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.15);border-radius:12px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span style="font-size:0.8125rem;color:var(--text2);">Exam <strong style="color:var(--text1);">{cfg.examDate}</strong> — <strong style="color:var(--accent);">{dr} days</strong> remaining</span>
          </div>
        }

        {/* daily workflow */}
        <div class="gcard" style="padding:1.25rem;margin-bottom:16px;">
          <div class="label-xs" style="margin-bottom:12px;">Daily Workflow</div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <button class={'btn-study' + (stats.due === 0 ? ' disabled' : '')} style="width:100%;justify-content:center;" onclick={() => stats.due > 0 && go('prompt')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
              {stats.due > 0 ? `1. Get Daily Prompt (${stats.reviews} reviews + ${stats.newToday} new)` : 'All Caught Up for Today'}
            </button>
            <button class="btn-ghost" style="width:100%;justify-content:center;padding:0.65rem;" onclick={() => go('assess')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              2. Submit Results from AI Session
            </button>
          </div>
        </div>

        {/* quick study + nav */}
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
          <button class={'btn-ghost' + (stats.due === 0 ? ' disabled' : '')} onclick={() => stats.due > 0 && startSession()}>
            Quick Study (in-app cards)
          </button>
          <div style="display:flex;gap:8px;margin-left:auto;">
            {[['Stats','stats'],['Topics','topics'],['Config','config']].map(([l,v]) =>
              <button class="btn-ghost" onclick={() => go(v)}>{l}</button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function startSession() {
  const due = getDue(CARDS);
  ctx = { session: { cards: due, index: 0, results: [] }, phase: 'question' };
  go('session');
}

function Session() {
  const { session, phase } = ctx;
  const card = session.cards[session.index];
  const progress = session.cards.length ? Math.round(session.index / session.cards.length * 100) : 0;
  const isLast = session.index >= session.cards.length - 1;

  if (!card) return SessionComplete();

  const scoreLabels = ['','Blank','Wrong','Hard','Good','Easy'];
  const scoreCls   = ['','s1','s2','s3','s4','s5'];

  return (
    <div class="shell fade-in">
      <div class="page">

        {/* top bar */}
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <button class="btn-ghost" onclick={() => go('dashboard')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Exit
            </button>
            <span style="font-size:0.8125rem;color:var(--text2);">{session.index + 1} <span style="color:var(--text3);">/ {session.cards.length}</span></span>
          </div>
          <span style="font-size:0.8125rem;color:var(--text2);font-weight:600;">{progress}%</span>
        </div>

        {/* progress */}
        <div class="prog-track thin" style="margin-bottom:24px;">
          <div class="prog-fill" style={'width:' + Math.max(progress, 0.5) + '%'}></div>
        </div>

        {/* question card */}
        <div class="gcard" style="padding:1.5rem;margin-bottom:16px;">
          <div style="display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-bottom:16px;">
            <span class="badge-topic">{card.topicId}</span>
            <span class={'badge-bloom ' + bloomClass(card.bloomLevel)}>{bloomLabel(card.bloomLevel)}</span>
            {card.difficulty &&
              <span style="font-size:0.6875rem;color:var(--text3);margin-left:4px;">
                {'★'.repeat(card.difficulty) + '☆'.repeat(5 - card.difficulty)}
              </span>
            }
          </div>
          <p class="card-question">{card.question}</p>
        </div>

        {/* reveal button */}
        {phase === 'question' &&
          <button class="btn-reveal" onclick={() => go('session', { phase: 'answer' })}>
            Reveal Answer
          </button>
        }

        {/* answer + scoring */}
        {phase === 'answer' &&
          <div class="gcard-inner fade-in" style="padding:1.25rem;">
            <div style="margin-bottom:1rem;">
              <div class="label-xs" style="margin-bottom:8px;">Answer</div>
              <p class="card-answer">{card.answer}</p>
            </div>

            {card.explanation &&
              <div>
                <div class="divider"></div>
                <div class="label-xs" style="margin-bottom:8px;">Explanation</div>
                <p class="card-explain">{card.explanation}</p>
              </div>
            }

            <div class="divider"></div>
            <div class="label-xs" style="margin-bottom:10px;">How well did you know this?</div>
            <div class="score-grid">
              {[1,2,3,4,5].map(score =>
                <button
                  class={'score-btn ' + scoreCls[score]}
                  onclick={() => {
                    updateCard(card.id, score);
                    session.results.push({ cardId: card.id, score });
                    if (isLast) go('session_complete', { lastResults: [...session.results] });
                    else { session.index++; go('session', { phase: 'question' }); }
                  }}>
                  <span class="num">{score}</span>
                  <span class="lbl">{scoreLabels[score]}</span>
                </button>
              )}
            </div>
          </div>
        }

      </div>
    </div>
  );
}

function SessionComplete() {
  const results = ctx.lastResults ?? ctx.session?.results ?? [];
  const avg = results.length ? (results.reduce((s, r) => s + r.score, 0) / results.length).toFixed(1) : '—';
  const correct = results.filter(r => r.score >= 4).length;
  const pct = results.length ? Math.round(correct / results.length * 100) : 0;

  return (
    <div class="shell" style="display:flex;align-items:center;justify-content:center;min-height:100vh;">
      <div class="gcard fade-in" style="padding:2.5rem;max-width:400px;width:100%;text-align:center;">
        <div style="font-size:2.5rem;margin-bottom:12px;">🎉</div>
        <div style="font-size:1.375rem;font-weight:700;margin-bottom:6px;">Session Complete</div>
        <div style="font-size:0.875rem;color:var(--text2);margin-bottom:1.75rem;">
          {pct}% correct — great work
        </div>

        <div class="complete-grid">
          <div class="complete-stat">
            <div class="v" style="color:var(--accent);">{results.length}</div>
            <div class="k">Cards</div>
          </div>
          <div class="complete-stat">
            <div class="v" style="color:var(--success);">{correct}</div>
            <div class="k">Correct</div>
          </div>
          <div class="complete-stat">
            <div class="v">{avg}</div>
            <div class="k">Avg Score</div>
          </div>
        </div>

        <button class="btn-study" style="width:100%;justify-content:center;" onclick={() => go('dashboard')}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

function Stats() {
  const states = loadStates(), stats = getStats(CARDS);
  const byTopic = {};
  for (const c of CARDS) {
    if (!byTopic[c.topicId]) byTopic[c.topicId] = { total: 0, seen: 0, due: 0, ef: 0 };
    const t = byTopic[c.topicId];
    const seen = isSeen(states, c.id);
    t.total++;
    if (seen) { t.seen++; t.ef += states[c.id].easeFactor; }
    if (isReviewDue(states, c.id)) t.due++;
  }
  for (const t of Object.values(byTopic)) t.ef = t.seen > 0 ? (t.ef / t.seen).toFixed(2) : '—';
  const rows = Object.entries(byTopic).sort((a, b) => b[1].due - a[1].due);

  return (
    <div class="shell fade-in">
      <div class="page-wide">
        <div class="nav">
          <div style="display:flex;align-items:center;gap:12px;">
            <button class="btn-ghost" onclick={() => go('dashboard')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Back
            </button>
            <span class="title" style="font-size:1.25rem;">Statistics</span>
          </div>
        </div>

        <div class="stat-grid" style="margin-bottom:24px;">
          {[
            { k: 'Total Cards',  v: stats.total.toLocaleString() },
            { k: 'Learned',      v: stats.seen.toLocaleString() },
            { k: 'Reviews Due',  v: stats.reviews },
            { k: 'Avg Score',    v: stats.avgScore?.toFixed(1) ?? '—' },
          ].map(({ k, v }) =>
            <div class="stat-tile">
              <div class="val">{String(v)}</div>
              <div class="key">{k}</div>
            </div>
          )}
        </div>

        <div class="gcard" style="overflow:hidden;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Topic</th>
                <th class="r">Cards</th>
                <th class="r">Learned</th>
                <th class="r">Review</th>
                <th class="r">Avg EF</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([tid, t]) =>
                <tr>
                  <td style="font-family:'SF Mono','Fira Code',monospace;font-size:0.8125rem;color:var(--text2);">{tid}</td>
                  <td class="r" style="color:var(--text2);">{t.total}</td>
                  <td class="r" style="color:var(--text3);">{t.seen}</td>
                  <td class="r" style={t.due > 0 ? 'color:var(--accent);font-weight:600;' : 'color:var(--text3);'}>{t.due}</td>
                  <td class="r" style="color:var(--text3);">{t.ef}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Topics() {
  const byTopic = {};
  for (const c of CARDS) byTopic[c.topicId] = (byTopic[c.topicId] || 0) + 1;
  const topics = Object.entries(byTopic).sort((a, b) => b[1] - a[1]);

  return (
    <div class="shell fade-in">
      <div class="page-wide">
        <div class="nav">
          <div style="display:flex;align-items:center;gap:12px;">
            <button class="btn-ghost" onclick={() => go('dashboard')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Back
            </button>
            <span class="title" style="font-size:1.25rem;">Topics <span style="color:var(--text3);font-size:0.875rem;font-weight:400;">({topics.length})</span></span>
          </div>
        </div>

        <div class="topic-grid">
          {topics.map(([tid, count]) =>
            <div class="topic-chip">
              <span class="tid">{tid}</span>
              <span class="cnt">{count}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Config() {
  const cfg = loadCfg();
  let examEl, minsEl, newEl;

  return (
    <div class="shell fade-in">
      <div class="page" style="max-width:520px;">
        <div class="nav">
          <div style="display:flex;align-items:center;gap:12px;">
            <button class="btn-ghost" onclick={() => go('dashboard')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Back
            </button>
            <span class="title" style="font-size:1.25rem;">Settings</span>
          </div>
        </div>

        <div class="gcard" style="padding:1.5rem;margin-bottom:16px;">
          <div style="display:flex;flex-direction:column;gap:16px;">
            <div class="field">
              <label>Exam Date</label>
              <input type="date" value={cfg.examDate} ref={e => examEl = e} />
            </div>
            <div class="field">
              <label>New Cards Per Day <span style="font-weight:400;color:var(--text3);">(0 = auto from deadline)</span></label>
              <input type="number" min="0" max="500" value={String(cfg.newCardsPerDay)} ref={e => newEl = e} />
            </div>
            <div class="field">
              <label>Daily Study Minutes</label>
              <input type="number" min="10" max="360" value={String(cfg.dailyStudyMinutes)} ref={e => minsEl = e} />
            </div>
          </div>
          <div style="display:flex;gap:10px;margin-top:20px;">
            <button class="btn-study" style="flex:1;justify-content:center;padding:0.75rem;" onclick={() => {
              saveCfg({ ...cfg, examDate: examEl.value || cfg.examDate, newCardsPerDay: parseInt(newEl.value) || cfg.newCardsPerDay, dailyStudyMinutes: parseInt(minsEl.value) || cfg.dailyStudyMinutes });
              go('dashboard');
            }}>Save Settings</button>
            <button class="btn-ghost" style="color:#f87171;border-color:rgba(239,68,68,0.25);" onclick={() => {
              if (confirm('Reset all SRS progress? This cannot be undone.')) {
                localStorage.removeItem(SK); go('dashboard');
              }
            }}>Reset</button>
          </div>
        </div>

        <div class="gcard" style="padding:1.25rem;">
          <div style="font-size:0.8125rem;font-weight:600;margin-bottom:8px;">Data Storage</div>
          <div style="font-size:0.8125rem;color:var(--text2);line-height:1.6;margin-bottom:10px;">
            All SRS progress is stored in your browser's localStorage. No account or server required.
            Your data never leaves your device.
          </div>
          <div style="display:flex;gap:16px;">
            <div>
              <div style="font-size:1.125rem;font-weight:700;">{CARDS.length.toLocaleString()}</div>
              <div class="label-xs">Cards loaded</div>
            </div>
            <div>
              <div style="font-size:1.125rem;font-weight:700;">{Object.keys(loadStates()).length.toLocaleString()}</div>
              <div class="label-xs">States tracked</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const SESSION_SIZE = 25; // cards per ChatGPT session

function buildPrompt(cards, cfg, sessionIndex = 0) {
  const states = loadStates();
  const due = getDue(cards);
  const dr = daysLeft(cfg);
  const { perDay, auto } = calcNewPerDay(cards, states, cfg);
  const reviews = due.filter(c => isSeen(states, c.id));
  const newCards = due.filter(c => !isSeen(states, c.id));
  const totalSessions = Math.ceil(due.length / SESSION_SIZE);
  const sessionCards = due.slice(sessionIndex * SESSION_SIZE, (sessionIndex + 1) * SESSION_SIZE);
  const byTopic = {};
  sessionCards.forEach(c => { const t = c.topicId || c.tags?.[0] || 'general'; byTopic[t] = (byTopic[t] || []); byTopic[t].push(c); });
  const topicSummary = Object.entries(byTopic).map(([t, cs]) => `- ${t}: ${cs.length} cards`).join('\n');
  const cardsJson = JSON.stringify(sessionCards.map(c => ({ id: c.id, question: c.question, answer: c.answer, difficulty: c.difficulty, tags: c.tags, bloomLevel: c.bloomLevel, explanation: c.explanation })), null, 2);

  return `# MCCQE1 Study Session ${sessionIndex + 1} of ${totalSessions} today

You are an expert medical education tutor preparing a student for the MCCQE Part 1 exam on ${cfg.examDate}. There are ${dr} days remaining. The student must master ${cards.length.toLocaleString()} flashcards total, doing ~${perDay} new cards/day to finish on time.

## This Session: ${sessionCards.length} cards (session ${sessionIndex + 1}/${totalSessions} for today — ${due.length} total due)

### Topics Today
${topicSummary}

## Your Teaching Approach

### Phase 1: Knowledge Discovery (first 5-10 minutes)
Before teaching anything, PROBE the student's existing knowledge on today's topics:
- Ask open-ended questions: "What do you know about [topic]?" or "Walk me through how you'd approach a patient with [symptom]"
- Listen for misconceptions, gaps, and strengths
- Identify their baseline for each topic area
- Note which concepts they can explain vs. which they only recognize

### Phase 2: Conversational Teaching (main session)
For each card/topic cluster, use this Socratic progression:

1. **Anchor** — Connect to something they already know: "You mentioned X earlier — this builds on that..."
2. **Probe** — Ask them the card question conversationally (don't just read it). Let them reason through it.
3. **If correct** — Deepen: ask WHY, ask for the mechanism, ask what would change if a variable shifted. Cement all the factors that affect this concept.
4. **If wrong/uncertain** — Teach comprehensively:
   - Explain the core concept in 2-3 clear sentences
   - Give the mechanism/pathophysiology
   - Provide a clinical scenario that illustrates it
   - Explain the key differentiating factors from similar conditions
   - Connect it to related concepts they'll see on the exam
5. **Cement** — After teaching, re-test with a slightly different angle to confirm understanding

### Phase 3: Integration & Wrap-up
- Connect today's topics across systems (e.g., how a renal condition affects cardiac management)
- Give 2-3 "exam-day tips" for today's weak areas
- Summarize what they nailed and what needs review

## Pacing Rules
- Spend more time on topics where the student shows gaps
- If they ace a topic quickly, move on — don't belabor strong areas
- For new cards, teach thoroughly. For review cards, test quickly and only re-teach if they've forgotten.
- Target: finish all ${sessionCards.length} cards within 45-60 minutes

## Today's Cards (JSON)

Each card has: id, question, answer, difficulty (1-5), tags, bloomLevel (recall/apply/analyze), explanation.

\`\`\`json
${cardsJson}
\`\`\`

## CRITICAL: End-of-Session Output

When the session is complete (all cards reviewed OR student ends early), you MUST output this exact JSON structure. The student will paste it back into their SRS app to update their schedule.

Scoring guide:
- 5: Instant correct, high confidence, could explain to others
- 4: Correct with minor hesitation
- 3: Correct after one hint or partial prompt
- 2: Partially correct or needed teaching first
- 1: Incorrect, skipped, or couldn't answer after teaching
- 0: Not attempted (session ended early)

\`\`\`json
{
  "cardsReviewed": [
    { "id": "card_id_here", "score": 4, "confident": true, "timeSpentSeconds": 30 }
  ],
  "sessionSummary": {
    "totalCards": ${sessionCards.length},
    "correctCount": 0,
    "avgScore": 0.0,
    "weakAreas": ["topic1"],
    "strongAreas": ["topic2"]
  },
  "recommendations": {
    "topicsToReview": ["topic1"],
    "adjustedDifficulty": "increase | maintain | decrease",
    "nextSessionFocus": "description of what to prioritize next"
  },
  "masteryEstimate": 0
}
\`\`\`

Include ALL cards — score 0 for any not attempted. The student's SRS schedule depends on accurate scoring.

## Begin

Start by greeting the student and asking what they remember about today's topics. Do NOT reveal answers or jump straight to quizzing — discover their knowledge first, then teach conversationally.`;
}

function Prompt() {
  const cfg = loadCfg(), due = getDue(CARDS);
  const states = loadStates();
  const dr = daysLeft(cfg);
  const { perDay } = calcNewPerDay(CARDS, states, cfg);
  const reviews = due.filter(c => isSeen(states, c.id));
  const newCards = due.filter(c => !isSeen(states, c.id));
  const totalSessions = Math.ceil(due.length / SESSION_SIZE);
  const sessionIdx = ctx.sessionIdx || 0;
  const filled = buildPrompt(CARDS, cfg, sessionIdx);

  return (
    <div class="shell fade-in">
      <div class="page">
        <div class="nav">
          <div style="display:flex;align-items:center;gap:12px;">
            <button class="btn-ghost" onclick={() => go('dashboard')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Back
            </button>
            <span class="title" style="font-size:1.25rem;">Daily Prompt</span>
          </div>
          <button class="btn-ghost" onclick={() => go('dashboard')}>Dashboard</button>
        </div>

        <div class="gcard" style="padding:1rem;margin-bottom:16px;">
          <div style="display:flex;flex-wrap:wrap;gap:16px;">
            <div><div class="label-xs">Today's Load</div><div style="font-size:1.25rem;font-weight:700;">{due.length} cards</div></div>
            <div><div class="label-xs">Sessions</div><div style="font-size:1.25rem;font-weight:700;">{totalSessions} × {SESSION_SIZE}</div></div>
            <div><div class="label-xs">Days to Exam</div><div style="font-size:1.25rem;font-weight:700;">{dr}</div></div>
            <div><div class="label-xs">Pace</div><div style="font-size:1.25rem;font-weight:700;">{perDay} new/day</div></div>
          </div>
          <div style="font-size:0.75rem;color:var(--text3);margin-top:8px;">
            {calcNewPerDay(CARDS, states, cfg).unseen.toLocaleString()} unseen of {CARDS.length.toLocaleString()} · {calcNewPerDay(CARDS, states, cfg).deadline} study days · {reviews.length} reviews + {newCards.length} new today
          </div>
        </div>

        {/* Session selector */}
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
          <button class="btn-ghost" style={sessionIdx === 0 ? 'opacity:0.3;pointer-events:none;' : ''} onclick={() => { ctx.sessionIdx = sessionIdx - 1; ctx.copied = false; render(); }}>← Prev</button>
          <div style="flex:1;text-align:center;">
            <span style="font-size:0.9375rem;font-weight:600;">Session {sessionIdx + 1} of {totalSessions}</span>
            <span style="font-size:0.75rem;color:var(--text3);margin-left:8px;">({Math.min(SESSION_SIZE, due.length - sessionIdx * SESSION_SIZE)} cards)</span>
          </div>
          <button class="btn-ghost" style={sessionIdx >= totalSessions - 1 ? 'opacity:0.3;pointer-events:none;' : ''} onclick={() => { ctx.sessionIdx = sessionIdx + 1; ctx.copied = false; render(); }}>Next →</button>
        </div>

        <div style="display:flex;gap:10px;margin-bottom:16px;">
          <button class="btn-study" style="flex:1;justify-content:center;padding:0.75rem;" onclick={() => { navigator.clipboard.writeText(filled); ctx.copied = true; render(); }}>
            {ctx.copied ? '✓ Copied!' : '1. Copy Prompt'}
          </button>
          <a href="https://chatgpt.com" target="_blank" rel="noopener" class="btn-study" style="flex:1;justify-content:center;padding:0.75rem;text-decoration:none;background:rgba(16,163,127,0.15);border-color:rgba(16,163,127,0.4);color:#10a37f;">
            2. Open ChatGPT →
          </a>
        </div>

        <div class="gcard" style="padding:1rem;margin-bottom:16px;">
          <div class="label-xs" style="margin-bottom:6px;">Daily Workflow</div>
          <ol style="font-size:0.8125rem;color:var(--text2);line-height:1.6;margin:0;padding-left:1.25rem;">
            <li>Click <strong>"Copy Prompt"</strong> then <strong>"Open ChatGPT"</strong></li>
            <li>Paste the prompt — the AI teaches today's cards conversationally</li>
            <li>At session end, the AI outputs a <strong>JSON assessment block</strong></li>
            <li>Copy that JSON, come back here → <strong>Assess</strong> → paste → <strong>Save to SRS</strong></li>
            <li>Your card schedules update automatically based on how you scored</li>
          </ol>
        </div>

        <div class="gcard" style="padding:1.25rem;">
          <div class="label-xs" style="margin-bottom:8px;">Generated Prompt (paste into your AI)</div>
          <pre style="font-size:0.7rem;line-height:1.5;color:var(--text2);white-space:pre-wrap;word-break:break-word;max-height:500px;overflow-y:auto;">{filled}</pre>
        </div>
      </div>
    </div>
  );
}

function Assess() {
  let textareaEl;

  const doProcess = () => {
    try {
      const raw = textareaEl.value;
      const jsonMatch = raw.match(/```json\s*([\s\S]*?)```/) || raw.match(/\{[\s\S]*\}/);
      const json = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : raw;
      const data = JSON.parse(json);
      const cards = data.cardsReviewed || data.cards || data;
      if (!Array.isArray(cards) || !cards.length) throw new Error('No cards found');

      const n = cards.length;
      const correct = cards.filter(c => c.score >= 4).length;
      const avg = cards.reduce((s, c) => s + c.score, 0) / n;

      go('assess_results', { assessData: { cards, summary: data.sessionSummary || { totalCards: n, correctCount: correct, avgScore: avg, weakAreas: [], strongAreas: [] }, recommendations: data.recommendations || {}, masteryEstimate: data.masteryEstimate || Math.round(correct / n * 100) } });
    } catch (e) { alert('Invalid JSON: ' + e.message); }
  };

  if (ctx.assessData) return AssessResults();

  return (
    <div class="shell fade-in">
      <div class="page">
        <div class="nav">
          <div style="display:flex;align-items:center;gap:12px;">
            <button class="btn-ghost" onclick={() => go('dashboard')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Back
            </button>
            <span class="title" style="font-size:1.25rem;">Assessment Form</span>
          </div>
        </div>

        <div class="gcard" style="padding:1.25rem;margin-bottom:16px;">
          <div class="label-xs" style="margin-bottom:8px;">Paste session JSON from your AI agent</div>
          <textarea ref={e => textareaEl = e} style="width:100%;height:200px;background:var(--bg-card2);color:var(--text1);border:1px solid var(--border);border-radius:8px;padding:0.75rem;font-family:monospace;font-size:0.8125rem;resize:vertical;" placeholder='Paste the JSON block from your study session here...'></textarea>
        </div>

        <button class="btn-study" style="width:100%;justify-content:center;" onclick={doProcess}>Process Results</button>
      </div>
    </div>
  );
}

function AssessResults() {
  const { assessData } = ctx;
  const { cards, summary, recommendations, masteryEstimate } = assessData;
  const pct = Math.round((summary.correctCount / summary.totalCards) * 100) || masteryEstimate;

  const doSave = () => {
    const states = loadStates();
    cards.forEach(c => {
      const prev = states[c.id] || defState();
      const next = calcSM2(prev, c.score);
      states[c.id] = { ...next, dueDate: addDays(next.interval), lastScore: c.score, introducedOn: prev.introducedOn || today() };
    });
    saveStates(states);
    ctx.saved = true;
    render();
  };

  return (
    <div class="shell fade-in">
      <div class="page">
        <div class="nav">
          <div style="display:flex;align-items:center;gap:12px;">
            <button class="btn-ghost" onclick={() => { delete ctx.assessData; delete ctx.saved; go('assess'); }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Back
            </button>
            <span class="title" style="font-size:1.25rem;">Results</span>
          </div>
        </div>

        <div class="stat-grid" style="margin-bottom:16px;">
          {[
            { key: 'Cards', val: summary.totalCards, hi: false },
            { key: 'Correct', val: summary.correctCount, hi: true },
            { key: 'Avg Score', val: summary.avgScore?.toFixed?.(1) || summary.avgScore, hi: false },
            { key: 'Mastery', val: masteryEstimate + '%', hi: masteryEstimate >= 90 },
          ].map(({ key, val, hi }) =>
            <div class={'stat-tile' + (hi ? ' hi' : '')}>
              <div class="val">{String(val)}</div>
              <div class="key">{key}</div>
            </div>
          )}
        </div>

        <div class="gcard" style="padding:1rem;margin-bottom:16px;">
          <div class="label-xs" style="margin-bottom:8px;">Mastery Progress</div>
          <div class="prog-track"><div class="prog-fill" style={'width:' + pct + '%'}></div></div>
          <div style="text-align:right;font-size:0.75rem;color:var(--text2);margin-top:4px;">{pct}% — target 95%</div>
        </div>

        {(summary.weakAreas?.length > 0) &&
          <div class="gcard" style="padding:1rem;margin-bottom:12px;">
            <div class="label-xs" style="margin-bottom:6px;color:var(--danger);">Weak Areas</div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;">
              {summary.weakAreas.map(a => <span class="badge-topic" style="background:rgba(239,68,68,0.15);color:#f87171;border-color:rgba(239,68,68,0.3);">{a}</span>)}
            </div>
          </div>
        }

        {(summary.strongAreas?.length > 0) &&
          <div class="gcard" style="padding:1rem;margin-bottom:12px;">
            <div class="label-xs" style="margin-bottom:6px;color:var(--success);">Strong Areas</div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;">
              {summary.strongAreas.map(a => <span class="badge-topic" style="background:rgba(34,197,94,0.15);color:#4ade80;border-color:rgba(34,197,94,0.3);">{a}</span>)}
            </div>
          </div>
        }

        {recommendations.nextSessionFocus &&
          <div class="gcard" style="padding:1rem;margin-bottom:16px;">
            <div class="label-xs" style="margin-bottom:6px;">Next Session</div>
            <div style="font-size:0.875rem;color:var(--text2);">{recommendations.nextSessionFocus}</div>
          </div>
        }

        <div style="display:flex;gap:10px;">
          <button class={'btn-study' + (ctx.saved ? ' disabled' : '')} style="flex:1;justify-content:center;" onclick={doSave}>
            {ctx.saved ? 'Saved to SRS' : 'Save to SRS'}
          </button>
          <button class="btn-ghost" onclick={() => go('dashboard')}>Dashboard</button>
        </div>
      </div>
    </div>
  );
}

// ─── Render ───────────────────────────────────────────────────────────────────
function render() {
  const node =
    view === 'loading'   ? Loading() :
    view === 'session' || view === 'session_complete' ? Session() :
    view === 'stats'     ? Stats() :
    view === 'topics'    ? Topics() :
    view === 'config'    ? Config() :
    view === 'prompt'    ? Prompt() :
    view === 'assess' || view === 'assess_results' ? Assess() :
    Dashboard();
  applyDiff(root, <div>{node}</div>);
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
render();
fetch('cards.json')
  .then(r => r.json())
  .then(cards => { CARDS = cards; go('dashboard'); })
  .catch(err => {
    applyDiff(root,
      <div class="shell" style="display:flex;align-items:center;justify-content:center;min-height:100vh;">
        <div class="gcard fade-in" style="padding:2rem;max-width:380px;text-align:center;">
          <div style="font-size:2rem;margin-bottom:12px;">⚠️</div>
          <div style="font-size:1.125rem;font-weight:600;margin-bottom:8px;">Failed to load cards</div>
          <div style="font-size:0.875rem;color:var(--text2);margin-bottom:6px;">{err.message}</div>
          <div style="font-size:0.75rem;color:var(--text3);">Must be served over HTTP — not opened as a file://</div>
        </div>
      </div>
    );
  });
