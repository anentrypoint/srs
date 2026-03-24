export function calcSM2(state, score) {
  if (score < 3) return { ...state, interval: 1, repetitions: 0, easeFactor: state.easeFactor };
  const ef = Math.max(1.3, state.easeFactor + 0.1 - (5 - score) * (0.08 + (5 - score) * 0.02));
  let interval;
  if (state.repetitions === 0) interval = 1;
  else if (state.repetitions === 1) interval = 6;
  else interval = Math.round(state.interval * ef);
  return { easeFactor: ef, interval, repetitions: state.repetitions + 1 };
}

export function compressInterval(interval, effectiveDays, pendingCount) {
  if (effectiveDays <= 0) return 1;
  const pressure = Math.min(1, pendingCount / effectiveDays);
  return Math.max(1, Math.round(interval * (1 - pressure * 0.5)));
}

export function defaultCardState() {
  return { easeFactor: 2.5, interval: 1, repetitions: 0, dueDate: new Date().toISOString().slice(0, 10), lastScore: null };
}
