const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('C:/Users/flour/.gemini/antigravity/brain/9bbbfaa2-5bad-45ac-8b32-8464428ea410/database.sqlite');
db.all("SELECT taskSlug, count(id) as count FROM Activities WHERE miniTopicId = 'sleep-habits' GROUP BY taskSlug", (err, rows) => {
  if (err) console.error(err);
  else console.log(rows);
});
