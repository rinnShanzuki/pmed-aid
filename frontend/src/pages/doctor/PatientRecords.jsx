import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Eye, X, User, FileText, Pill } from 'lucide-react';

export default function PatientRecords() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
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
      setModal('view');
    } catch (err) { console.error(err); }
  }

  return (
    <>
      <div className="id-card">
        <div className="doc-section-header">
          <h3><User size={18} /> Patient Records</h3>
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
                    <button className="action-btn outline" onClick={() => openPatient(p.id)}><Eye size={14} /> View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Detail Modal */}
      {modal === 'view' && viewData && (
        <div style={overlay} onClick={() => setModal(null)}>
          <div style={{ ...modalBox, maxWidth: 680 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ margin: 0 }}>Patient Details</h3>
              <button onClick={() => setModal(null)} style={closeBtn}><X size={20} /></button>
            </div>
            <div style={{ padding: 24 }}>
              {/* Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div><label style={lbl}>Name</label><p style={val}>{viewData.first_name} {viewData.last_name}</p></div>
                <div><label style={lbl}>Date of Birth</label><p style={val}>{viewData.date_of_birth ? new Date(viewData.date_of_birth).toLocaleDateString() : '—'}</p></div>
                <div><label style={lbl}>Gender</label><p style={{ ...val, textTransform: 'capitalize' }}>{viewData.gender || '—'}</p></div>
                <div><label style={lbl}>Contact</label><p style={val}>{viewData.contact_number || '—'}</p></div>
                <div style={{ gridColumn: '1 / -1' }}><label style={lbl}>Address</label><p style={val}>{viewData.address || '—'}</p></div>
                {viewData.medical_history && <div style={{ gridColumn: '1 / -1' }}><label style={lbl}>Medical History</label><p style={val}>{viewData.medical_history}</p></div>}
                {viewData.allergies && <div style={{ gridColumn: '1 / -1' }}><label style={lbl}>Allergies</label><p style={{ ...val, color: '#dc2626' }}>{viewData.allergies}</p></div>}
              </div>

              {/* Current Prescriptions */}
              <h4 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}><Pill size={16} /> Current Medications</h4>
              {prescriptions.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No prescriptions found.</p>
              ) : prescriptions.slice(0, 5).map(rx => (
                <div key={rx.id} style={{ padding: 14, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <strong style={{ fontSize: '0.9rem' }}>Prescription #{rx.id}</strong>
                    <span className={`badge ${rx.status === 'active' ? 'active' : 'inactive'}`}>{rx.status}</span>
                  </div>
                  {rx.items?.map((it, i) => (
                    <p key={i} style={{ fontSize: '0.82rem', color: '#475569', margin: '2px 0' }}>
                      {it.medication_name} — {it.dosage} {it.dosage_unit}, {it.frequency}x/day for {it.duration} days ({it.route})
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const lbl = { fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4, display: 'block' };
const val = { margin: 0, fontSize: '0.95rem', color: '#1e293b', fontWeight: 500 };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalBox = { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540, maxHeight: '90vh', overflow: 'auto' };
const closeBtn = { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' };
