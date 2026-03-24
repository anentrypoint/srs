import * as webjsx from 'webjsx';

export function Dashboard({ state, send }) {
  const { stats, dueCards, config, syllabus } = state.context;
  const ef = stats?.avgEaseFactor ?? 1.3;
  const ceil = config?.efCeiling ?? 2.5;
  const gradeProgress = Math.round(Math.max(0, Math.min(100, (ef - 1.3) / (ceil - 1.3) * 100)));
  const gm = syllabus?.gradeMap ?? {};
  const gradeEntries = Object.entries(gm).sort((a, b) => a[1] - b[1]);
  const minGrade = gradeEntries[0]?.[1] ?? 1.3;
  const maxGrade = gradeEntries[gradeEntries.length - 1]?.[1] ?? ceil;
  const toPct = v => Math.round(Math.max(0, Math.min(100, (v - minGrade) / (maxGrade - minGrade) * 100)));
  const due = dueCards?.length ?? 0;

  return (
    <div class="min-h-screen bg-base-100">
      <div class="max-w-4xl mx-auto p-6 space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-base-content">{syllabus?.label ?? 'SRS'}</h1>
            <p class="text-sm text-content2">{syllabus?.gradeScaleLabel ?? ''}</p>
          </div>
          <button class="btn btn-ghost btn-sm opacity-60 hover:opacity-100" onclick={() => send({ type: 'REFRESH' })}>
            ⟳ Refresh
          </button>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Due Today', value: due, hi: due > 0 },
            { label: 'Total Cards', value: stats?.total ?? 0 },
            { label: 'Days Left', value: config?.daysRemaining ?? '—' },
            { label: 'Target', value: config?.targetGrade ?? '—' },
          ].map(({ label, value, hi }) => (
            <div class="card p-4 text-center space-y-1">
              <div class={'text-3xl font-bold ' + (hi ? 'text-primary' : 'text-base-content')}>{value}</div>
              <div class="text-xs text-content2 uppercase tracking-wide">{label}</div>
            </div>
          ))}
        </div>

        <div class="card p-5 space-y-3">
          <div class="flex justify-between items-baseline">
            <span class="font-semibold text-base-content">Grade Progress</span>
            <span class="text-sm text-content2">{gradeProgress}% — EF {ef.toFixed(2)}</span>
          </div>
          <div class="relative w-full bg-base-200 rounded-full h-4">
            <div class="bg-primary h-4 rounded-full transition-all duration-500"
                 style={'width:' + Math.max(gradeProgress, 2) + '%'}></div>
            {gradeEntries.map(([alias, val]) => (
              <div class="absolute top-0 h-4 flex flex-col items-center" style={'left:' + toPct(val) + '%'}>
                <div class="w-0.5 h-4 bg-base-content opacity-30"></div>
              </div>
            ))}
          </div>
          <div class="flex justify-between">
            {gradeEntries.map(([alias, val]) => (
              <div class="text-center">
                <div class="text-xs font-mono text-content2">{val}</div>
                <div class="text-xs text-content3 capitalize">{alias}</div>
              </div>
            ))}
          </div>
        </div>

        {stats?.avgLastScore != null && (
          <div class="flex items-center gap-2 text-sm text-content2">
            <span>Last score avg:</span>
            <span class="font-medium text-base-content">{stats.avgLastScore.toFixed(1)}/5</span>
          </div>
        )}

        <div class="flex flex-wrap gap-3 pt-2">
          <button
            class={'btn btn-lg ' + (due > 0 ? 'btn-primary' : 'btn-ghost btn-disabled')}
            onclick={() => due > 0 && send({ type: 'START_STUDY' })}>
            {due > 0 ? 'Study Now — ' + due + ' card' + (due === 1 ? '' : 's') : 'No Cards Due'}
          </button>
          <button class="btn btn-secondary" onclick={() => send({ type: 'OPEN_GENERATE' })}>Generate</button>
          <div class="flex gap-2 ml-auto">
            {[['Stats','OPEN_STATS'],['Topics','OPEN_TOPICS'],['Config','OPEN_CONFIG']].map(([l,e]) => (
              <button class="btn btn-ghost btn-sm" onclick={() => send({ type: e })}>{l}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
