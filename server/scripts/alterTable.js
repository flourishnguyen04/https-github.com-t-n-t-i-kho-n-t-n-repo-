const { sequelize } = require('../models/index.js');
sequelize.query("ALTER TABLE Activities ADD COLUMN matchingData JSON DEFAULT '{}';")
  .then(() => {
    console.log('Column added');
    process.exit(0);
  })
  .catch(err => {
    if (err.message.includes('duplicate column name')) {
      console.log('Column already exists');
      process.exit(0);
    } else {
      console.error(err);
      process.exit(1);
    }
  });
