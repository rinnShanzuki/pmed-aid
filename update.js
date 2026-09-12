const fs = require('fs');
const path = require('path');

const files = [
  'frontend/src/components/admin/AdminLayout.jsx',
  'frontend/src/components/doctor/DoctorLayout.jsx',
  'frontend/src/components/info-desk/InfoDeskLayout.jsx',
  'frontend/src/components/nurse/NurseLayout.jsx',
  'frontend/src/components/patient/PatientLayout.jsx',
  'frontend/src/components/pharmacy/PharmacyLayout.jsx'
];

for (const file of files) {
  const fullPath = path.resolve(file);
  if (!fs.existsSync(fullPath)) continue;
  let content = fs.readFileSync(fullPath, 'utf8');
  content = content.replace(/await logout\(\);\s*navigate\(['"]\/login['"]\);/g, "navigate('/login', { replace: true, state: {} });\n    await logout();");
  fs.writeFileSync(fullPath, content);
  console.log('Updated ' + file);
}
