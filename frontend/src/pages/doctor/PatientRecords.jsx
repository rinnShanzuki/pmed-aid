import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Eye, User, FileText, Pill, ArrowLeft, AlertTriangle } from 'lucide-react';

export default function PatientRecords() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewData, setViewData] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => {
    api.get('/patients', { params: { search } })
      .then(({ data }) => setPatients(data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search]);

  async function openPatient(id) {
    try {
      const [pRes, rxRes] = await Promise.all([
        api.get(`/patients/${id}`),
        api.get('/prescriptions', { params: { patient_id: id } }),
      ]);
      setViewData(pRes.data.data);
      setPrescriptions(rxRes.data.data || []);
    } catch (err) { console.error(err); }
  }

  if (viewData) {
    return (
      <div style={{ padding: '0 0 40px 0' }}>
        <div style={{ marginBottom: 24 }}>
          <button onClick={() => setViewData(null)} style={{ background: 'none', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.9rem', padding: 0 }}>
            <ArrowLeft size={16} /> Back to My Patients
          </button>
        </div>
        
        <div style={{ background: '#fff', borderRadius: 12, padding: 32, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '2px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ background: '#eff6ff', color: '#3b82f6', width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={28} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>{viewData.first_name} {viewData.last_name}</h2>
                <div style={{ fontSize: '0.95rem', color: '#64748b', marginTop: 4 }}>
                  Patient ID: {viewData.id} • {viewData.gender ? viewData.gender.charAt(0).toUpperCase() + viewData.gender.slice(1) : '—'}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 32 }}>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <label style={lbl}>Date of Birth</label>
              <p style={val}>{viewData.date_of_birth ? new Date(viewData.date_of_birth).toLocaleDateString() : '—'}</p>
            </div>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <label style={lbl}>Contact Number</label>
              <p style={val}>{viewData.contact_number || '—'}</p>
            </div>
            <div style={{ gridColumn: '1 / -1', background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <label style={lbl}>Address</label>
              <p style={val}>{viewData.address || '—'}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
            <div style={{ padding: 20, border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#334155', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} /> Medical History
              </h4>
              <p style={{ margin: 0, color: viewData.medical_history ? '#1e293b' : '#94a3b8', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {viewData.medical_history || 'No medical history recorded.'}
              </p>
            </div>
            <div style={{ padding: 20, border: '1px solid #fee2e2', borderRadius: 8, background: '#fef2f2' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={18} /> Allergies
              </h4>
              <p style={{ margin: 0, color: viewData.allergies ? '#dc2626' : '#fca5a5', lineHeight: '1.6', fontWeight: viewData.allergies ? 500 : 400, whiteSpace: 'pre-wrap' }}>
                {viewData.allergies || 'No known allergies.'}
              </p>
            </div>
          </div>

          <div>
            <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '2px solid #f1f5f9', paddingBottom: 8 }}>
              <Pill size={18} /> Current Medications
            </h3>
            {prescriptions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, background: '#f8fafc', borderRadius: 8, color: '#94a3b8' }}>
                <Pill size={32} style={{ opacity: 0.5, marginBottom: 8 }} />
                <p style={{ margin: 0 }}>No active or previous prescriptions found.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {prescriptions.map(rx => (
                  <div key={rx.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: '#334155', fontSize: '0.95rem' }}>Prescription #{rx.id}</strong>
                      <span className={`badge ${rx.status === 'active' ? 'active' : 'inactive'}`} style={{ fontSize: '0.75rem', padding: '4px 8px' }}>{rx.status}</span>
                    </div>
                    <div style={{ padding: '8px 16px' }}>
                      {rx.items?.map((it, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', padding: '12px 0', borderBottom: i < rx.items.length - 1 ? '1px dashed #e2e8f0' : 'none' }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', marginTop: 6, marginRight: 12 }}></div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{it.medication_name}</div>
                            <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: 4 }}>
                              {it.dosage} {it.dosage_unit} • {it.frequency}x/{it.frequency_unit} for {it.duration} {it.duration_unit} • Route: {it.route}
                            </div>
                            {it.instructions && <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 6, fontStyle: 'italic' }}>"{it.instructions}"</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="id-card">
      <div className="doc-section-header">
        <h3><User size={18} /> My Patients</h3>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input placeholder="Search patients..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: '10px 12px 10px 36px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', width: 240 }} />
        </div>
      </div>
      <div className="id-table-container">
        <table className="id-table">
          <thead><tr><th>Name</th><th>DOB</th><th>Gender</th><th>Contact</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: 32 }}>Loading...</td></tr>
            ) : patients.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No patients found.</td></tr>
            ) : patients.map(p => (
              <tr key={p.id}>
                <td><strong>{p.first_name} {p.last_name}</strong></td>
                <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString() : '—'}</td>
                <td style={{ textTransform: 'capitalize' }}>{p.gender || '—'}</td>
                <td>{p.contact_number || '—'}</td>
                <td>
                  <button className="action-btn outline" onClick={() => openPatient(p.id)}><Eye size={14} /> View File</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const lbl = { fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' };
const val = { margin: 0, fontSize: '0.95rem', color: '#1e293b', fontWeight: 500 };
