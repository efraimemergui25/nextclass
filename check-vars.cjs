const fs = require('fs');
const files = process.argv.slice(2);

files.forEach(f => {
    try {
        const content = fs.readFileSync(f, 'utf8');
        const lines = content.split('\n');
        const vars = new Map();
        lines.forEach((line, i) => {
            const match = line.match(/(?:const|let|var)\s+{?\s*([a-zA-Z0-9_,: ]+)\s*}?\s*=/);
            if (match) {
                const names = match[1].split(/[,: ]+/).filter(n => n && !n.match(/^[0-9]/));
                names.forEach(name => {
                    if (vars.has(name)) {
                        console.log(`${f} - Duplicate var: ${name} at lines ${vars.get(name) + 1} and ${i + 1}`);
                    }
                    vars.set(name, i);
                });
            }
        });
    } catch (e) {}
});
