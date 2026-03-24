import * as webjsx from 'webjsx';
import { createSRSActor } from './machines/srs.js';
import { Dashboard } from './views/dashboard.jsx';
import { Session } from './views/session.jsx';
import { Generator } from './views/generator.jsx';
import { Config } from './views/config.jsx';
import { Stats } from './views/stats.jsx';
import { Topics } from './views/topics.jsx';
import { Converse } from './views/converse.jsx';

const root = document.getElementById('app');
const actor = createSRSActor();

function render(state) {
  const send = actor.send.bind(actor);
  const props = { state, send };
  let view;

  if (state.matches('loading'))          view = <Loading />;
  else if (state.matches('error'))       view = <ErrorView state={state} send={send} />;
  else if (state.matches('studying'))    view = <Session {...props} />;
  else if (state.matches('generating') || state.matches('generating_active')) view = <Generator {...props} />;
  else if (state.matches('configuring')) view = <Config {...props} />;
  else if (state.matches('stats'))       view = <Stats {...props} />;
  else if (state.matches('topics'))      view = <Topics {...props} />;
  else if (state.matches('conversing'))  view = <Converse {...props} />;
  else                                   view = <Dashboard {...props} />;

  webjsx.applyDiff(root, <div class="min-h-screen bg-base-100 text-base-content">{view}</div>);
}

function Loading() {
  return (
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center space-y-3">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <p class="text-content2">Loading SRS...</p>
      </div>
    </div>
  );
}

function ErrorView({ state, send }) {
  return (
    <div class="flex items-center justify-center min-h-screen">
      <div class="card p-8 max-w-md text-center space-y-4">
        <p class="text-error text-lg font-medium">Error</p>
        <p class="text-content2">{state.context.error}</p>
        <button class="btn btn-primary" onclick={() => send({ type: 'RETRY' })}>Retry</button>
      </div>
    </div>
  );
}

actor.subscribe(snapshot => render(snapshot));
actor.start();
