import * as webjsx from 'webjsx';

export function Stats({ state, send }) {
  const { stats, config, syllabus } = state.context;
  const ef = stats?.avgEaseFactor ?? 1.3;
  const ceil = config?.efCeiling ?? 2.5;
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
    <div class="p-6 max-w-2xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold">{syllabus?.label ?? 'SRS'} Progress</h2>
        <button class="btn btn-ghost btn-sm" onclick={() => send({ type: 'BACK' })}>Back</button>
      </div>
      <div class="card p-4">
        <div class="flex justify-between mb-2">
          <span class="font-medium">Grade Progress</span>
          <span class="text-sm text-content2">{gradeProgress}% toward {config?.targetGrade} ({syllabus?.gradeScaleLabel ?? ''})</span>
        </div>
        <div class="w-full bg-base-200 rounded-full h-4">
          <div class="bg-primary h-4 rounded-full flex items-center justify-end pr-2 text-xs text-primary-content font-bold"
               style={'width:' + Math.max(gradeProgress, 8) + '%'}>
            {gradeProgress}%
          </div>
        </div>
      </div>
      <div class="card overflow-hidden">
        <table class="table w-full">
          <tbody>
            {rows.map(([label, value]) => (
              <tr>
                <td class="text-content2 text-sm">{label}</td>
                <td class="font-medium text-right">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
