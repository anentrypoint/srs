import * as webjsx from 'webjsx';

export function Stats({ state, send }) {
  const { stats, config, syllabus } = state.context;
  const ef = stats?.avgEaseFactor ?? 1.3;
  const ceil = config?.efCeiling ?? 2.5;
  const gm = syllabus?.gradeMap ?? {};
  const gradeEntries = Object.entries(gm).sort((a, b) => a[1] - b[1]);
  const minV = gradeEntries[0]?.[1] ?? 1.3;
  const maxV = gradeEntries[gradeEntries.length - 1]?.[1] ?? ceil;
  const toPct = v => Math.round(Math.max(0, Math.min(100, (v - minV) / (maxV - minV) * 100)));
  const gradeProgress = Math.round(Math.max(0, Math.min(100, (ef - 1.3) / (ceil - 1.3) * 100)));

  const rows = [
    ['Total Cards', stats?.total ?? 0],
    ['Due Today', stats?.dueCount ?? 0],
    ['Avg Ease Factor', stats?.avgEaseFactor?.toFixed(2) ?? '—'],
    ['Avg Last Score', stats?.avgLastScore != null ? stats.avgLastScore.toFixed(1) + '/5' : '—'],
    ['Target Grade', config?.targetGrade ?? '—'],
    ['Days Remaining', config?.daysRemaining ?? '—'],
    ['Effective Days', config?.effectiveDays ?? '—'],
    ['Min Ease Factor', config?.minEaseFactor ?? '—'],
  ];

  return (
    <div class="min-h-screen bg-base-100">
      <div class="max-w-2xl mx-auto p-6 space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold">{syllabus?.label ?? 'SRS'} Progress</h2>
            <p class="text-sm text-content2">{syllabus?.gradeScaleLabel ?? ''}</p>
          </div>
          <button class="btn btn-ghost btn-sm" onclick={() => send({ type: 'BACK' })}>← Back</button>
        </div>

        <div class="card p-5 space-y-4">
          <div class="flex justify-between items-baseline">
            <span class="font-semibold">Grade Progress</span>
            <span class="text-sm text-content2">{gradeProgress}% toward {config?.targetGrade}</span>
          </div>
          <div class="relative w-full bg-base-200 rounded-full h-5">
            <div class="bg-primary h-5 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                 style={'width:' + Math.max(gradeProgress, 8) + '%'}>
              <span class="text-xs font-bold text-primary-content">{gradeProgress}%</span>
            </div>
            {gradeEntries.map(([alias, val]) => (
              <div class="absolute top-0 h-5 flex items-center" style={'left:' + toPct(val) + '%'}>
                <div class="w-px h-5 bg-base-content opacity-20"></div>
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

        <div class="card overflow-hidden">
          <table class="table w-full">
            <tbody>
              {rows.map(([label, value]) => (
                <tr>
                  <td class="text-content2 text-sm">{label}</td>
                  <td class="font-medium text-right font-mono">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
