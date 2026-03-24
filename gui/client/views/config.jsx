import * as webjsx from 'webjsx';

export function Config({ state, send }) {
  const { config, syllabus } = state.context;
  const cfg = config ?? {};
  const gm = syllabus?.gradeMap ?? {};

  const save = async (form) => {
    const fd = new FormData(form);
    const fields = ['examDate','targetGrade','headroomDays','dailyStudyMinutes','preferredCLI'];
    for (const key of fields) {
      const value = fd.get(key);
      if (value) await fetch('/api/config', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
    }
    send({ type: 'SAVE_CONFIG', payload: {} });
  };

  return (
    <div class="min-h-screen bg-base-100">
      <div class="max-w-xl mx-auto p-6 space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold">Configuration</h2>
            <p class="text-sm text-content2">{syllabus?.label ?? 'SRS'} study settings</p>
          </div>
          <button class="btn btn-ghost btn-sm" onclick={() => send({ type: 'BACK' })}>← Back</button>
        </div>

        <form ref={el => el?.addEventListener('submit', e => { e.preventDefault(); save(el); })}
              class="card p-6 space-y-5">

          <div class="form-group">
            <label class="label">Exam Date</label>
            <input type="date" name="examDate" class="input w-full" value={cfg.examDate ?? ''} />
          </div>

          <div class="form-group">
            <label class="label">Target Grade</label>
            <select name="targetGrade" class="select w-full">
              {Object.entries(gm).map(([alias, val]) => (
                <option value={alias} selected={cfg.targetGrade === val || cfg.targetGrade === alias}>
                  {alias} ({val})
                </option>
              ))}
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="label">Headroom Days</label>
              <input type="number" name="headroomDays" class="input w-full"
                     value={cfg.headroomDays ?? 7} min="1" max="60" />
              <p class="text-xs text-content3 mt-1">Buffer before exam</p>
            </div>
            <div class="form-group">
              <label class="label">Daily Study (min)</label>
              <input type="number" name="dailyStudyMinutes" class="input w-full"
                     value={cfg.dailyStudyMinutes ?? 60} min="10" max="480" />
            </div>
          </div>

          <div class="form-group">
            <label class="label">AI Provider</label>
            <select name="preferredCLI" class="select w-full">
              {['opencode','kilo','gemini'].map(cli => (
                <option value={cli} selected={cfg.preferredCLI === cli}>{cli}</option>
              ))}
            </select>
          </div>

          <button type="submit" class="btn btn-primary w-full">Save Changes</button>
        </form>

        <div class="card p-4 space-y-2">
          <p class="text-xs font-semibold text-content2 uppercase tracking-wide">Derived</p>
          {[
            ['Days Remaining', cfg.daysRemaining],
            ['Effective Days', cfg.effectiveDays],
            ['Min Ease Factor', cfg.minEaseFactor],
            ['EF Ceiling', cfg.efCeiling],
          ].map(([label, value]) => (
            <div class="flex justify-between text-sm">
              <span class="text-content2">{label}</span>
              <span class="font-mono text-base-content">{value ?? '—'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
