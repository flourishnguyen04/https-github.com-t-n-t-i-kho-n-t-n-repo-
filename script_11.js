const fs = require('fs');
const { healthMiniTopics } = require('./server/seed/healthContent.js');

const m3 = healthMiniTopics.find(m => m.slug === 'sleep-habits');

if (m3) {
  m3.activities.forEach((act, index) => {
    act.order = index + 1;
  });
  
  fs.writeFileSync('server/seed/healthContent.js', "const healthMiniTopics = " + JSON.stringify(healthMiniTopics, null, 2) + ";\n\nmodule.exports = { healthMiniTopics };\n", 'utf8');
  console.log("Fixed order for all activities in m3");
} else {
  console.log("Not found m3");
}
