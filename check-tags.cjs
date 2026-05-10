const fs = require('fs');
const path = require('fs');

function countTags(content) {
    let open = 0;
    let close = 0;
    
    // Remove comments
    content = content.replace(/{\/\*[\s\S]*?\*\/}/g, '');
    content = content.replace(/\/\/.*/g, '');
    
    // Match opening tags <div ... > (including multiline)
    // but not self-closing <div ... />
    const openMatches = content.match(/<div(?:\s+[^>]*?|(?=\s*>))(?<!\/)>/g);
    if (openMatches) open = openMatches.length;
    
    // Match closing tags </div>
    const closeMatches = content.match(/<\/div>/g);
    if (closeMatches) close = closeMatches.length;
    
    return { open, close };
}

const files = process.argv.slice(2);
files.forEach(f => {
    try {
        const content = fs.readFileSync(f, 'utf8');
        const { open, close } = countTags(content);
        if (open !== close) {
            console.log(`${f}: ${open} open vs ${close} close`);
        }
    } catch (e) {}
});
