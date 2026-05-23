const { healthMiniTopics } = require('./server/seed/healthContent.js');

const mission2Activities = healthMiniTopics.filter(a => a.taskSlug === 'modal-verbs' && a.type === 'GAP_FILL');

// The first modal-verbs GAP_FILLs were removed and replaced with MATCHING in Mission 1.
// But wait, there is still ONE GAP_FILL in Mission 1 Modal Verbs! (The one about "Busy workers ___ not have enough time")
// So the first one is from Mission 1, the next 5 should be from Mission 2!
mission2Activities.forEach((a, i) => {
  console.log(`[${i}] ${a.question}`);
});
