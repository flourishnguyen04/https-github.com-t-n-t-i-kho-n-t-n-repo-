const data = require('./server/seed/healthContent.js');

const mission2Activities = data.filter(a => a.taskSlug === 'modal-verbs' && a.type === 'GAP_FILL');
// Note: mission1 GAP_FILL for modal-verbs was removed and replaced with MATCHING, so mission2's GAP_FILL are now the FIRST ones!
// Let's print the questions:
mission2Activities.slice(0, 5).forEach(a => {
  console.log(a.question);
});
