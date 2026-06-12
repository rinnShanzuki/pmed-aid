import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Plus, Pencil, X, UserPlus } from 'lucide-react';

const INITIAL_FORM = {
  first_name: '', last_name: '', date_of_birth: '', gender: 'male',
  contact_number: '', address: '', emergency_contact_name: '',
  emergency_contact_number: '', blood_type: '', allergies: ''
};

export default function PatientRegistration() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function fetchPatients() {
    try {
      const { data } = await api.get('/patients', { params: { search } });
      setPatients(data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchPatients(); }, [search]);

  function openAdd() { setForm(INITIAL_FORM); setEditId(null); setError(''); setModal('add'); }

  function openEdit(p) {
    setForm({
      first_name: p.first_name, last_name: p.last_name,
      date_of_birth: p.date_of_birth?.split('T')[0] || '',
      gender: p.gender, contact_number: p.contact_number,
      address: p.address || '', emergency_contact_name: p.emergency_contact_name || '',
      emergency_contact_number: p.emergency_contact_number || '',
      blood_type: p.blood_type || '', allergies: p.allergies || ''
    });
    setEditId(p.id); setError(''); setModal('edit');
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError('');
    try {
      if (modal === 'add') {
        await api.post('/patients', form);
        setSuccess('Patient registered successfully!');
      } else {
        await api.put(`/patients/${editId}`, form);
        setSuccess('Patient information updated!');
      }
      setModal(null); fetchPatients();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.message || 'Operation failed.'); }
  }

  return (
    <>
      {success && <div style={{ padding: '12px 16px', background: '#dcfce7', color: '#166534', borderRadius: 8, marginBottom: 16, fontWeight: 600 }}>{success}</div>}

      <div className="id-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}><UserPlus size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />Patient Registration</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input placeholder="Search patients..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ padding: '10px 12px 10px 36px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', width: 240 }} />
            </div>
            <button className="action-btn primary" onClick={openAdd}><Plus size={16} /> Register Patient</button>
          </div>
        </div>

        <div className="id-table-container">
          <table className="id-table">
            <thead><tr><th>Patient</th><th>DOB</th><th>Gender</th><th>Contact</th><th>Blood Type</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 32 }}>Loading...</td></tr>
              ) : patients.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No patients found</td></tr>
              ) : patients.map(p => (
                <tr key={p.id}>
                  <td><strong>{p.first_name} {p.last_name}</strong></td>
                  <td>{p.date_of_birth}</td>
                  <td><span className={`badge ${p.gender === 'male' ? 'active' : 'pending'}`}>{p.gender}</span></td>
                  <td>{p.contact_number}</td>
                  <td>{p.blood_type || '—'}</td>
                  <td><button className="action-btn outline" onClick={() => openEdit(p)}><Pencil size={14} /> Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setModal(null)}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ margin: 0 }}>{modal === 'add' ? 'Register New Patient' : 'Edit Patient'}</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {error && <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: 8, fontSize: '0.85rem' }}>{error}</div>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div><label style={lbl}>First Name *</label><input style={inp} value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} required /></div>
                  <div><label style={lbl}>Last Name *</label><input style={inp} value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} required /></div>
                  <div><label style={lbl}>Date of Birth *</label><input type="date" style={inp} value={form.date_of_birth} onChange={e => setForm({...form, date_of_birth: e.target.value})} required /></div>
                  <div><label style={lbl}>Gender *</label>
                    <select style={inp} value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                      <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                    </select></div>
                  <div><label style={lbl}>Contact Number *</label><input style={inp} value={form.contact_number} onChange={e => setForm({...form, contact_number: e.target.value})} required /></div>
                  <div><label style={lbl}>Blood Type</label>
                    <select style={inp} value={form.blood_type} onChange={e => setForm({...form, blood_type: e.target.value})}>
                      <option value="">Select</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option><option>O+</option><option>O-</option>
                    </select></div>
                </div>
                <div><label style={lbl}>Address</label><input style={inp} value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div><label style={lbl}>Emergency Contact Name</label><input style={inp} value={form.emergency_contact_name} onChange={e => setForm({...form, emergency_contact_name: e.target.value})} /></div>
                  <div><label style={lbl}>Emergency Contact Number</label><input style={inp} value={form.emergency_contact_number} onChange={e => setForm({...form, emergency_contact_number: e.target.value})} /></div>
                </div>
                <div><label style={lbl}>Allergies</label><textarea style={{...inp, minHeight: 60}} value={form.allergies} onChange={e => setForm({...form, allergies: e.target.value})} /></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #f1f5f9' }}>
                <button type="button" className="action-btn outline" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="action-btn primary">{modal === 'add' ? 'Register Patient' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

const lbl = { display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: 6 };
const inp = { width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', boxSizing: 'border-box' };
