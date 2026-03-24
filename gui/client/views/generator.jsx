import * as webjsx from 'webjsx';

export function Generator({ state, send }) {
  const { syllabus, error } = state.context;
  let selectedTopic = null;
  let count = 8;
  let statusMsg = error ?? '';

  async function loadTopics(container) {
    const res = await fetch('/api/topics');
    const data = await res.json();
    const grouped = {};
    for (const t of data) (grouped[t[syllabus?.groupByField ?? 'discipline']] ??= []).push(t);
    webjsx.applyDiff(container, <TopicPicker grouped={grouped} onSelect={t => selectedTopic = t} />);
  }

  const generate = async (statusEl) => {
    if (!selectedTopic) {
      webjsx.applyDiff(statusEl, <p class="text-warning text-sm">Select a topic first.</p>);
      return;
    }
    webjsx.applyDiff(statusEl, (
      <div class="flex items-center gap-2 text-content2 text-sm">
        <span class="loading loading-spinner loading-sm"></span>
        <span>Generating {count} cards for {selectedTopic.name}...</span>
      </div>
    ));
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ topicId: selectedTopic.id, count }),
    });
    const reader = res.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const line = new TextDecoder().decode(value).replace('data: ', '').trim();
      if (!line) continue;
      try {
        const d = JSON.parse(line);
        if (d.error) webjsx.applyDiff(statusEl, <p class="text-error text-sm">{d.error}</p>);
        else if (d.done) webjsx.applyDiff(statusEl, (
          <div class="flex items-center gap-2 text-success text-sm">
            <span>✓</span>
            <span>Generated {d.generated} cards. Total: {d.total}</span>
          </div>
        ));
      } catch {}
    }
  };

  return (
    <div class="min-h-screen bg-base-100">
      <div class="max-w-3xl mx-auto p-6 space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold">Generate Flashcards</h2>
            <p class="text-sm text-content2">Select a topic then generate AI-crafted study cards</p>
          </div>
          <button class="btn btn-ghost btn-sm" onclick={() => send({ type: 'BACK' })}>← Back</button>
        </div>

        <div class="flex items-center gap-4">
          <label class="text-sm text-content2">Cards to generate:</label>
          <input type="number" class="input input-sm w-24" value="8" min="1" max="30"
                 onchange={e => count = parseInt(e.target.value) || 8} />
        </div>

        <div ref={el => loadTopics(el)} class="card p-4 max-h-96 overflow-y-auto">
          <div class="flex items-center gap-2 text-content2">
            <span class="loading loading-spinner loading-sm"></span>
            <span class="text-sm">Loading topics...</span>
          </div>
        </div>

        <div ref={el => {}} class="min-h-8"></div>

        <button class="btn btn-primary w-full"
                onclick={e => generate(e.target.previousElementSibling)}>
          Generate Selected Topic
        </button>
      </div>
    </div>
  );
}

function TopicPicker({ grouped, onSelect }) {
  let selected = null;
  const pick = (t, el) => {
    if (selected) selected.classList.remove('btn-primary');
    selected = el;
    el.classList.add('btn-primary');
    onSelect(t);
  };
  return (
    <div class="space-y-4">
      {Object.entries(grouped).map(([group, topics]) => (
        <div>
          <p class="text-xs font-semibold text-content2 uppercase tracking-widest mb-2">{group}</p>
          <div class="flex flex-wrap gap-1.5">
            {topics.map(t => (
              <button class="btn btn-xs btn-ghost" onclick={e => pick(t, e.currentTarget)}>
                {t.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
