const fs = require('fs');
const replacements = JSON.parse(fs.readFileSync('extracted_replacements.json', 'utf8'));

replacements.forEach((rep, i) => {
    const code = rep.args.CodeContent;
    const path = rep.args.TargetFile;
    // We only want the script name
    const scriptName = `script_${i}.js`;
    fs.writeFileSync(scriptName, code, 'utf8');
    console.log(`Wrote ${scriptName}`);
});
