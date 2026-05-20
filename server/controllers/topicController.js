const Topic = require("../models/Topic");
const MiniTopic = require("../models/MiniTopic");
const Progress = require("../models/Progress");
const { buildMiniTopicStatuses, buildTopicStatuses, toId } = require("../utils/unlockLogic");

const loadLearningState = async (userId) => {
  const [topics, miniTopics, progresses] = await Promise.all([
    Topic.find().sort({ order: 1 }),
    MiniTopic.find().sort({ order: 1 }),
    Progress.find({ userId })
  ]);

  const topicStatuses = buildTopicStatuses(topics, miniTopics, progresses);
  const statusMap = new Map(topics.map((topic, index) => [toId(topic._id), topicStatuses[index]]));

  return { topics, miniTopics, progresses, statusMap };
};

const getTopics = async (req, res, next) => {
  try {
    const { topics, miniTopics, progresses } = await loadLearningState(req.user._id);
    const topicStatuses = buildTopicStatuses(topics, miniTopics, progresses);

    res.json(
      topics.map((topic, index) => ({
        ...topic.toObject(),
        ...topicStatuses[index]
      }))
    );
  } catch (error) {
    next(error);
  }
};

const getTopicById = async (req, res, next) => {
  try {
    const { topics, miniTopics, progresses, statusMap } = await loadLearningState(req.user._id);
    const topic = topics.find((item) => toId(item._id) === req.params.topicId);

    if (!topic) {
      res.status(404);
      throw new Error("Topic was not found.");
    }

    const topicMiniTopics = miniTopics.filter((miniTopic) => toId(miniTopic.topicId) === toId(topic._id));
    const miniTopicStatuses = buildMiniTopicStatuses(
      topic,
      topicMiniTopics,
      progresses,
      statusMap.get(toId(topic._id))?.isUnlocked
    );

    res.json({
      topic: {
        ...topic.toObject(),
        ...statusMap.get(toId(topic._id))
      },
      miniTopics: topicMiniTopics.map((miniTopic, index) => ({
        ...miniTopic.toObject(),
        ...miniTopicStatuses[index]
      }))
    });
  } catch (error) {
    next(error);
  }
};

const getMiniTopicsByTopic = async (req, res, next) => {
  try {
    const { topics, miniTopics, progresses, statusMap } = await loadLearningState(req.user._id);
    const topic = topics.find((item) => toId(item._id) === req.params.topicId);

    if (!topic) {
      res.status(404);
      throw new Error("Topic was not found.");
    }

    const topicMiniTopics = miniTopics.filter((miniTopic) => toId(miniTopic.topicId) === toId(topic._id));
    const miniTopicStatuses = buildMiniTopicStatuses(
      topic,
      topicMiniTopics,
      progresses,
      statusMap.get(toId(topic._id))?.isUnlocked
    );

    res.json(
      topicMiniTopics.map((miniTopic, index) => ({
        ...miniTopic.toObject(),
        ...miniTopicStatuses[index]
      }))
    );
  } catch (error) {
    next(error);
  }
};

module.exports = { getTopics, getTopicById, getMiniTopicsByTopic, loadLearningState };
