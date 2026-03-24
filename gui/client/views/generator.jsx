import * as webjsx from 'webjsx';

export function Generator({ state, send }) {
  const { syllabus, error } = state.context;
  let selectedTopic = null;
  let count = 8;
  let statusMsg = error ?? '';

  const topics = [];

  async function loadTopics(container) {
    const res = await fetch('/api/topics');
    const data = await res.json();
    const grouped = {};
    for (const t of data) (grouped[t[syllabus?.groupByField ?? 'discipline']] ??= []).push(t);
    webjsx.applyDiff(container, <TopicList grouped={grouped} onSelect={t => selectedTopic = t} />);
  }

  const generate = async (statusEl) => {
    if (!selectedTopic) { webjsx.applyDiff(statusEl, <p class="text-warning">Select a topic first.</p>); return; }
    webjsx.applyDiff(statusEl, <p class="text-content2">Generating {count} cards for {selectedTopic.name}...</p>);
    const res = await fetch('/api/generate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ topicId: selectedTopic.id, count }) });
    const reader = res.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const line = new TextDecoder().decode(value).replace('data: ', '').trim();
      if (!line) continue;
      try {
        const d = JSON.parse(line);
        if (d.error) webjsx.applyDiff(statusEl, <p class="text-error">{d.error}</p>);
        else if (d.done) webjsx.applyDiff(statusEl, <p class="text-success">Generated {d.generated} cards. Total: {d.total}</p>);
      } catch {}
    }
  };

  return (
    <div class="p-6 max-w-3xl mx-auto space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold">Generate Flashcards</h2>
        <button class="btn btn-ghost btn-sm" onclick={() => send({ type: 'BACK' })}>Back</button>
      </div>
      <div class="flex items-center gap-4">
        <label class="text-sm text-content2">Cards per topic:</label>
        <input type="number" class="input input-sm w-24" value="8" min="1" max="20" onchange={e => count = parseInt(e.target.value) || 8} />
      </div>
      <div ref={el => loadTopics(el)} class="card p-4 max-h-96 overflow-y-auto">
        <p class="text-content2">Loading topics...</p>
      </div>
      <div ref={el => {}} class="min-h-8">
        <p class="text-content2 text-sm">{statusMsg}</p>
      </div>
      <button class="btn btn-primary" onclick={e => generate(e.target.previousElementSibling)}>Generate Selected Topic</button>
    </div>
  );
}

function TopicList({ grouped, onSelect }) {
  let selected = null;
  const select = (t, el) => {
    if (selected) selected.classList.remove('bg-primary', 'text-primary-content');
    selected = el;
    el.classList.add('bg-primary', 'text-primary-content');
    onSelect(t);
  };
  return (
    <div class="space-y-3">
      {Object.entries(grouped).map(([group, topics]) => (
        <div>
          <p class="text-xs font-semibold text-content2 uppercase mb-1">{group}</p>
          <div class="flex flex-wrap gap-1">
            {topics.map(t => (
              <button class="btn btn-xs btn-ghost" onclick={e => select(t, e.target)}>{t.name}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
