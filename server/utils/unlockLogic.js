const PASSING_SCORE = 60;
const FINAL_WRITING_SLUG = "final-writing";

const GRAMMAR_TASKS = [
  { slug: "present-simple", taskNumber: 1, grammarTitle: "Present Simple" },
  { slug: "modal-verbs", taskNumber: 2, grammarTitle: "Modal Verbs" },
  { slug: "conditional-sentences", taskNumber: 3, grammarTitle: "Conditional Sentences" },
  { slug: "relative-clauses", taskNumber: 4, grammarTitle: "Relative Clauses" },
  { slug: "complex-sentences", taskNumber: 5, grammarTitle: "Complex Sentences" }
];

const TASK_FLOW = [...GRAMMAR_TASKS.map((task) => task.slug), FINAL_WRITING_SLUG];
const ACTIVITY_FLOW = TASK_FLOW;

const toId = (value) => String(value?._id || value);

const progressMapByMiniTopic = (progresses = []) =>
  progresses.reduce((map, progress) => {
    map.set(toId(progress.miniTopicId), progress);
    return map;
  }, new Map());

const getScoreMapValue = (scoreMap, key) => {
  if (!scoreMap) return null;
  if (scoreMap instanceof Map) return scoreMap.get(key) ?? null;
  return scoreMap[key] ?? null;
};

const getCompletedActivities = (progress) => new Set(progress?.completedActivities || []);

const isTaskCompleted = (taskSlug, progress) => getCompletedActivities(progress).has(taskSlug);

const isProgressMissionCompleted = (progress) =>
  Boolean(progress?.isMiniTopicCompleted && isTaskCompleted(FINAL_WRITING_SLUG, progress));

const isActivityTypeUnlocked = (taskSlug, progress) => {
  const index = TASK_FLOW.indexOf(taskSlug);
  if (index === -1) return false;
  if (index === 0) return true;

  const completed = getCompletedActivities(progress);
  return TASK_FLOW.slice(0, index).every((requiredTaskSlug) => completed.has(requiredTaskSlug));
};

const getLevelFromScore = (score) => {
  if (score >= 85) return "Excellent";
  if (score >= 60) return "Good Progress";
  return "Needs Improvement";
};

const isTopicCompleted = (topic, miniTopics, progressMap) => {
  const miniTopicsForTopic = miniTopics.filter((miniTopic) => toId(miniTopic.topicId) === toId(topic._id));
  return (
    miniTopicsForTopic.length > 0 &&
    miniTopicsForTopic.every((miniTopic) => isProgressMissionCompleted(progressMap.get(toId(miniTopic._id))))
  );
};

const buildTopicStatuses = (topics = [], miniTopics = [], progresses = []) => {
  const sortedTopics = [...topics].sort((a, b) => a.order - b.order);
  const progressMap = progressMapByMiniTopic(progresses);
  const completedTopicMap = new Map();

  sortedTopics.forEach((topic) => {
    completedTopicMap.set(toId(topic._id), isTopicCompleted(topic, miniTopics, progressMap));
  });

  return sortedTopics.map((topic, index) => {
    const miniTopicsForTopic = miniTopics.filter((miniTopic) => toId(miniTopic.topicId) === toId(topic._id));
    const completedMiniTopics = miniTopicsForTopic.filter((miniTopic) =>
      isProgressMissionCompleted(progressMap.get(toId(miniTopic._id)))
    ).length;
    const previousTopic = sortedTopics[index - 1];
    const isUnlocked =
      Boolean(topic.isDefaultUnlocked) || (previousTopic && completedTopicMap.get(toId(previousTopic._id)));

    return {
      isUnlocked,
      isCompleted: completedTopicMap.get(toId(topic._id)) || false,
      completedMiniTopics,
      totalMiniTopics: miniTopicsForTopic.length,
      progressPercent:
        miniTopicsForTopic.length === 0 ? 0 : Math.round((completedMiniTopics / miniTopicsForTopic.length) * 100)
    };
  });
};

const buildMiniTopicStatuses = (topic, miniTopics = [], progresses = [], isTopicUnlocked = false) => {
  const sortedMiniTopics = [...miniTopics].sort((a, b) => a.order - b.order);
  const progressMap = progressMapByMiniTopic(progresses);

  return sortedMiniTopics.map((miniTopic, index) => {
    const progress = progressMap.get(toId(miniTopic._id));
    const previousMiniTopic = sortedMiniTopics[index - 1];
    const previousProgress = previousMiniTopic ? progressMap.get(toId(previousMiniTopic._id)) : null;
    const isUnlocked = Boolean(
      isTopicUnlocked && (index === 0 || isProgressMissionCompleted(previousProgress))
    );

    return {
      isUnlocked,
      isCompleted: isProgressMissionCompleted(progress),
      completedActivities: progress?.completedActivities || [],
      activityScores:
        progress?.activityScores instanceof Map
          ? Object.fromEntries(progress.activityScores)
          : progress?.activityScores || {},
      completedAt: progress?.completedAt || null,
      topicId: toId(topic._id)
    };
  });
};

module.exports = {
  ACTIVITY_FLOW,
  FINAL_WRITING_SLUG,
  GRAMMAR_TASKS,
  PASSING_SCORE,
  TASK_FLOW,
  buildTopicStatuses,
  buildMiniTopicStatuses,
  getCompletedActivities,
  getLevelFromScore,
  getScoreMapValue,
  isActivityTypeUnlocked,
  isProgressMissionCompleted,
  progressMapByMiniTopic,
  toId
};
