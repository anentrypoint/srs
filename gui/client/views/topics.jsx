import * as webjsx from 'webjsx';

export function Topics({ state, send }) {
  const { syllabus } = state.context;
  const groupField = syllabus?.groupByField ?? 'discipline';
  let tab = 'topics';

  async function load(container) {
    const [topicsRes, cardsRes, valRes] = await Promise.all([fetch('/api/topics'), fetch('/api/cards'), fetch('/api/validate')]);
    const topics = await topicsRes.json();
    const cards = await cardsRes.json();
    const val = await valRes.json();
    const cardCounts = {};
    for (const c of cards) cardCounts[c.topicId] = (cardCounts[c.topicId] ?? 0) + 1;
    const grouped = {};
    for (const t of topics) (grouped[t[groupField] ?? 'Other'] ??= []).push(t);
    const render = () => webjsx.applyDiff(container, (
      <div class="space-y-4">
        <div class="flex gap-2">
          <button class={'btn btn-sm ' + (tab === 'topics' ? 'btn-primary' : 'btn-ghost')}
                  onclick={() => { tab = 'topics'; render(); }}>All Topics</button>
          <button class={'btn btn-sm ' + (tab === 'coverage' ? 'btn-primary' : 'btn-ghost')}
                  onclick={() => { tab = 'coverage'; render(); }}>
            Coverage — {val.summary?.coveragePercent ?? 0}%
          </button>
        </div>
        {tab === 'topics'
          ? <TopicTable grouped={grouped} cardCounts={cardCounts} />
          : <CoverageTable topics={val.topics ?? []} summary={val.summary} />}
      </div>
    ));
    render();
  }

  return (
    <div class="min-h-screen bg-base-100">
      <div class="max-w-4xl mx-auto p-6 space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold">Topic Taxonomy</h2>
            <p class="text-sm text-content2">{syllabus?.label ?? 'SRS'} — grouped by {groupField}</p>
          </div>
          <button class="btn btn-ghost btn-sm" onclick={() => send({ type: 'BACK' })}>← Back</button>
        </div>
        <div ref={el => load(el)}>
          <div class="flex items-center gap-2 text-content2">
            <span class="loading loading-spinner loading-sm"></span>
            <span class="text-sm">Loading topics...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopicTable({ grouped, cardCounts }) {
  return (
    <div class="space-y-4">
      {Object.entries(grouped).map(([group, topics]) => (
        <div class="card overflow-hidden">
          <div class="px-4 py-2.5 bg-base-200 flex items-center justify-between">
            <span class="font-semibold text-sm">{group}</span>
            <span class="text-xs text-content2">{topics.length} topics</span>
          </div>
          <table class="table w-full">
            <tbody>
              {topics.map(t => (
                <tr class="hover">
                  <td class="text-xs font-mono text-content2 w-32">{t.id}</td>
                  <td class="text-sm">{t.name}</td>
                  <td class="text-right text-xs text-content2 w-16">
                    {t.examFrequency != null ? Math.round(t.examFrequency * 100) + '%' : ''}
                  </td>
                  <td class="text-right w-24">
                    <span class={'badge badge-sm ' + (cardCounts[t.id] ? 'badge-success' : 'badge-ghost')}>
                      {cardCounts[t.id] ?? 0} cards
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function CoverageTable({ topics, summary }) {
  const statusClass = t => t.covered ? 'badge-success' : t.gap > 10 ? 'badge-error' : 'badge-warning';
  return (
    <div class="space-y-3">
      <div class="card p-4 flex gap-6">
        <div class="text-center"><div class="text-2xl font-bold">{summary?.coveredTopics ?? 0}/{summary?.totalTopics ?? 0}</div><div class="text-xs text-content2">topics covered</div></div>
        <div class="text-center"><div class="text-2xl font-bold">{summary?.totalCards ?? 0}/{summary?.totalMinCards ?? 0}</div><div class="text-xs text-content2">cards / minimum</div></div>
        <div class="text-center"><div class="text-2xl font-bold text-primary">{summary?.coveragePercent ?? 0}%</div><div class="text-xs text-content2">coverage</div></div>
      </div>
      <div class="card overflow-hidden">
        <table class="table w-full">
          <thead><tr><th class="text-xs">Topic</th><th class="text-right text-xs">Freq</th><th class="text-right text-xs">Cards</th><th class="text-right text-xs">Min</th><th class="text-right text-xs">Status</th></tr></thead>
          <tbody>
            {topics.map(t => (
              <tr class="hover">
                <td class="text-sm">{t.topicName}</td>
                <td class="text-right text-xs text-content2">{Math.round(t.examFrequency * 100)}%</td>
                <td class="text-right text-xs font-mono">{t.actualCards}</td>
                <td class="text-right text-xs font-mono text-content2">{t.minCards}</td>
                <td class="text-right"><span class={'badge badge-sm ' + statusClass(t)}>{t.covered ? '✓' : '-' + t.gap}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
