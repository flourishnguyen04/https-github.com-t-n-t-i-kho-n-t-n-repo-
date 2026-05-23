const fs = require('fs');
const readline = require('readline');

async function processTranscript() {
    const fileStream = fs.createReadStream('C:\\Users\\flour\\.gemini\\antigravity\\brain\\42ed16ee-4643-4422-9a60-2b3cd10e93df\\.system_generated\\logs\\transcript.jsonl');

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let replacements = [];

    for await (const line of rl) {
        try {
            const entry = JSON.parse(line);
            if (entry.tool_calls) {
                for (const tool of entry.tool_calls) {
                    if (tool.name === 'multi_replace_file_content' || tool.name === 'replace_file_content' || tool.name === 'write_to_file') {
                        if (JSON.stringify(tool.args).includes('healthContent.js')) {
                            replacements.push(tool);
                        }
                    }
                }
            }
        } catch (e) {
            // Ignore parse errors
        }
    }

    fs.writeFileSync('C:\\Users\\flour\\.gemini\\antigravity\\worktrees\\writewise-antigravity-ready\\open-web-page-intent\\extracted_replacements.json', JSON.stringify(replacements, null, 2));
    console.log(`Extracted ${replacements.length} tool calls targeting healthContent.js`);
}

processTranscript();
