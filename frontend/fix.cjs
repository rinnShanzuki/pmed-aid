const fs = require('fs');
const file = './src/pages/info-desk/AdmissionManagement.jsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/\\\$/g, '$').replace(/\\\`/g, '`');
fs.writeFileSync(file, content);
console.log('Fixed syntax errors');
