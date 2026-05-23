const fs = require('fs');

const pathRegex = /c:[\/\\]*Users[\/\\]+flour[\/\\]+Documents[\/\\]+writewise-antigravity-ready[\/\\]+writewise-antigravity-ready[\/\\]+server[\/\\]+seed[\/\\]+healthContent\.js/ig;

for (let i = 0; i <= 13; i++) {
    let content = fs.readFileSync('script_' + i + '.js', 'utf8');
    content = content.replace(pathRegex, 'server/seed/healthContent.js');
    content = content.replace(/\.\/server\/seed\/healthContent\.js/g, './server/seed/healthContent.js');
    content = content.replace(/\.\/healthContent\.js/g, './server/seed/healthContent.js');
    fs.writeFileSync('script_' + i + '.js', content, 'utf8');
}
console.log('Fixed paths');
