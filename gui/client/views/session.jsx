import * as webjsx from 'webjsx';

const scoreBadge = s => s >= 4 ? 'badge-success' : s >= 3 ? 'badge-warning' : 'badge-error';

function AnswerInput({ send }) {
  let inputEl;
  const submit = () => { const v = inputEl?.value?.trim(); if (v != null) send({ type: 'SUBMIT_ANSWER', answer: v }); };
  return (
    <div class="space-y-2">
      <textarea ref={el => inputEl = el} class="textarea w-full h-28" placeholder="Type your answer..." onkeydown={e => e.key === 'Enter' && e.ctrlKey && submit()}></textarea>
      <div class="flex gap-2">
        <button class="btn btn-primary flex-1" onclick={submit}>Submit (Ctrl+Enter)</button>
        <button class="btn btn-ghost" onclick={() => send({ type: 'SUBMIT_ANSWER', answer: '' })}>Skip</button>
      </div>
    </div>
  );
}

export function Session({ state, send }) {
  const { dueCards, currentCardIndex, lastScore } = state.context;
  const card = dueCards?.[currentCardIndex];
  const isScoring = state.matches({ studying: 'scoring' });
  const isReviewing = state.matches({ studying: 'reviewing' });

  if (!card) return <div class="p-6 text-center text-content2">No cards in session.</div>;

  return (
    <div class="p-6 max-w-2xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <span class="text-sm text-content2">Card {currentCardIndex + 1} of {dueCards.length}</span>
        <button class="btn btn-ghost btn-sm" onclick={() => send({ type: 'EXIT_SESSION' })}>Exit</button>
      </div>
      <div class="w-full bg-base-200 rounded-full h-1.5">
        <div class="bg-primary h-1.5 rounded-full" style={'width:' + Math.round((currentCardIndex / dueCards.length) * 100) + '%'}></div>
      </div>
      <div class="card p-6">
        <p class="text-xs text-content2 mb-2 uppercase tracking-wide">{card.topicId}</p>
        <p class="text-lg font-medium">{card.question}</p>
      </div>
      {!isReviewing && (isScoring
        ? <div class="flex items-center gap-2 text-content2"><span class="loading loading-spinner loading-sm"></span> Scoring...</div>
        : <AnswerInput send={send} />
      )}
      {isReviewing && lastScore && (
        <div class="card p-4 space-y-3">
          <div class="flex items-center gap-3">
            <span class={'badge ' + scoreBadge(lastScore.score)}>Score: {lastScore.score}/5</span>
            <span class="text-sm">{lastScore.feedback}</span>
          </div>
          <div class="border-t border-base-300 pt-3">
            <p class="text-xs text-content2 mb-1">Correct answer:</p>
            <p class="text-sm">{card.answer}</p>
          </div>
          <button class="btn btn-primary w-full" onclick={() => send({ type: 'NEXT_CARD' })}>
            {currentCardIndex < dueCards.length - 1 ? 'Next Card' : 'Finish Session'}
          </button>
        </div>
      )}
    </div>
  );
}
