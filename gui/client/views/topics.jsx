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
    <div class="p-6 max-w-4xl mx-auto space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold">Topic Taxonomy</h2>
        <button class="btn btn-ghost btn-sm" onclick={() => send({ type: 'BACK' })}>Back</button>
      </div>
      <div ref={el => load(el)}>
        <p class="text-content2">Loading topics...</p>
      </div>
    </div>
  );
}

function TopicTable({ grouped, cardCounts }) {
  return (
    <div class="space-y-4">
      {Object.entries(grouped).map(([group, topics]) => (
        <div class="card overflow-hidden">
          <div class="p-3 bg-base-200 font-semibold text-sm">{group}</div>
          <table class="table w-full">
            <tbody>
              {topics.map(t => (
                <tr class="hover">
                  <td class="text-sm font-mono text-content2">{t.id}</td>
                  <td class="text-sm">{t.name}</td>
                  <td class="text-right text-xs text-content2">{t.examFrequency != null ? Math.round(t.examFrequency * 100) + '%' : ''}</td>
                  <td class="text-right">
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
