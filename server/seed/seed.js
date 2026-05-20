require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Activity = require("../models/Activity");
const MiniTopic = require("../models/MiniTopic");
const Topic = require("../models/Topic");
const { healthMiniTopics } = require("./healthContent");

const topics = [
  {
    title: "Health",
    description: "Build accurate sentences about fast food, exercise, sleep, and online health information.",
    order: 1,
    isDefaultUnlocked: true
  },
  {
    title: "Sport",
    description: "Practice grammar through teamwork, training, competition, and sports culture.",
    order: 2,
    isDefaultUnlocked: false
  },
  {
    title: "Education",
    description: "Write clearly about study habits, school life, learning goals, and classroom choices.",
    order: 3,
    isDefaultUnlocked: false
  },
  {
    title: "Environment",
    description: "Learn sentence patterns for discussing nature, pollution, recycling, and green choices.",
    order: 4,
    isDefaultUnlocked: false
  },
  {
    title: "Technology",
    description: "Practice grammar while writing about devices, online safety, digital learning, and the future.",
    order: 5,
    isDefaultUnlocked: false
  }
];

const placeholderMissions = {
  Sport: ["Teamwork", "Fair Play", "Training", "Sports Events", "Healthy Competition"],
  Education: ["Study Skills", "Classroom Rules", "Online Learning", "Reading Habits", "Future Goals"],
  Environment: ["Recycling", "Clean Water", "Saving Energy", "Public Transport", "Green Spaces"],
  Technology: ["Smart Devices", "Online Safety", "Social Media", "Digital Learning", "Future Technology"]
};

const upsertTopic = (topic) =>
  Topic.findOneAndUpdate(
    { title: topic.title },
    { $set: topic },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

const getMissionPayload = (topicId, mission) => ({
  topicId,
  title: mission.title,
  slug: mission.slug,
  description: mission.description,
  grammarFocus: mission.grammarFocus,
  order: mission.order,
  writingQuestion: mission.writingQuestion,
  writingHints: mission.writingHints || [],
  grammarReminders: mission.grammarReminders || [],
  sentencePatterns: mission.sentencePatterns || [],
  finalWritingModelParagraphs: mission.finalWritingModelParagraphs || [],
  helpfulIdeas: mission.helpfulIdeas || [],
  usefulStructures: mission.usefulStructures || [],
  selfCheckQuestions: mission.selfCheckQuestions || [],
  mapTheme: mission.mapTheme || "paper"
});

const upsertMission = async (topicId, mission) => {
  const payload = getMissionPayload(topicId, mission);
  const titleCandidates = [mission.title, ...(mission.seedAliases || [])];
  const existingMission = await MiniTopic.findOne({
    topicId,
    $or: [{ slug: mission.slug }, { title: { $in: titleCandidates } }]
  });

  if (existingMission) {
    return MiniTopic.findByIdAndUpdate(
      existingMission._id,
      { $set: payload },
      { new: true, setDefaultsOnInsert: true }
    );
  }

  return MiniTopic.findOneAndUpdate(
    { topicId, title: mission.title },
    { $set: payload },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

const deleteMissionRecords = async (missions) => {
  if (!missions.length) return 0;

  const missionIds = missions.map((mission) => mission._id);
  await Activity.deleteMany({ miniTopicId: { $in: missionIds } });
  await MiniTopic.deleteMany({ _id: { $in: missionIds } });

  return missions.length;
};

const removeObsoleteHealthMissionsByTitle = async (healthTopicId) => {
  const currentTitles = healthMiniTopics.flatMap((mission) => [mission.title, ...(mission.seedAliases || [])]);
  const currentSlugs = healthMiniTopics.map((mission) => mission.slug);
  const obsoleteMissions = await MiniTopic.find({
    topicId: healthTopicId,
    $and: [{ title: { $nin: currentTitles } }, { slug: { $nin: currentSlugs } }]
  });
  const removedCount = await deleteMissionRecords(obsoleteMissions);

  if (removedCount) {
    console.log(`Removed ${removedCount} obsolete Health mission record(s) before reseeding.`);
  }
};

const removeObsoleteHealthMissions = async (healthTopicId, currentMissionIds) => {
  const obsoleteMissions = await MiniTopic.find({
    topicId: healthTopicId,
    _id: { $nin: currentMissionIds }
  });
  const removedCount = await deleteMissionRecords(obsoleteMissions);

  if (removedCount) {
    console.log(`Removed ${removedCount} obsolete Health mission record(s) after reseeding.`);
  }
};

const seed = async () => {
  await connectDB();

  const topicDocs = {};
  for (const topic of topics) {
    topicDocs[topic.title] = await upsertTopic(topic);
  }

  await removeObsoleteHealthMissionsByTitle(topicDocs.Health._id);

  const currentHealthMissionIds = [];

  for (const mission of healthMiniTopics) {
    const missionDoc = await upsertMission(topicDocs.Health._id, mission);
    currentHealthMissionIds.push(missionDoc._id);

    await Activity.deleteMany({ miniTopicId: missionDoc._id });
    await Activity.insertMany(
      mission.activities.map((activity) => ({
        miniTopicId: missionDoc._id,
        questionType: activity.questionType || activity.type,
        ...activity
      }))
    );
  }

  await removeObsoleteHealthMissions(topicDocs.Health._id, currentHealthMissionIds);

  for (const [topicTitle, titles] of Object.entries(placeholderMissions)) {
    const topic = topicDocs[topicTitle];

    for (const [index, title] of titles.entries()) {
      await upsertMission(topic._id, {
        title,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        description: "A future grammar mission for this topic.",
        grammarFocus: ["Coming soon"],
        order: index + 1,
        writingQuestion: `Write a paragraph of about 100 words about ${title.toLowerCase()}.`,
        writingHints: ["This mission will be expanded with guided grammar practice later."],
        grammarReminders: ["Review the task instructions before writing."],
        sentencePatterns: ["Use clear sentences and check your grammar."],
        mapTheme: "paper"
      });
    }
  }

  console.log("Seed data is ready. Learning content was updated without deleting users.");
  await mongoose.disconnect();
};

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
