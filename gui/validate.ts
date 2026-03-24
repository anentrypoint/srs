import { activeSyllabus } from '../src/syllabus/loader.js';

const minCards = (ef: number) => ef >= 0.07 ? 20 : ef >= 0.05 ? 15 : ef >= 0.04 ? 10 : 7;

export async function validateCoverage(cardRows: any[]) {
  const s = activeSyllabus();
  const topics = s.loadTopics();
  const counts: Record<string, number> = {};
  for (const c of cardRows) counts[c.topicId] = (counts[c.topicId] ?? 0) + 1;

  const topicResults = topics.map((t: any) => {
    const actual = counts[t.id] ?? 0;
    const min = minCards(t.examFrequency ?? 0.04);
    return { topicId: t.id, topicName: t.name, discipline: t[s.groupByField] ?? '', examFrequency: t.examFrequency ?? 0, minCards: min, actualCards: actual, covered: actual >= min, gap: Math.max(0, min - actual) };
  }).sort((a: any, b: any) => b.gap - a.gap);

  const covered = topicResults.filter((t: any) => t.covered).length;
  const totalMin = topicResults.reduce((s: number, t: any) => s + t.minCards, 0);
  return {
    ok: true,
    summary: { totalTopics: topics.length, coveredTopics: covered, coveragePercent: Math.round(covered / topics.length * 1000) / 10, totalCards: cardRows.length, totalMinCards: totalMin },
    topics: topicResults,
  };
}
