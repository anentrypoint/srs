import * as webjsx from 'webjsx';

function Bubble({ role, content }) {
  const isUser = role === 'user';
  return (
    <div class={'flex ' + (isUser ? 'justify-end' : 'justify-start')}>
      <div class={'max-w-prose rounded-2xl px-4 py-3 text-sm leading-relaxed ' +
        (isUser ? 'bg-primary text-primary-content rounded-br-sm' : 'bg-base-200 text-base-content rounded-bl-sm')}>
        {content}
      </div>
    </div>
  );
}

export function Converse({ state, send }) {
  const { syllabus, dueCards } = state.context;
  let inputEl;
  let listEl;
  let sending = false;

  async function init(container) {
    listEl = container;
    const res = await fetch('/api/converse');
    const data = await res.json();
    if (data.history?.length) {
      webjsx.applyDiff(container, <MessageList history={data.history} />);
    } else {
      webjsx.applyDiff(container, (
        <div class="flex items-center gap-2 text-content2 text-sm py-4">
          <span class="loading loading-dots loading-sm"></span>
          <span>Starting your daily coaching session...</span>
        </div>
      ));
      const startRes = await fetch('/api/converse/start', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
      const startData = await startRes.json();
      if (startData.error) {
        webjsx.applyDiff(container, <p class="text-error text-sm">{startData.error}</p>);
      } else {
        webjsx.applyDiff(container, <MessageList history={[{ role: 'assistant', content: startData.starterMessage }]} />);
      }
    }
  }

  async function send_msg(statusEl) {
    const msg = inputEl?.value?.trim();
    if (!msg || sending) return;
    sending = true;
    inputEl.value = '';
    if (listEl) {
      const cur = listEl.querySelectorAll('[data-bubble]');
      const history = Array.from(cur).map(el => ({ role: el.dataset.role, content: el.textContent }));
      webjsx.applyDiff(listEl, <MessageList history={[...history, { role: 'user', content: msg }]} loading={true} />);
    }
    try {
      const res = await fetch('/api/converse/turn', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: msg }) });
      const data = await res.json();
      if (listEl) webjsx.applyDiff(listEl, <MessageList history={data.history} />);
    } catch (e) {
      webjsx.applyDiff(statusEl, <p class="text-error text-xs">{e.message}</p>);
    }
    sending = false;
  }

  return (
    <div class="min-h-screen bg-base-100 flex flex-col">
      <div class="max-w-2xl mx-auto w-full flex flex-col flex-1 p-6 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold">Daily Chat</h2>
            <p class="text-sm text-content2">{syllabus?.label ?? 'SRS'} coaching session</p>
          </div>
          <button class="btn btn-ghost btn-sm" onclick={() => send({ type: 'BACK' })}>← Back</button>
        </div>

        <div ref={el => init(el)} class="flex-1 space-y-3 overflow-y-auto min-h-64 max-h-128"></div>

        <div ref={el => {}} class="min-h-4"></div>

        <div class="flex gap-2 items-end">
          <textarea
            ref={el => inputEl = el}
            class="textarea flex-1 h-20 resize-none text-sm"
            placeholder="Ask a question, explain a concept, or continue the discussion..."
            onkeydown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send_msg(e.target.parentElement.previousElementSibling))}
          ></textarea>
          <button class="btn btn-primary self-end"
                  onclick={e => send_msg(e.target.closest('.flex').previousElementSibling)}>
            Send
          </button>
        </div>
        <p class="text-xs text-center text-content3">Enter to send, Shift+Enter for new line</p>
      </div>
    </div>
  );
}

function MessageList({ history, loading }) {
  return (
    <div class="space-y-3">
      {(history ?? []).map(m => (
        <div data-bubble data-role={m.role}>
          <Bubble role={m.role} content={m.content} />
        </div>
      ))}
      {loading && (
        <div class="flex justify-start">
          <div class="bg-base-200 rounded-2xl rounded-bl-sm px-4 py-3">
            <span class="loading loading-dots loading-sm"></span>
          </div>
        </div>
      )}
    </div>
  );
}
