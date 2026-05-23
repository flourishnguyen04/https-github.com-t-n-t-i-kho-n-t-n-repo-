const fs = require('fs');
let content = fs.readFileSync('seed/healthContent.js', 'utf8');
content = content.replace(/"answer": "ought to"/g, '"correctAnswer": "ought to"');
content = content.replace(/"answer": "might"/g, '"correctAnswer": "might"');
content = content.replace(/"answer": "should not"/g, '"correctAnswer": "should not"');
content = content.replace(/"answer": "can"/g, '"correctAnswer": "can"');
content = content.replace(/"answer": "may"/g, '"correctAnswer": "may"');
fs.writeFileSync('seed/healthContent.js', content, 'utf8');
console.log('Fixed answer keys');