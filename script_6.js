const { healthMiniTopics } = require('./server/seed/healthContent.js');

const mission2 = healthMiniTopics[1]; // Exercise and fitness
const mission2Activities = mission2.activities || mission2.tasks || mission2.questions || mission2.activities;
// Wait, is it `activities` inside the object? Let's check keys of mission2.
console.log('Mission 2 keys:', Object.keys(mission2));

if (mission2.activities) {
  const m2ModalGAP = mission2.activities.filter(a => a.taskSlug === 'modal-verbs' && a.type === 'GAP_FILL');
  m2ModalGAP.slice(0, 5).forEach((a, i) => console.log(`[modal] [${i}] ${a.question}`));
  
  const m2CondGAP = mission2.activities.filter(a => a.taskSlug === 'conditional-sentences' && a.type === 'GAP_FILL');
  m2CondGAP.slice(0, 5).forEach((a, i) => console.log(`[cond] [${i}] ${a.question}`));
}
