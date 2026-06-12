import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Plus, Pencil, X, BedDouble, UserCheck, LogOut as DischargeIcon, User } from 'lucide-react';

export default function AdmissionManagement() {
  const [admissions, setAdmissions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null, 'patient-type', 'new-patient', 'search-patient', 'assign-room'
  const [form, setForm] = useState({ patient_id: '', room_id: '', attending_doctor_id: '', notes: '' });
  const [patientForm, setPatientForm] = useState({ first_name: '', last_name: '', date_of_birth: '', gender: 'male', contact_number: '' });
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [editId, setEditId] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function fetchAdmissions() {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/admissions', { params });
      setAdmissions(data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function fetchDropdowns() {
    try {
      const [pRes, rRes, dRes] = await Promise.all([
        api.get('/patients'),
        api.get('/rooms/available'),
        api.get('/users', { params: { role: 'doctor' } })
      ]);
      setPatients(pRes.data.data);
      setRooms(rRes.data.data);
      setDoctors(dRes.data.data);
    } catch (err) { console.error(err); }
  }

  useEffect(() => { fetchAdmissions(); }, [statusFilter]);
  useEffect(() => { fetchDropdowns(); }, []);

  function openNewAdmission() {
    setError('');
    setModal('patient-type');
  }

  function startNewPatient() {
    setPatientForm({ first_name: '', last_name: '', date_of_birth: '', gender: 'male', contact_number: '' });
    setError('');
    setModal('new-patient');
  }

  function startSearchPatient() {
    setPatientSearch('');
    setSelectedPatient(null);
    setError('');
    setModal('search-patient');
  }

  async function createNewPatient() {
    if (!patientForm.first_name.trim() || !patientForm.last_name.trim()) {
      setError('Please enter first and last name.');
      return;
    }

    try {
      const { data } = await api.post('/patients', patientForm);
      setSelectedPatient(data.data);
      setForm({ patient_id: data.data.id, room_id: '', attending_doctor_id: '', notes: '' });
      setError('');
      setModal('assign-room');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create patient.');
    }
  }

  function selectSearchedPatient(patient) {
    setSelectedPatient(patient);
    setForm({ patient_id: patient.id, room_id: '', attending_doctor_id: '', notes: '' });
    setError('');
    setModal('assign-room');
  }

  async function handleSubmitAdmission(e) {
    e.preventDefault();
    setError('');
    try {
      if (modal === 'assign-room') {
        await api.post('/admissions', form);
        setSuccess('Patient admitted successfully!');
        setModal(null);
        setSelectedPatient(null);
        fetchAdmissions();
        fetchDropdowns();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Admission failed.');
    }
  }

  function openEdit(adm) {
    setForm({
      patient_id: adm.patient_id, room_id: adm.room_id,
      attending_doctor_id: adm.attending_doctor_id, notes: adm.notes || ''
    });
    setEditId(adm.id); setError(''); setModal('edit');
  }

  async function handleEditSubmit(e) {
    e.preventDefault(); setError('');
    try {
      await api.put(`/admissions/${editId}`, form);
      setSuccess('Admission updated!');
      setModal(null); fetchAdmissions(); fetchDropdowns();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.message || 'Operation failed.'); }
  }

  async function handleDischarge(id) {
    if (!window.confirm('Discharge this patient?')) return;
    try {
      await api.post(`/admissions/${id}/discharge`);
      setSuccess('Patient discharged successfully!');
      fetchAdmissions(); fetchDropdowns();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.message || 'Discharge failed.'); }
  }

  const filteredPatients = patients.filter(p => {
    if (!patientSearch) return true;
    const name = `${p.first_name} ${p.last_name}`.toLowerCase();
    return name.includes(patientSearch.toLowerCase());
  });

  const filtered = admissions.filter(a => {
    if (!search) return true;
    const name = `${a.patient?.first_name} ${a.patient?.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <>
      {success && <div style={{ padding: '12px 16px', background: '#dcfce7', color: '#166534', borderRadius: 8, marginBottom: 16, fontWeight: 600 }}>{success}</div>}

      <div className="id-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}><BedDouble size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />Admission Management</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selStyle}>
              <option value="">All Status</option><option value="admitted">Admitted</option><option value="discharged">Discharged</option>
            </select>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input placeholder="Search patient..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ padding: '10px 12px 10px 36px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', width: 200 }} />
            </div>
            <button className="action-btn primary" onClick={openNewAdmission}><Plus size={16} /> New Admission</button>
          </div>
        </div>

        <div className="id-table-container">
          <table className="id-table">
            <thead><tr><th>Patient</th><th>Room</th><th>Doctor</th><th>Admitted</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 32 }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No admissions found</td></tr>
              ) : filtered.map(a => (
                <tr key={a.id}>
                  <td><strong>{a.patient?.first_name} {a.patient?.last_name}</strong></td>
                  <td>{a.room?.room_number} ({a.room?.room_type?.replace('_', ' ')})</td>
                  <td>Dr. {a.doctor?.first_name} {a.doctor?.last_name}</td>
                  <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{new Date(a.admission_date).toLocaleDateString()}</td>
                  <td><span className={`badge ${a.status}`}>{a.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="action-btn outline" onClick={() => openEdit(a)} title="Edit"><Pencil size={14} /></button>
                      {a.status === 'admitted' && (
                        <button className="action-btn outline" onClick={() => handleDischarge(a.id)} title="Discharge" style={{ color: '#ef4444', borderColor: '#fecaca' }}>
                          <DischargeIcon size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PATIENT TYPE SELECTION MODAL */}
      {modal === 'patient-type' && (
        <div style={overlay} onClick={() => setModal(null)}>
          <div style={{ ...modalBox, maxWidth: 450 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ margin: 0 }}>New Admission</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>Is this patient already registered in the system?</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button
                  onClick={startNewPatient}
                  style={{
                    padding: 20,
                    borderRadius: 12,
                    border: '2px solid #e2e8f0',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.3s',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#64748b'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#eff6ff'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
                >
                  <UserCheck size={24} /> New Patient
                </button>
                <button
                  onClick={startSearchPatient}
                  style={{
                    padding: 20,
                    borderRadius: 12,
                    border: '2px solid #e2e8f0',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.3s',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#64748b'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.background = '#f0fdf4'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
                >
                  <Search size={24} /> Existing Patient
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW PATIENT FORM MODAL */}
      {modal === 'new-patient' && (
        <div style={overlay} onClick={() => setModal(null)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ margin: 0 }}>Register New Patient</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: 8, fontSize: '0.85rem' }}>{error}</div>}
              <div>
                <label style={lbl}>First Name *</label>
                <input
                  style={inp}
                  value={patientForm.first_name}
                  onChange={e => setPatientForm({...patientForm, first_name: e.target.value})}
                  placeholder="First name"
                />
              </div>
              <div>
                <label style={lbl}>Last Name *</label>
                <input
                  style={inp}
                  value={patientForm.last_name}
                  onChange={e => setPatientForm({...patientForm, last_name: e.target.value})}
                  placeholder="Last name"
                />
              </div>
              <div>
                <label style={lbl}>Date of Birth</label>
                <input
                  type="date"
                  style={inp}
                  value={patientForm.date_of_birth}
                  onChange={e => setPatientForm({...patientForm, date_of_birth: e.target.value})}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Gender</label>
                  <select
                    style={inp}
                    value={patientForm.gender}
                    onChange={e => setPatientForm({...patientForm, gender: e.target.value})}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Contact Number</label>
                  <input
                    style={inp}
                    value={patientForm.contact_number}
                    onChange={e => setPatientForm({...patientForm, contact_number: e.target.value})}
                    placeholder="Phone number"
                  />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #f1f5f9' }}>
              <button type="button" className="action-btn outline" onClick={() => setModal(null)}>Cancel</button>
              <button type="button" className="action-btn primary" onClick={createNewPatient}>Continue</button>
            </div>
          </div>
        </div>
      )}

      {/* SEARCH EXISTING PATIENT MODAL */}
      {modal === 'search-patient' && (
        <div style={overlay} onClick={() => setModal(null)}>
          <div style={{ ...modalBox, maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ margin: 0 }}>Select Patient</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  placeholder="Search patient by name..."
                  value={patientSearch}
                  onChange={e => setPatientSearch(e.target.value)}
                  style={{ paddingLeft: 36, ...inp }}
                  autoFocus
                />
              </div>
              <div style={{ maxHeight: 350, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                {filteredPatients.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>No patients found</div>
                ) : (
                  filteredPatients.map(p => (
                    <div
                      key={p.id}
                      onClick={() => selectSearchedPatient(p)}
                      style={{
                        padding: 12,
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        fontSize: '0.9rem'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <User size={16} style={{ color: '#94a3b8' }} />
                      <div>
                        <strong>{p.first_name} {p.last_name}</strong>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>
                          {p.contact_number} • ID: {p.id}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN ROOM & DOCTOR MODAL */}
      {modal === 'assign-room' && selectedPatient && (
        <div style={overlay} onClick={() => setModal(null)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <h3 style={{ margin: 0 }}>Admit Patient</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                  {selectedPatient.first_name} {selectedPatient.last_name}
                </p>
              </div>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmitAdmission}>
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {error && <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: 8, fontSize: '0.85rem' }}>{error}</div>}
                <div>
                  <label style={lbl}>Room *</label>
                  <select style={inp} value={form.room_id} onChange={e => setForm({...form, room_id: e.target.value})} required>
                    <option value="">Select Room</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.room_number} ({r.room_type?.replace('_',' ')})</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Attending Doctor *</label>
                  <select style={inp} value={form.attending_doctor_id} onChange={e => setForm({...form, attending_doctor_id: e.target.value})} required>
                    <option value="">Select Doctor</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Notes</label>
                  <textarea style={{...inp, minHeight: 80}} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Reason for admission..." />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #f1f5f9' }}>
                <button type="button" className="action-btn outline" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="action-btn primary">Admit Patient</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ADMISSION MODAL */}
      {modal === 'edit' && (
        <div style={overlay} onClick={() => setModal(null)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ margin: 0 }}>Edit Admission</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {error && <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: 8, fontSize: '0.85rem' }}>{error}</div>}
                <div>
                  <label style={lbl}>Room *</label>
                  <select style={inp} value={form.room_id} onChange={e => setForm({...form, room_id: e.target.value})} required>
                    <option value="">Select Room</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.room_number} ({r.room_type?.replace('_',' ')})</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Attending Doctor *</label>
                  <select style={inp} value={form.attending_doctor_id} onChange={e => setForm({...form, attending_doctor_id: e.target.value})} required>
                    <option value="">Select Doctor</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Notes</label>
                  <textarea style={{...inp, minHeight: 80}} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Reason for admission..." />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #f1f5f9' }}>
                <button type="button" className="action-btn outline" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="action-btn primary">Save</button>
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
const selStyle = { padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', background: '#fff' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalBox = { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540, maxHeight: '90vh', overflow: 'auto' };
