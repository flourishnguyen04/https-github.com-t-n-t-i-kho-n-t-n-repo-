const MiniTopic = require("../models/MiniTopic");
const Progress = require("../models/Progress");
const Submission = require("../models/Submission");
const Topic = require("../models/Topic");
const {
  ACTIVITY_FLOW,
  FINAL_WRITING_SLUG,
  PASSING_SCORE,
  buildTopicStatuses,
  getLevelFromScore,
  isProgressMissionCompleted,
  progressMapByMiniTopic,
  toId
} = require("../utils/unlockLogic");

const ensureProgress = async (userId, miniTopicId) => {
  const miniTopic = await MiniTopic.findById(miniTopicId);

  if (!miniTopic) {
    const error = new Error("Mission was not found.");
    error.statusCode = 404;
    throw error;
  }

  let progress = await Progress.findOne({ userId, miniTopicId });

  if (!progress) {
    progress = await Progress.create({
      userId,
      topicId: miniTopic.topicId,
      miniTopicId
    });
  }

  return progress;
};

const updateTopicCompletion = async (userId, topicId) => {
  const [miniTopics, progresses] = await Promise.all([
    MiniTopic.find({ topicId }).sort({ order: 1 }),
    Progress.find({ userId, topicId })
  ]);
  const progressMap = progressMapByMiniTopic(progresses);
  const isComplete =
    miniTopics.length > 0 &&
    miniTopics.every((miniTopic) => isProgressMissionCompleted(progressMap.get(toId(miniTopic._id))));

  if (isComplete) {
    await Progress.updateMany({ userId, topicId }, { $set: { isTopicCompleted: true } });
  }

  return isComplete;
};

const markActivityPassed = async (userId, miniTopicId, type, score) => {
  if (!ACTIVITY_FLOW.includes(type)) {
    throw new Error("Task type is not supported.");
  }

  const progress = await ensureProgress(userId, miniTopicId);
  if (!progress.activityScores) {
    progress.activityScores = new Map();
  }
  progress.activityScores.set(type, score);

  if (score >= PASSING_SCORE && !progress.completedActivities.includes(type)) {
    progress.completedActivities.push(type);
  }

  await progress.save();
  return progress;
};

const markMiniTopicPassed = async (userId, miniTopicId, score) => {
  const progress = await ensureProgress(userId, miniTopicId);
  if (!progress.activityScores) {
    progress.activityScores = new Map();
  }
  progress.activityScores.set(FINAL_WRITING_SLUG, score);

  if (score >= PASSING_SCORE) {
    if (!progress.completedActivities.includes(FINAL_WRITING_SLUG)) {
      progress.completedActivities.push(FINAL_WRITING_SLUG);
    }
    progress.isMiniTopicCompleted = true;
    progress.completedAt = progress.completedAt || new Date();
  }

  await progress.save();
  const isTopicCompleted = score >= PASSING_SCORE ? await updateTopicCompletion(userId, progress.topicId) : false;

  return { progress, isTopicCompleted };
};

const getMyProgress = async (req, res, next) => {
  try {
    const [topics, miniTopics, progresses, submissions] = await Promise.all([
      Topic.find().sort({ order: 1 }),
      MiniTopic.find().sort({ order: 1 }),
      Progress.find({ userId: req.user._id }),
      Submission.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("topicId", "title")
        .populate("miniTopicId", "title")
    ]);

    const topicStatuses = buildTopicStatuses(topics, miniTopics, progresses);
    const topicsWithStatus = topics.map((topic, index) => ({
      ...topic.toObject(),
      ...topicStatuses[index]
    }));
    const currentMiniTopicIds = new Set(miniTopics.map((miniTopic) => toId(miniTopic._id)));
    const currentProgresses = progresses.filter((progress) => currentMiniTopicIds.has(toId(progress.miniTopicId)));
    const totalMiniTopics = miniTopics.length;
    const completedMiniTopics = currentProgresses.filter(isProgressMissionCompleted).length;
    const currentUnlockedTopic =
      topicsWithStatus.find((topic) => topic.isUnlocked && !topic.isCompleted) ||
      [...topicsWithStatus].reverse().find((topic) => topic.isUnlocked) ||
      null;
    const recentSubmission = submissions[0] || null;

    res.json({
      overallProgressPercent:
        totalMiniTopics === 0 ? 0 : Math.round((completedMiniTopics / totalMiniTopics) * 100),
      completedMiniTopics,
      totalMiniTopics,
      currentUnlockedTopic,
      recentWritingScore: typeof recentSubmission?.score === "number" ? recentSubmission.score : null,
      recentWritingLevel: recentSubmission?.level || null,
      topics: topicsWithStatus,
      recentSubmissions: submissions
    });
  } catch (error) {
    next(error);
  }
};

const completeActivity = async (req, res, next) => {
  try {
    const { miniTopicId, type, score } = req.body;

    if (!miniTopicId || !type || typeof score !== "number") {
      res.status(400);
      throw new Error("Mission, task type, and score are required.");
    }

    const progress = await markActivityPassed(req.user._id, miniTopicId, type, score);
    res.json({ progress, passed: score >= PASSING_SCORE });
  } catch (error) {
    next(error);
  }
};

const completeMiniTopic = async (req, res, next) => {
  try {
    const { miniTopicId, score } = req.body;

    if (!miniTopicId || typeof score !== "number") {
      res.status(400);
      throw new Error("Mission and score are required.");
    }

    const result = await markMiniTopicPassed(req.user._id, miniTopicId, score);
    res.json({ ...result, passed: score >= PASSING_SCORE });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  completeActivity,
  completeMiniTopic,
  ensureProgress,
  getMyProgress,
  markActivityPassed,
  markMiniTopicPassed,
  updateTopicCompletion
};
