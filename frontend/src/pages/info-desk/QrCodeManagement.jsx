import { useState, useEffect } from 'react';
import api from '../../services/api';
import { QrCode, RefreshCw, Search, Eye, X } from 'lucide-react';

export default function QrCodeManagement() {
  const [qrCodes, setQrCodes] = useState([]);
  const [patients, setPatients] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'generate' | 'view'
  const [form, setForm] = useState({ patient_id: '', admission_id: '', type: 'discharge' });
  const [viewData, setViewData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  async function fetchQrCodes() {
    try {
      const { data } = await api.get('/info-desk/qr-codes');
      setQrCodes(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function fetchDropdowns() {
    try {
      const [pRes, aRes] = await Promise.all([
        api.get('/patients'),
        api.get('/admissions')
      ]);
      setPatients(pRes.data.data);
      setAdmissions(aRes.data.data);
    } catch (err) { console.error(err); }
  }

  useEffect(() => { fetchQrCodes(); fetchDropdowns(); }, []);

  function onPatientChange(patientId) {
    setForm(f => ({ ...f, patient_id: patientId, admission_id: '' }));
  }

  const patientAdmissions = admissions.filter(a => String(a.patient_id) === String(form.patient_id));

  async function handleGenerate(e) {
    e.preventDefault(); setError('');
    try {
      const { data } = await api.post('/qr-codes/generate', form);
      setSuccess('QR Code generated successfully!');
      setModal(null); fetchQrCodes();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.message || 'Failed to generate QR code.'); }
  }

  const filtered = qrCodes.filter(qr => {
    if (!search) return true;
    const name = `${qr.patient?.first_name} ${qr.patient?.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <>
      {success && <div style={{ padding: '12px 16px', background: '#dcfce7', color: '#166534', borderRadius: 8, marginBottom: 16, fontWeight: 600 }}>{success}</div>}

      <div className="id-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}><QrCode size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />QR Code Management</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input placeholder="Search patient..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ padding: '10px 12px 10px 36px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', width: 200 }} />
            </div>
            <button className="action-btn primary" onClick={() => { setForm({ patient_id: '', admission_id: '', type: 'discharge' }); setError(''); setModal('generate'); }}>
              <QrCode size={16} /> Generate QR
            </button>
          </div>
        </div>

        <div className="id-table-container">
          <table className="id-table">
            <thead><tr><th>Patient</th><th>Code</th><th>Type</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 32 }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No QR codes found. Generate one using the button above.</td></tr>
              ) : filtered.map(qr => (
                <tr key={qr.id}>
                  <td><strong>{qr.patient?.first_name} {qr.patient?.last_name}</strong></td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{qr.code?.substring(0, 12)}...</td>
                  <td><span className={`badge ${qr.type === 'discharge' ? 'discharged' : 'active'}`}>{qr.type?.replace('_', ' ')}</span></td>
                  <td><span className={`badge ${qr.status}`}>{qr.status}</span></td>
                  <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{new Date(qr.created_at || qr.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="action-btn outline" onClick={() => { setViewData(qr); setModal('view'); }}><Eye size={14} /> View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Modal */}
      {modal === 'generate' && (
        <div style={overlay} onClick={() => setModal(null)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ margin: 0 }}>Generate QR Code</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleGenerate}>
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {error && <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: 8, fontSize: '0.85rem' }}>{error}</div>}
                <div><label style={lbl}>Patient *</label>
                  <select style={inp} value={form.patient_id} onChange={e => onPatientChange(e.target.value)} required>
                    <option value="">Select Patient</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                  </select></div>
                <div><label style={lbl}>Admission</label>
                  <select style={inp} value={form.admission_id} onChange={e => setForm({...form, admission_id: e.target.value})}>
                    <option value="">Select Admission (Optional)</option>
                    {patientAdmissions.map(a => <option key={a.id} value={a.id}>#{a.id} — {new Date(a.admission_date).toLocaleDateString()} ({a.status})</option>)}
                  </select></div>
                <div><label style={lbl}>QR Type</label>
                  <select style={inp} value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    <option value="discharge">Discharge</option><option value="in_hospital">In Hospital</option>
                  </select></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #f1f5f9' }}>
                <button type="button" className="action-btn outline" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="action-btn primary">Generate QR Code</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {modal === 'view' && viewData && (
        <div style={overlay} onClick={() => setModal(null)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ margin: 0 }}>QR Code Details</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ background: '#f8fafc', borderRadius: 16, padding: 32, marginBottom: 20, border: '1px solid #e2e8f0', display: 'inline-block' }}>
                <QrCode size={120} style={{ color: '#1e293b' }} />
                <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b', marginTop: 12, wordBreak: 'break-all' }}>{viewData.code}</p>
              </div>
              <div style={{ textAlign: 'left', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <p><strong>Patient:</strong> {viewData.patient?.first_name} {viewData.patient?.last_name}</p>
                <p><strong>Type:</strong> {viewData.type?.replace('_', ' ')}</p>
                <p><strong>Status:</strong> <span className={`badge ${viewData.status}`}>{viewData.status}</span></p>
                <p><strong>Bound:</strong> {viewData.boundUser ? viewData.boundUser.email : 'Not yet'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const lbl = { display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: 6 };
const inp = { width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', boxSizing: 'border-box' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalBox = { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540, maxHeight: '90vh', overflow: 'auto' };
