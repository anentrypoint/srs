import * as webjsx from 'webjsx';

const scoreColor = s => s >= 4 ? 'badge-success' : s >= 3 ? 'badge-warning' : 'badge-error';
const scoreLabel = s => s >= 4 ? 'Correct' : s >= 3 ? 'Partial' : 'Incorrect';

function AnswerInput({ send }) {
  let ta;
  const submit = () => { const v = ta?.value?.trim() ?? ''; send({ type: 'SUBMIT_ANSWER', answer: v }); };
  return (
    <div class="space-y-3">
      <textarea
        ref={el => { ta = el; setTimeout(() => el?.focus(), 50); }}
        class="textarea w-full h-32 text-base resize-none"
        placeholder="Type your answer here..."
        onkeydown={e => e.key === 'Enter' && e.ctrlKey && submit()}
      ></textarea>
      <div class="flex gap-2">
        <button class="btn btn-primary flex-1" onclick={submit}>Submit</button>
        <button class="btn btn-ghost text-content2" onclick={() => send({ type: 'SUBMIT_ANSWER', answer: '' })}>
          Skip
        </button>
      </div>
      <p class="text-xs text-content3 text-center">Ctrl + Enter to submit</p>
    </div>
  );
}

export function Session({ state, send }) {
  const { dueCards, currentCardIndex, lastScore } = state.context;
  const card = dueCards?.[currentCardIndex];
  const isScoring = state.matches({ studying: 'scoring' });
  const isReviewing = state.matches({ studying: 'reviewing' });
  const progress = dueCards?.length ? Math.round((currentCardIndex / dueCards.length) * 100) : 0;
  const isLast = currentCardIndex >= (dueCards?.length ?? 1) - 1;

  if (!card) return (
    <div class="min-h-screen flex items-center justify-center">
      <div class="card p-8 text-center space-y-4 max-w-sm">
        <p class="text-xl font-semibold">Session Complete</p>
        <p class="text-content2">All cards reviewed for this session.</p>
        <button class="btn btn-primary w-full" onclick={() => send({ type: 'EXIT_SESSION' })}>Back to Dashboard</button>
      </div>
    </div>
  );

  return (
    <div class="min-h-screen bg-base-100">
      <div class="max-w-2xl mx-auto p-6 space-y-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <button class="btn btn-ghost btn-sm" onclick={() => send({ type: 'EXIT_SESSION' })}>← Exit</button>
            <span class="text-sm text-content2">{currentCardIndex + 1} / {dueCards.length}</span>
          </div>
          <span class="text-sm text-content2">{progress}%</span>
        </div>

        <div class="w-full bg-base-200 rounded-full h-1.5">
          <div class="bg-primary h-1.5 rounded-full transition-all duration-300"
               style={'width:' + progress + '%'}></div>
        </div>

        <div class="card p-6 space-y-4">
          <div class="flex items-center gap-2">
            <span class="badge badge-ghost badge-sm font-mono">{card.topicId}</span>
          </div>
          <p class="text-lg font-medium leading-relaxed text-base-content">{card.question}</p>
        </div>

        {isScoring && (
          <div class="flex items-center justify-center gap-3 text-content2 py-4">
            <span class="loading loading-spinner loading-sm"></span>
            <span class="text-sm">Scoring your answer...</span>
          </div>
        )}

        {!isReviewing && !isScoring && <AnswerInput send={send} />}

        {isReviewing && lastScore && (
          <div class="card p-5 space-y-4">
            <div class="flex items-center gap-3">
              <span class={'badge badge-lg ' + scoreColor(lastScore.score)}>
                {scoreLabel(lastScore.score)} — {lastScore.score}/5
              </span>
            </div>
            <p class="text-sm text-base-content leading-relaxed">{lastScore.feedback}</p>
            <div class="border-t border-base-200 pt-4">
              <p class="text-xs text-content2 mb-2 uppercase tracking-wide">Reference answer</p>
              <p class="text-sm text-content2 leading-relaxed">{card.answer}</p>
            </div>
            <button class="btn btn-primary w-full" onclick={() => send({ type: 'NEXT_CARD' })}>
              {isLast ? 'Finish Session' : 'Next Card →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
