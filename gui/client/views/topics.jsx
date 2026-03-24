import * as webjsx from 'webjsx';

export function Topics({ state, send }) {
  const { syllabus } = state.context;
  const groupField = syllabus?.groupByField ?? 'discipline';

  async function load(container) {
    const [topicsRes, cardsRes] = await Promise.all([fetch('/api/topics'), fetch('/api/cards')]);
    const topics = await topicsRes.json();
    const cards = await cardsRes.json();
    const cardCounts = {};
    for (const c of cards) cardCounts[c.topicId] = (cardCounts[c.topicId] ?? 0) + 1;
    const grouped = {};
    for (const t of topics) (grouped[t[groupField] ?? 'Other'] ??= []).push(t);
    webjsx.applyDiff(container, <TopicTable grouped={grouped} cardCounts={cardCounts} />);
  }

  return (
    <div class="min-h-screen bg-base-100">
      <div class="max-w-4xl mx-auto p-6 space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold">Topic Taxonomy</h2>
            <p class="text-sm text-content2">
              {syllabus?.label ?? 'SRS'} — grouped by {groupField}
            </p>
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
