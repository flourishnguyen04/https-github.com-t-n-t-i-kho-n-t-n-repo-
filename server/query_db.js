const sqlite3 = require('sqlite3').verbose();
const dbPath = 'C:/Users/flour/.gemini/antigravity/brain/9bbbfaa2-5bad-45ac-8b32-8464428ea410/database.sqlite';
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) { console.error(err.message); process.exit(1); }
});

db.serialize(() => {
  db.all("SELECT DISTINCT a.taskSlug, a.taskNumber, a.grammarTitle FROM Activities a JOIN MiniTopics mt ON a.miniTopicId = mt.id WHERE mt.slug='sleep-habits' ORDER BY a.taskNumber", [], (err, rows) => {
    if (err) { console.error(err); process.exit(1); }
    console.log(rows);
  });
});
db.close();
