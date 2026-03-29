import { readFileSync, writeFileSync } from 'fs';

const EXAM_DATE = new Date('2026-06-15');
const COMPLETION_DEADLINE = new Date('2026-06-01');
const SAFETY_BUFFER_PERCENT = 0.10; // 5% for 95% target + 5% extra safety

function getStudyPlan(totalCards = 16560) {
  const today = new Date();
  const daysAvailable = Math.floor((COMPLETION_DEADLINE - today) / (1000 * 60 * 60 * 24));

  if (daysAvailable <= 0) {
    throw new Error('Completion deadline has passed');
  }

  // SM2 review multiplier: cards reviewed ~2.5x on average
  const reviewMultiplier = 2.5;
  const baseDaily = Math.ceil(totalCards / daysAvailable);
  const withReviews = Math.ceil((totalCards * reviewMultiplier) / daysAvailable);
  const with95Percent = Math.ceil(withReviews * 1.05);
  const dailyTarget = Math.ceil(with95Percent * (1 + SAFETY_BUFFER_PERCENT));

  return {
    today: today.toISOString().split('T')[0],
    completionDeadline: COMPLETION_DEADLINE.toISOString().split('T')[0],
    examDate: EXAM_DATE.toISOString().split('T')[0],
    daysAvailable,
    totalCards,
    reviewMultiplier,
    dailyTargets: {
      baseCardsPerDay: baseDaily,
      withReviewMultiplier: withReviews,
      with95PercentMastery: with95Percent,
      withSafetyBuffer: dailyTarget
    },
    totalStudyInstances: dailyTarget * daysAvailable,
    mastery: {
      targetPercentage: 95,
      safetyMargin: 5,
      totalHeadroom: 10
    },
    adaptiveStrategy: {
      description: 'Daily targets adjust based on assessment performance',
      rules: [
        'If user masters topic at 95%+: reduce daily cards by 5% next topic',
        'If user performs below 90%: increase daily cards by 10% next topic',
        'If falling behind schedule: increase by 15% to catch up',
        'If ahead of schedule: reduce by 10% to allow deeper mastery'
      ]
    }
  };
}

function createTopicSchedule(topics, studyPlan) {
  const schedule = [];
  const topicsPerWeek = Math.ceil(topics.length / (studyPlan.daysAvailable / 7));
  const cardsPerTopic = Math.floor(studyPlan.dailyTargets.withSafetyBuffer / topicsPerWeek) || 15;

  let dayCounter = 0;
  for (const topic of topics) {
    const startDay = dayCounter;
    const topicDays = Math.ceil(cardsPerTopic / Math.ceil(studyPlan.dailyTargets.withSafetyBuffer / 3));

    schedule.push({
      topic: topic.id,
      name: topic.name,
      discipline: topic.discipline || 'General',
      startDay,
      durationDays: topicDays,
      targetCards: cardsPerTopic,
      targetMastery: 95,
      adaptiveMultiplier: 1.0
    });

    dayCounter += topicDays;
  }

  return schedule;
}

export { getStudyPlan, createTopicSchedule, COMPLETION_DEADLINE, EXAM_DATE };
