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
  const states = loadStates(), cfg = loadCfg();
  const seen = cards.filter(c => isSeen(states, c.id));
  const unseen = cards.filter(c => !isSeen(states, c.id));
  const reviews = cards.filter(c => isReviewDue(states, c.id));
  const newToday = getNewCardsToday(cards, states, cfg);
  const due = getDue(cards).length;
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
  const states = loadStates();
  // Recall-based grade prediction
  const scored = CARDS.filter(c => states[c.id]?.lastScore != null);
  const correct = scored.filter(c => states[c.id].lastScore >= 3).length;
  const recallRate = scored.length ? correct / scored.length : 0.5;
  const coverage = stats.total ? stats.seen / stats.total : 0;
  // Unseen cards weighted at 50% (unknown); blend with observed recall
  const projected = scored.length >= 5 ? recallRate * coverage + 0.5 * (1 - coverage) : 0.5;
  const gp = Math.round(projected * 100);
  // MCCQE1: <55% fail, 55-69% pass, ≥70% honours
  const grades = [['Fail','<70%', Math.round(0.69 * 100)], ['Pass','70%', Math.round(0.70 * 100)], ['Honours','85%', Math.round(0.85 * 100)]];

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
            { key: 'New Today', val: stats.newToday,         hi: stats.newToday > 0 },
            { key: 'Learned',   val: stats.seen.toLocaleString() + ' / ' + stats.total.toLocaleString(), hi: false },
            { key: 'Days Left', val: dr,                     hi: dr <= 14 },
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
            <span style="font-weight:600;font-size:0.9375rem;">Progress to Honours</span>
            <span style="font-size:0.8125rem;color:var(--text2);">{gp}% projected ({scored.length} scored)</span>
          </div>
          <div class="prog-track" style="margin-bottom:10px;">
            <div class="prog-fill" style={'width:' + Math.min(100, Math.max(Math.round(gp / 85 * 100), 1)) + '%'}></div>
          </div>
          <div style="display:flex;justify-content:space-between;">
            {grades.map(([label, val, pos]) =>
              <div style="text-align:center;">
                <div style="font-size:0.75rem;font-weight:600;color:var(--text2);">{val}</div>
                <div style={'font-size:0.6875rem;color:' + (gp >= pos ? 'var(--accent)' : 'var(--text3)') + ';text-transform:uppercase;letter-spacing:0.05em;margin-top:2px;'}>{label}</div>
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
                    if (isLast) { session.index++; go('session_complete', { lastResults: [...session.results] }); }
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

        <div class="gcard" style="padding:1.25rem;margin-bottom:16px;">
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

        <div class="gcard" style="padding:1.25rem;">
          <div style="font-size:0.8125rem;font-weight:600;margin-bottom:12px;">Backup &amp; Restore</div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <button class="btn-ghost" style="justify-content:center;" onclick={() => {
              const data = { states: loadStates(), cfg: loadCfg(), exportedAt: new Date().toISOString() };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `srs-backup-${new Date().toISOString().slice(0,10)}.json`;
              a.click();
              URL.revokeObjectURL(a.href);
            }}>Export Progress (download JSON)</button>
            <label class="btn-ghost" style="justify-content:center;cursor:pointer;text-align:center;">
              Import Progress (restore from JSON)
              <input type="file" accept=".json,application/json" style="display:none;" onchange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = ev => {
                  try {
                    const data = JSON.parse(ev.target.result);
                    if (!data.states && !data.cfg) { alert('Invalid backup file.'); return; }
                    if (!confirm(`Restore backup from ${data.exportedAt ? new Date(data.exportedAt).toLocaleString() : 'unknown date'}?\n\nThis will overwrite your current progress.`)) return;
                    if (data.states) saveStates(data.states);
                    if (data.cfg) saveCfg(data.cfg);
                    alert('Progress restored.');
                    go('dashboard');
                  } catch { alert('Failed to parse backup file.'); }
                };
                reader.readAsText(file);
              }} />
            </label>
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

## How to Teach

You are a tutor having a real conversation — NOT presenting a list of questions or cards. The student never sees the card list. You use the cards as a hidden curriculum to guide what you teach and test.

**Flow for this session:**

1. Open with a brief casual question about what the student remembers from the topic areas today (don't list topics verbatim — just ask naturally).
2. Based on their answer, weave into a flowing conversation that naturally covers the concepts behind the cards. Teach through scenarios, mechanisms, and clinical reasoning — not Q&A drills.
3. When you want to test a concept, fold the question into the conversation naturally: "So if you had a patient who…" or "What would you expect to see if…" — never "Card 7 asks:".
4. If they get something right, briefly affirm and deepen (why does that happen? what changes if X?). If wrong or uncertain, explain clearly and revisit it later.
5. Cover all ${sessionCards.length} cards' worth of material through this narrative flow. The student should finish the session having encountered every concept, but it should feel like a guided discussion, not a quiz.
6. At the end, give a short 2-3 sentence wrap-up of the session's themes and what to focus on next.

## Scoring Reference (for your final output only)

After the session, you will score each card ID internally based on how the student performed on that concept:
- 5 = immediate correct, confident
- 4 = correct with minor hesitation
- 3 = got it with a hint or partial teaching
- 2 = mostly needed teaching, partial understanding
- 1 = didn't know, fully taught from scratch

## Card Data (your hidden curriculum — never show this to the student)

\`\`\`json
${cardsJson}
\`\`\`

## End-of-Session Output

When the session is complete, tell the student: "Great session — copy my next message and paste it into your SRS app." Then send a new message containing ONLY this block (no other text):

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

Include ALL ${sessionCards.length} card IDs. Score un-reached cards as 1. The message must be ONLY the block above.

## Begin

Greet the student warmly and open with a natural question about what they remember from today's topics.`;
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
                const doCopy = () => navigator.clipboard.writeText(filled).then(() => { ctx.copied = true; render(); });
                if (navigator.share) {
                  navigator.share({ text: filled }).then(() => { ctx.copied = true; render(); }).catch(doCopy);
                } else {
                  doCopy().then(() => window.open('https://chatgpt.com/', '_blank'));
                }
              }}>
                1. Copy & Open ChatGPT
              </button>
            : <div style="display:flex;flex-direction:column;gap:8px;">
                <div style="text-align:center;font-size:0.875rem;color:var(--success);font-weight:600;padding:8px;">✓ Prompt copied — paste into ChatGPT, study, then paste scores below</div>
                <div class="gcard" style="padding:1rem;">
                  <div class="label-xs" style="margin-bottom:8px;">2. Paste scores here when done</div>
                  <div style="display:flex;gap:8px;">
                    <textarea id="inline-paste" style="flex:1;min-height:48px;max-height:120px;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:10px;padding:0.625rem;color:var(--text1);font-family:monospace;font-size:0.8rem;resize:vertical;" placeholder="Paste the score block from ChatGPT…" ref={el => {
                      if (el) el.onpaste = () => setTimeout(() => {
                        ctx.assessSessionIdx = sessionIdx;
                        if (!ctx.assessScores) ctx.assessScores = {};
                        const text = el.value;
                        const parsed = {};
                        const blockMatch = text.match(/<!--\s*SRS_SCORES\s*-->([\s\S]*?)(?:<!--|```|$)/i);
                        const searchText = blockMatch ? blockMatch[1] : text;
                        const linePattern = /\b(card-[a-z0-9-]+)\s*[:=|]\s*([1-5])\b/gi;
                        let m;
                        while ((m = linePattern.exec(searchText)) !== null) parsed[m[1]] = parseInt(m[2]);
                        if (Object.keys(parsed).length > 0) {
                          Object.assign(ctx.assessScores, parsed);
                          const metaMatch = text.match(/<!--\s*SRS_META\s*-->([\s\S]*?)(?:<!--|```|###|$)/i);
                          if (metaMatch) { const meta = {}; metaMatch[1].trim().split('\n').forEach(l => { const mm = l.trim().match(/^(\w+)\s*:\s*(.+)/); if (mm) meta[mm[1]] = mm[2].trim(); }); ctx.assessMeta = meta; }
                          ctx.inlinePasteSuccess = Object.keys(parsed).length + ' cards auto-scored';
                          ctx.inlinePasteError = null;
                        } else {
                          ctx.inlinePasteError = 'No scores found — go to full Assess view';
                          ctx.inlinePasteSuccess = null;
                        }
                        render();
                      }, 0);
                    }} />
                    <button class="btn-ghost" style="align-self:flex-end;padding:0.625rem 1rem;" onclick={e => {
                      const ta = document.getElementById('inline-paste');
                      if (ta?.value) ta.dispatchEvent(new Event('paste'));
                    }}>Import</button>
                  </div>
                  {ctx.inlinePasteError && <div style="font-size:0.75rem;color:var(--danger);margin-top:6px;">{ctx.inlinePasteError}</div>}
                  {ctx.inlinePasteSuccess && <div style="font-size:0.75rem;color:var(--success);margin-top:6px;">✓ {ctx.inlinePasteSuccess} — <button class="btn-ghost" style="font-size:0.75rem;padding:2px 8px;" onclick={() => { ctx.assessSessionIdx = sessionIdx; go('assess'); }}>Review &amp; Save →</button></div>}
                </div>
              </div>
          }
        </div>

        <div class="gcard" style="padding:1.25rem;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <div class="label-xs">Generated Prompt</div>
            <button class="btn-ghost" style="font-size:0.75rem;padding:2px 10px;" onclick={() => navigator.clipboard.writeText(filled).then(() => { ctx.copied = true; render(); })}>Copy</button>
          </div>
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
      states[c.id] = { ...next, dueDate: addDays(next.interval), lastScore: score, introducedOn: prev.introducedOn || today() };
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
