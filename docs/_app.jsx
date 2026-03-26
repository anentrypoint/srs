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
  const s = loadStates(), cfg = loadCfg(), t = today();
  const reviews = cards.filter(c => isReviewDue(s, c.id));
  const failed = cards.filter(c => s[c.id]?.lastScore != null && s[c.id].lastScore < 3 && s[c.id].dueDate <= t);
  const newCards = getNewCardsToday(cards, s, cfg);
  const ids = new Set();
  return [...failed, ...reviews, ...newCards].filter(c => ids.has(c.id) ? false : (ids.add(c.id), true));
}
function updateCard(id, score) {
  const states = loadStates();
  const prev = states[id] ?? defState();
  const next = calcSM2(prev, score);
  const due = score < 3 ? today() : addDays(next.interval);
  states[id] = { ...next, dueDate: due, lastScore: score, introducedOn: prev.introducedOn || today() };
  saveStates(states);
}
function getStats(cards) {
  const states = loadStates(), cfg = loadCfg(), t = today();
  const seen = cards.filter(c => isSeen(states, c.id));
  const unseen = cards.filter(c => !isSeen(states, c.id));
  const reviews = cards.filter(c => isReviewDue(states, c.id));
  const failed = cards.filter(c => states[c.id]?.lastScore != null && states[c.id].lastScore < 3 && states[c.id].dueDate <= t);
  const newToday = getNewCardsToday(cards, states, cfg);
  const due = getDue(cards).length;
  const avgEF = seen.length ? seen.reduce((s, c) => s + (states[c.id]?.easeFactor ?? 2.5), 0) / seen.length : 0;
  const scored = cards.filter(c => states[c.id]?.lastScore != null);
  const avgScore = scored.length ? scored.reduce((s, c) => s + states[c.id].lastScore, 0) / scored.length : null;
  return { total: cards.length, due, reviews: reviews.length, failed: failed.length, newToday: newToday.length, seen: seen.length, unseen: unseen.length, avgEF, avgScore };
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
            { key: 'Due Today', val: stats.due,              hi: stats.due > 0 },
            { key: 'Re-study',  val: stats.failed,           hi: stats.failed > 0, warn: stats.failed > 0 },
            { key: 'Learned',   val: stats.seen.toLocaleString() + ' / ' + stats.total.toLocaleString(), hi: false },
            { key: 'Days Left', val: dr,                     hi: dr <= 14 },
          ].map(({ key, val, hi, warn }) =>
            <div class={'stat-tile' + (hi ? ' hi' : '')}>
              <div class="val" style={warn ? 'color:var(--danger)' : ''}>{String(val)}</div>
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
          <div class="label-xs" style="margin-bottom:12px;">Today's Study</div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <button class={'btn-study' + (stats.due === 0 ? ' disabled' : '')} style="width:100%;justify-content:center;min-height:48px;" onclick={() => stats.due > 0 && go('prompt')}>
              {stats.due > 0 ? `Step 1: Send ${stats.reviews} reviews + ${stats.newToday} new to ChatGPT` : 'All Caught Up for Today'}
            </button>
            <button class="btn-ghost" style="width:100%;justify-content:center;padding:0.75rem;min-height:48px;" onclick={() => go('assess')}>
              Step 2: Import Scores from Session
            </button>
          </div>
        </div>

        {/* last session insights */}
        {cfg.lastSessionDate &&
          <div class="gcard" style="padding:1rem;margin-bottom:16px;">
            <div class="label-xs" style="margin-bottom:8px;">Last Session — {cfg.lastSessionDate}</div>
            <div style="font-size:0.8125rem;line-height:1.6;">
              {cfg.lastWeakAreas && <div><span style="color:var(--danger);font-weight:600;">Weak: </span><span style="color:var(--text2);">{cfg.lastWeakAreas}</span></div>}
              {cfg.lastStrongAreas && <div><span style="color:var(--success);font-weight:600;">Strong: </span><span style="color:var(--text2);">{cfg.lastStrongAreas}</span></div>}
              {cfg.lastRecommendation && <div style="margin-top:4px;"><span style="color:var(--accent);font-weight:600;">Focus: </span><span style="color:var(--text2);">{cfg.lastRecommendation}</span></div>}
            </div>
          </div>
        }

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

## End-of-Session Output

When the session is complete (all cards covered OR student ends early), your FINAL message must contain ONLY the output block below — no other text, no commentary, no summary. This makes it easy for the student to copy your entire last message and paste it into their app.

Tell the student: "We're done — copy my next message and paste it into your SRS app." Then send a new message containing ONLY this:

<!-- SRS_SCORES -->
card-id: score
card-id: score
(one line per card, exact IDs from the JSON above)
<!-- SRS_META -->
weakAreas: topic1, topic2
strongAreas: topic3, topic4
avgScore: 3.5
recommendation: one-line focus for next session
difficulty: increase|maintain|decrease

Scoring guide:
- 5 = instant correct, high confidence
- 4 = correct with minor hesitation
- 3 = got it after a hint
- 2 = partially correct, needed help
- 1 = didn't know, had to be taught

Include ALL ${sessionCards.length} cards. Score un-reached cards as 1. The entire message must be ONLY the block above — no prose, no markdown, no explanation. The student's app will parse it automatically.

## Begin

Start by greeting the student and asking what they remember about today's topics. Discover their knowledge first, then teach conversationally.`;
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

        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
          {!ctx.copied
            ? <button class="btn-study" style="width:100%;justify-content:center;padding:0.75rem;" onclick={() => {
                if (navigator.share) {
                  navigator.share({ text: filled }).then(() => { ctx.copied = true; render(); }).catch(() => {
                    navigator.clipboard.writeText(filled); ctx.copied = true; render();
                  });
                } else {
                  navigator.clipboard.writeText(filled).then(() => {
                    ctx.copied = true; render();
                    window.open('https://chatgpt.com/', '_blank');
                  });
                }
              }}>
                1. Copy & Open ChatGPT
              </button>
            : <div style="display:flex;flex-direction:column;gap:8px;">
                <div style="text-align:center;font-size:0.875rem;color:var(--success);font-weight:600;padding:8px;">✓ Prompt copied — study in ChatGPT, then come back</div>
                <button class="btn-study" style="width:100%;justify-content:center;padding:0.75rem;" onclick={() => { ctx.assessSessionIdx = sessionIdx; delete ctx.assessScores; delete ctx.assessMeta; delete ctx.pasteError; delete ctx.pasteSuccess; go('assess'); }}>
                  2. Import Scores from Session {sessionIdx + 1}
                </button>
              </div>
          }
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
  // Get the current session's cards (same batch the prompt was for)
  const sessionIdx = ctx.assessSessionIdx || ctx.sessionIdx || 0;
  const due = getDue(CARDS);
  const sessionCards = due.slice(sessionIdx * SESSION_SIZE, (sessionIdx + 1) * SESSION_SIZE);
  const totalSessions = Math.ceil(due.length / SESSION_SIZE);

  // Initialize scores if not set
  if (!ctx.assessScores) ctx.assessScores = {};
  const scores = ctx.assessScores;
  const scored = sessionCards.filter(c => scores[c.id] != null).length;
  const allScored = scored === sessionCards.length;

  const scoreLabels = ['','Blank','Wrong','Hard','Good','Easy'];
  const scoreCls = ['','s1','s2','s3','s4','s5'];
  const scoreColors = ['','#f87171','#fb923c','#fbbf24','#4ade80','#60a5fa'];

  const parseMeta = (text) => {
    const meta = {};
    const metaMatch = text.match(/<!--\s*SRS_META\s*-->([\s\S]*?)(?:<!--|```|###|$)/i);
    if (!metaMatch) return meta;
    const lines = metaMatch[1].trim().split('\n');
    for (const line of lines) {
      const m = line.trim().match(/^(\w+)\s*:\s*(.+)/);
      if (m) meta[m[1]] = m[2].trim();
    }
    return meta;
  };

  const doSave = () => {
    const states = loadStates();
    sessionCards.forEach(c => {
      const score = scores[c.id] ?? 1;
      const prev = states[c.id] || defState();
      const next = calcSM2(prev, score);
      const due = score < 3 ? today() : addDays(next.interval);
      states[c.id] = { ...next, dueDate: due, lastScore: score, introducedOn: prev.introducedOn || today() };
    });
    saveStates(states);
    if (ctx.assessMeta) {
      const cfg = loadCfg();
      if (ctx.assessMeta.weakAreas) cfg.lastWeakAreas = ctx.assessMeta.weakAreas;
      if (ctx.assessMeta.strongAreas) cfg.lastStrongAreas = ctx.assessMeta.strongAreas;
      if (ctx.assessMeta.recommendation) cfg.lastRecommendation = ctx.assessMeta.recommendation;
      if (ctx.assessMeta.difficulty) cfg.lastDifficulty = ctx.assessMeta.difficulty;
      if (ctx.assessMeta.avgScore) cfg.lastAvgScore = ctx.assessMeta.avgScore;
      cfg.lastSessionDate = today();
      saveCfg(cfg);
    }
    const scoreValues = sessionCards.map(c => scores[c.id] ?? 1);
    ctx.savedStats = { avg: (scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length).toFixed(1), correct: scoreValues.filter(s => s >= 4).length, total: sessionCards.length };
    ctx.assessSaved = true;
    render();
  };

  if (ctx.assessSaved) {
    const { avg, correct } = ctx.savedStats ?? { avg: '0', correct: 0 };
    const meta = ctx.assessMeta;
    return (
      <div class="shell" style="display:flex;align-items:center;justify-content:center;min-height:100vh;">
        <div class="gcard fade-in" style="padding:2.5rem;max-width:440px;width:100%;text-align:center;">
          <div style="font-size:2.5rem;margin-bottom:12px;">✓</div>
          <div style="font-size:1.375rem;font-weight:700;margin-bottom:6px;">Session {sessionIdx + 1} Saved</div>
          <div style="font-size:0.875rem;color:var(--text2);margin-bottom:1rem;">
            {correct}/{ctx.savedStats?.total ?? sessionCards.length} correct · avg {avg}/5
          </div>
          {meta && (meta.weakAreas || meta.recommendation) &&
            <div style="text-align:left;background:var(--bg-card2);border-radius:12px;padding:1rem;margin-bottom:1rem;font-size:0.8125rem;">
              {meta.weakAreas && <div style="margin-bottom:6px;"><span style="color:var(--danger);font-weight:600;">Weak: </span><span style="color:var(--text2);">{meta.weakAreas}</span></div>}
              {meta.strongAreas && <div style="margin-bottom:6px;"><span style="color:var(--success);font-weight:600;">Strong: </span><span style="color:var(--text2);">{meta.strongAreas}</span></div>}
              {meta.recommendation && <div><span style="color:var(--accent);font-weight:600;">Next: </span><span style="color:var(--text2);">{meta.recommendation}</span></div>}
            </div>
          }
          <div style="display:flex;flex-direction:column;gap:8px;">
            {sessionIdx < totalSessions - 1 &&
              <button class="btn-study" style="width:100%;justify-content:center;" onclick={() => { delete ctx.assessScores; delete ctx.assessSaved; delete ctx.assessMeta; delete ctx.savedStats; ctx.sessionIdx = sessionIdx + 1; ctx.copied = false; go('prompt'); }}>
                Next: Get Session {sessionIdx + 2} Prompt
              </button>
            }
            <button class="btn-ghost" style="width:100%;justify-content:center;" onclick={() => { delete ctx.assessScores; delete ctx.assessSaved; delete ctx.assessMeta; delete ctx.savedStats; go('dashboard'); }}>
              {sessionIdx >= totalSessions - 1 ? 'All Sessions Done — Dashboard' : 'Dashboard'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const parseScores = (text) => {
    const parsed = {};
    const blockMatch = text.match(/<!--\s*SRS_SCORES\s*-->([\s\S]*?)(?:<!--|```|$)/i);
    const searchText = blockMatch ? blockMatch[1] : text;
    const linePattern = /\b(card-[a-z0-9-]+)\s*[:=|]\s*([1-5])\b/gi;
    let m;
    while ((m = linePattern.exec(searchText)) !== null) parsed[m[1]] = parseInt(m[2]);
    if (Object.keys(parsed).length === 0) {
      const jsonMatch = text.match(/\[[\s\S]*?\]/);
      if (jsonMatch) try { JSON.parse(jsonMatch[0]).forEach(item => { if (item.id && item.score >= 1 && item.score <= 5) parsed[item.id] = item.score; }); } catch {}
    }
    return parsed;
  };

  const doPaste = (text) => {
    const parsed = parseScores(text);
    const matched = sessionCards.filter(c => parsed[c.id] != null).length;
    if (matched === 0) { ctx.pasteError = 'No matching card scores found. Score manually below.'; render(); return; }
    sessionCards.forEach(c => { if (parsed[c.id] != null) scores[c.id] = parsed[c.id]; });
    ctx.assessMeta = parseMeta(text);
    ctx.pasteError = null;
    ctx.pasteSuccess = matched + '/' + sessionCards.length + ' cards auto-scored' + (matched < sessionCards.length ? ' — score the rest manually' : '');
    render();
  };

  return (
    <div class="shell fade-in">
      <div class="page">
        <div class="nav">
          <div style="display:flex;align-items:center;gap:12px;">
            <button class="btn-ghost" onclick={() => { delete ctx.assessScores; delete ctx.pasteError; delete ctx.pasteSuccess; go('dashboard'); }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Back
            </button>
            <span class="title" style="font-size:1.25rem;">Score Session {sessionIdx + 1}/{totalSessions}</span>
          </div>
          <span style="font-size:0.8125rem;color:var(--text2);">{scored}/{sessionCards.length}</span>
        </div>

        <div class="prog-track thin" style="margin-bottom:16px;">
          <div class="prog-fill" style={'width:' + (sessionCards.length ? Math.round(scored / sessionCards.length * 100) : 0) + '%'}></div>
        </div>

        <div class="gcard" style="padding:1rem;margin-bottom:16px;">
          <div class="label-xs" style="margin-bottom:8px;">Paste scores from ChatGPT</div>
          <div style="display:flex;gap:8px;">
            <textarea style="flex:1;min-height:48px;max-height:120px;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:10px;padding:0.625rem;color:var(--text1);font-family:monospace;font-size:0.8rem;resize:vertical;" placeholder="Paste the score block from ChatGPT here..." ref={el => { if (el) el.onpaste = () => setTimeout(() => doPaste(el.value), 0); }}></textarea>
            <button class="btn-ghost" style="align-self:flex-end;padding:0.625rem 1rem;" onclick={e => { const ta = e.target.closest('.gcard').querySelector('textarea'); if (ta?.value) doPaste(ta.value); }}>Import</button>
          </div>
          {ctx.pasteError && <div style="font-size:0.75rem;color:var(--danger);margin-top:6px;">{ctx.pasteError}</div>}
          {ctx.pasteSuccess && <div style="font-size:0.75rem;color:var(--success);margin-top:6px;">{ctx.pasteSuccess}</div>}
        </div>

        <div style="font-size:0.75rem;color:var(--text3);margin-bottom:12px;text-align:center;">
          Or score each card manually: 1=blank · 2=wrong · 3=hard · 4=good · 5=easy
        </div>

        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
          {sessionCards.map((c, i) => {
            const s = scores[c.id];
            return (
              <div class="gcard" style="padding:0.75rem 1rem;">
                <div style="display:flex;flex-direction:column;gap:8px;">
                  <div style="min-width:0;">
                    <div style="font-size:0.75rem;color:var(--text3);margin-bottom:2px;">{c.topicId || c.tags?.[0] || ''}</div>
                    <div style="font-size:0.8125rem;color:var(--text1);line-height:1.4;">{c.question.length > 100 ? c.question.slice(0, 100) + '…' : c.question}</div>
                  </div>
                  <div style="display:flex;gap:4px;">
                    {[1,2,3,4,5].map(score =>
                      <button
                        style={'flex:1;height:44px;border-radius:8px;border:1px solid ' + (s === score ? scoreColors[score] : 'var(--border)') + ';background:' + (s === score ? scoreColors[score] + '22' : 'transparent') + ';color:' + (s === score ? scoreColors[score] : 'var(--text3)') + ';font-size:0.875rem;font-weight:600;cursor:pointer;'}
                        onclick={() => { scores[c.id] = score; render(); }}>
                        {score}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style="position:sticky;bottom:0;padding:12px 0;background:var(--bg-deep);">
          <div style="display:flex;gap:10px;">
            <button class={'btn-study' + (!allScored ? ' disabled' : '')} style="flex:1;justify-content:center;" onclick={() => allScored && doSave()}>
              {allScored ? 'Save Scores to SRS' : `Score all ${sessionCards.length} cards first`}
            </button>
          </div>

          {!allScored &&
            <div style="display:flex;gap:8px;margin-top:8px;">
              <button class="btn-ghost" style="flex:1;padding:0.625rem;" onclick={() => { sessionCards.forEach(c => { if (scores[c.id] == null) scores[c.id] = 3; }); render(); }}>Rest → Hard (3)</button>
              <button class="btn-ghost" style="flex:1;padding:0.625rem;" onclick={() => { sessionCards.forEach(c => { if (scores[c.id] == null) scores[c.id] = 1; }); render(); }}>Rest → Blank (1)</button>
            </div>
          }
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
