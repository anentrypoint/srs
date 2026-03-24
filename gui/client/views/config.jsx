import * as webjsx from 'webjsx';

export function Config({ state, send }) {
  const { config, syllabus } = state.context;
  const cfg = config ?? {};
  const gm = syllabus?.gradeMap ?? {};

  const save = async (form) => {
    const fd = new FormData(form);
    const updates = [
      ['examDate', fd.get('examDate')],
      ['targetGrade', fd.get('targetGrade')],
      ['headroomDays', fd.get('headroomDays')],
      ['dailyStudyMinutes', fd.get('dailyStudyMinutes')],
      ['preferredCLI', fd.get('preferredCLI')],
    ];
    for (const [key, value] of updates) {
      if (value) await fetch('/api/config', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key, value }) });
    }
    send({ type: 'SAVE_CONFIG', payload: {} });
  };

  return (
    <div class="p-6 max-w-xl mx-auto space-y-5">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold">Configuration</h2>
        <button class="btn btn-ghost btn-sm" onclick={() => send({ type: 'BACK' })}>Back</button>
      </div>
      <form ref={el => el?.addEventListener('submit', e => { e.preventDefault(); save(el); })} class="space-y-4">
        <div class="form-group">
          <label class="label">Exam Date</label>
          <input type="date" name="examDate" class="input w-full" value={cfg.examDate ?? ''} />
        </div>
        <div class="form-group">
          <label class="label">Target Grade</label>
          <select name="targetGrade" class="select w-full">
            {Object.entries(gm).map(([alias, val]) => (
              <option value={alias} selected={cfg.targetGrade === val || cfg.targetGrade === alias}>{alias} ({val})</option>
            ))}
          </select>
        </div>
        <div class="form-group">
          <label class="label">Headroom Days (buffer before exam)</label>
          <input type="number" name="headroomDays" class="input w-full" value={cfg.headroomDays ?? 7} min="1" max="60" />
        </div>
        <div class="form-group">
          <label class="label">Daily Study Minutes</label>
          <input type="number" name="dailyStudyMinutes" class="input w-full" value={cfg.dailyStudyMinutes ?? 60} min="10" max="480" />
        </div>
        <div class="form-group">
          <label class="label">Preferred AI CLI</label>
          <select name="preferredCLI" class="select w-full">
            {['opencode', 'kilo', 'gemini'].map(cli => (
              <option value={cli} selected={cfg.preferredCLI === cli}>{cli}</option>
            ))}
          </select>
        </div>
        <button type="submit" class="btn btn-primary w-full">Save Configuration</button>
      </form>
    </div>
  );
}
