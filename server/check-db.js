const { MiniTopic, Activity } = require('./models');

async function check() {
  const miniTopics = await MiniTopic.findAll();
  for (const mt of miniTopics) {
    const activities = await Activity.findAll({ where: { miniTopicId: mt.id } });
    const taskSlugs = [...new Set(activities.map(a => a.taskSlug))];
    console.log(`Mission: ${mt.title}`);
    console.log(`Tasks (${taskSlugs.length}):`, taskSlugs);
  }
}

check();
