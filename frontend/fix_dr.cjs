const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walkDir(file));
        } else if (file.endsWith('.jsx')) { 
            results.push(file);
        }
    });
    return results;
}

const files = walkDir(srcDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Remove "Dr. " or "Dr." hardcodings before doctor names
    // Examples:
    // `Dr. ${a.doctor.last_name}` -> `${a.doctor.last_name}`
    // `Dr. ${d.first_name}` -> `${d.first_name}`
    // Dr. {item.doctor -> {item.doctor
    // Dr. {p.doctor -> {p.doctor
    
    content = content.replace(/Dr\.\s*\${/g, '${');
    content = content.replace(/Dr\.\s*\{/g, '{');
    content = content.replace(/Dr\.\s*(\w+\.doctor)/g, '$1');
    content = content.replace(/Welcome,\s*Dr\.\s*\{/g, 'Welcome, {');

    fs.writeFileSync(file, content, 'utf8');
});

console.log('Replaced "Dr." prefixes across frontend JSX files.');
