import { createMachine, createActor, assign, fromPromise } from 'xstate';

export const srsMachine = createMachine({
  id: 'srs',
  initial: 'loading',
  context: { config: null, syllabus: null, stats: null, dueCards: [], currentCardIndex: 0, lastScore: null, sessionResults: [], error: null, pendingAnswer: null },
  states: {
    loading: {
      invoke: {
        src: 'loadInitial',
        onDone: { target: 'dashboard', actions: assign(({ event: e }) => ({ config: e.output.config, syllabus: e.output.syllabus, stats: e.output.stats, dueCards: e.output.dueCards })) },
        onError: { target: 'error', actions: assign(({ event: e }) => ({ error: e.error?.message ?? 'Load failed' })) }
      }
    },
    dashboard: {
      on: {
        START_STUDY: { target: 'studying', guard: ({ context: c }) => (c.dueCards?.length ?? 0) > 0 },
        OPEN_GENERATE: 'generating', OPEN_CONFIG: 'configuring',
        OPEN_STATS: 'stats', OPEN_TOPICS: 'topics', REFRESH: 'loading'
      }
    },
    studying: {
      initial: 'presenting',
      on: { EXIT_SESSION: { target: 'dashboard', actions: assign(() => ({ currentCardIndex: 0, lastScore: null, sessionResults: [] })) } },
      states: {
        presenting: { on: { SUBMIT_ANSWER: { target: 'scoring', actions: assign(({ event: e }) => ({ pendingAnswer: e.answer })) } } },
        scoring: {
          invoke: {
            src: 'scoreAnswer',
            input: ({ context: c }) => ({ card: c.dueCards[c.currentCardIndex], userAnswer: c.pendingAnswer ?? '' }),
            onDone: { target: 'reviewing', actions: assign(({ context: c, event: e }) => ({ lastScore: e.output, sessionResults: [...c.sessionResults, { cardId: c.dueCards[c.currentCardIndex]?.id, score: e.output.score }] })) },
            onError: { target: 'reviewing', actions: assign(() => ({ lastScore: { score: 3, feedback: 'Could not score — defaulted to 3' } })) }
          }
        },
        reviewing: {
          on: {
            NEXT_CARD: [
              { target: '#srs.dashboard', guard: ({ context: c }) => c.currentCardIndex >= (c.dueCards?.length ?? 1) - 1, actions: assign(() => ({ currentCardIndex: 0, lastScore: null, sessionResults: [] })) },
              { target: 'presenting', actions: assign(({ context: c }) => ({ currentCardIndex: c.currentCardIndex + 1, lastScore: null })) }
            ]
          }
        }
      }
    },
    generating: { on: { GENERATE_TOPIC: 'generating_active', BACK: 'dashboard' } },
    generating_active: {
      invoke: {
        src: 'generateCards',
        input: ({ event: e }) => ({ topicId: e.topicId, count: e.count ?? 8 }),
        onDone: 'loading',
        onError: { target: 'generating', actions: assign(({ event: e }) => ({ error: e.error?.message })) }
      }
    },
    configuring: { on: { SAVE_CONFIG: 'loading', BACK: 'dashboard' } },
    stats: { on: { BACK: 'dashboard' } },
    topics: { on: { BACK: 'dashboard' } },
    error: { on: { RETRY: 'loading' } }
  }
});

const post = (p, b) => fetch(p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }).then(r => r.json());
const get = (p) => fetch(p).then(r => r.json());

export function createSRSActor() {
  return createActor(srsMachine.provide({
    actors: {
      loadInitial: fromPromise(async () => {
        const [config, syllabus, stats, dueCards] = await Promise.all([get('/api/config'), get('/api/syllabus'), get('/api/stats'), get('/api/due')]);
        return { config, syllabus, stats, dueCards };
      }),
      scoreAnswer: fromPromise(async ({ input }) => post('/api/session/score', input)),
      generateCards: fromPromise(async ({ input }) => post('/api/generate', input)),
    }
  }));
}
