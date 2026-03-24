import * as webjsx from 'webjsx';

export function Dashboard({ state, send }) {
  const { stats, dueCards, config, syllabus } = state.context;
  const ef = stats?.avgEaseFactor ?? 1.3;
  const ceil = config?.efCeiling ?? 2.5;
  const gradeProgress = Math.round(Math.max(0, Math.min(100, (ef - 1.3) / (ceil - 1.3) * 100)));

  return (
    <div class="p-6 max-w-4xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">{syllabus?.label ?? 'SRS'} Dashboard</h1>
        <button class="btn btn-ghost btn-sm" onclick={() => send({ type: 'REFRESH' })}>↻</button>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Due Today', value: dueCards?.length ?? 0, accent: true },
          { label: 'Total Cards', value: stats?.total ?? 0 },
          { label: 'Days Left', value: config?.daysRemaining ?? '—' },
          { label: 'Target Grade', value: config?.targetGrade ?? '—' },
        ].map(({ label, value, accent }) => (
          <div class="card p-4 text-center">
            <div class={`text-3xl font-bold ${accent ? 'text-primary' : ''}`}>{value}</div>
            <div class="text-sm text-content2">{label}</div>
          </div>
        ))}
      </div>
      <div class="card p-4">
        <div class="flex justify-between mb-2">
          <span class="font-medium">Grade Progress</span>
          <span class="text-sm text-content2">{gradeProgress}% toward {config?.targetGrade}</span>
        </div>
        <div class="w-full bg-base-200 rounded-full h-3">
          <div class="bg-primary h-3 rounded-full transition-all" style={'width:' + gradeProgress + '%'}></div>
        </div>
        {stats && <p class="text-xs text-content2 mt-1">EF: {stats.avgEaseFactor?.toFixed(2)} | Score: {stats.avgLastScore?.toFixed(1)}/5</p>}
      </div>
      <div class="flex flex-wrap gap-3">
        <button class={'btn btn-primary' + (dueCards?.length ? '' : ' btn-disabled')} onclick={() => dueCards?.length && send({ type: 'START_STUDY' })}>
          {dueCards?.length ? 'Study Now (' + dueCards.length + ' cards)' : 'No Cards Due'}
        </button>
        <button class="btn btn-secondary" onclick={() => send({ type: 'OPEN_GENERATE' })}>Generate Cards</button>
        <button class="btn btn-ghost" onclick={() => send({ type: 'OPEN_STATS' })}>Stats</button>
        <button class="btn btn-ghost" onclick={() => send({ type: 'OPEN_TOPICS' })}>Topics</button>
        <button class="btn btn-ghost" onclick={() => send({ type: 'OPEN_CONFIG' })}>Config</button>
      </div>
    </div>
  );
}
