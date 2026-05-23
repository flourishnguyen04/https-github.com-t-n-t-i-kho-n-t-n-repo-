const fs = require('fs');
const replacements = JSON.parse(fs.readFileSync('extracted_replacements.json', 'utf8'));

replacements.forEach((rep, i) => {
    let code = rep.args.CodeContent;
    if (code.startsWith('"') && code.endsWith('"')) {
        code = JSON.parse(code);
    }
    code = code.replace(/c:\\[\/\\]*Users[\/\\]+flour[\/\\]+Documents[\/\\]+writewise-antigravity-ready[\/\\]+writewise-antigravity-ready[\/\\]+server[\/\\]+seed[\/\\]+healthContent\.js/ig, 'server/seed/healthContent.js');
    code = code.replace(/c:\/Users\/flour\/Documents\/writewise-antigravity-ready\/writewise-antigravity-ready\/server\/seed\/healthContent\.js/ig, 'server/seed/healthContent.js');
    code = code.replace(/\.\/healthContent\.js/g, './server/seed/healthContent.js');
    
    fs.writeFileSync(`script_${i}.js`, code, 'utf8');
});
console.log('Scripts extracted and unescaped.');
