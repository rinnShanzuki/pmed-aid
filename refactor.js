const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/pages/doctor/Consultations.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove activeTab and admissions state
content = content.replace(/const \[activeTab, setActiveTab\] = useState\('consultations'\);.*\n/, '');
content = content.replace(/const \[admissions, setAdmissions\] = useState\(\[\]\);\n/, '');

// 2. Change useEffect dependency
content = content.replace(/\[activeTab\]/g, '[]');

// 3. Simplify fetchData
const fetchDataRegex = /async function fetchData\(\) \{[\s\S]*?finally \{\s*setLoading\(false\);\s*\}\s*\}/;
const newFetchData = `async function fetchData() {
    setLoading(true);
    try {
      const { data } = await api.get('/consultations', { params: { status: 'waiting,in_session' } });
      setConsultations(data.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load records.');
    } finally {
      setLoading(false);
    }
  }`;
content = content.replace(fetchDataRegex, newFetchData);

// 4. Remove openAdmissionSession
content = content.replace(/async function openAdmissionSession.*?\}\n\n/s, '');

// 5. Simplify startSession
const startSessionRegex = /async function startSession\(\) \{[\s\S]*?catch \(err\) \{[\s\S]*?\}\s*\}/;
const newStartSession = `async function startSession() {
    setError('');
    try {
      await api.put(\`/consultations/\${selectedRecord.id}\`, { status: 'in_session' });
      setSessionStatus('in_session');
      setSuccess('Session started.');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start session.');
    }
  }`;
content = content.replace(startSessionRegex, newStartSession);

// 6. Remove admission actions
content = content.replace(/\/\/ --- ADMISSION FLOW ACTIONS ---[\s\S]*?async function saveAndEndAdmissionSession.*?\}\n\n/s, '');

// 7. Simplify listToFilter
content = content.replace(/const listToFilter = activeTab === 'consultations' \? consultations : admissions;/g, 'const listToFilter = consultations;');

// 8. Remove tabs UI
content = content.replace(/<div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>[\s\S]*?<\/div>\s*<\/div>\s*<div style={{ background: '#fff', borderRadius: 8/s, '<div style={{ background: \'#fff\', borderRadius: 8');

// 9. Add Time column
content = content.replace(/<th>DATE<\/th>\s*<th>STATUS<\/th>/, '<th>DATE</th>\n              <th>TIME</th>\n              <th>STATUS</th>');

// 10. Update table body to render Time and remove admission logic
const tableRowRegex = /<tr key=\{item\.id\}>[\s\S]*?<\/tr>/;
const newTableRow = `<tr key={item.id}>
                  <td style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                      <User size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.patient?.first_name} {item.patient?.last_name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>ID: {item.patient?.id}</div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', color: '#475569', fontSize: '0.9rem' }}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px 20px', color: '#475569', fontSize: '0.9rem' }}>
                    {item.scheduled_time ? new Date(item.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Walk-in</span>}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, 
                      background: item.status === 'waiting' ? '#fef3c7' : '#e0f2fe',
                      color: item.status === 'waiting' ? '#b45309' : '#0284c7'
                    }}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <button className="action-btn primary" onClick={() => openConsultationSession(item)} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                      Open Form
                    </button>
                  </td>
                </tr>`;

content = content.replace(/filtered\.map\(item => \([\s\S]*?<\/tr>\n\s*\)\)/, `filtered.map(item => (\n                ${newTableRow}\n              ))`);

fs.writeFileSync(filePath, content);
console.log('Refactoring complete!');
