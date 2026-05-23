const { User, Topic, MiniTopic, Progress } = require("../models");
const { sequelize } = require("../config/db");

const emailToUnlock = "flourishnguyen04@gmail.com";
const ALL_TASKS = [
  "present-simple",
  "modal-verbs",
  "conditional-sentences",
  "relative-clauses",
  "complex-sentences",
  "final-writing"
];

async function unlockAll() {
  try {
    await sequelize.authenticate();
    const user = await User.findOne({ where: { email: emailToUnlock } });
    if (!user) {
      console.log(`User ${emailToUnlock} not found.`);
      process.exit(1);
    }

    const miniTopics = await MiniTopic.findAll();
    
    for (const mt of miniTopics) {
      const [progress, created] = await Progress.findOrCreate({
        where: { userId: user.id, miniTopicId: mt.id },
        defaults: {
          topicId: mt.topicId,
          completedActivities: ALL_TASKS,
          isMiniTopicCompleted: true,
          isTopicCompleted: true,
        }
      });

      if (!created) {
        progress.completedActivities = ALL_TASKS;
        progress.isMiniTopicCompleted = true;
        progress.isTopicCompleted = true;
        await progress.save();
      }
    }
    console.log(`Unlocked all tasks for ${emailToUnlock}.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

unlockAll();
