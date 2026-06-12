import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Stethoscope, Search, Plus, X, Save, CheckCircle, LogOut, AlertCircle, Pill } from 'lucide-react';

export default function Consultations() {
  const [admissions, setAdmissions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [consultationNotes, setConsultationNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [sessionStatus, setSessionStatus] = useState('not_started');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Prescription form states
  const [prescriptionItems, setPrescriptionItems] = useState([]);
  const [newMedication, setNewMedication] = useState({ medication_name: '', dosage: '', dosage_unit: 'mg', route: 'oral', frequency: 'twice daily' });

  useEffect(() => {
    fetchAdmissions();
  }, []);

  async function fetchAdmissions() {
    try {
      const { data } = await api.get('/admissions', { params: { status: 'admitted' } });
      setAdmissions(data.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load admissions.');
    } finally {
      setLoading(false);
    }
  }

  function openConsultation(admission) {
    setSelectedAdmission(admission);
    setConsultationNotes(admission.consultation_notes || admission.notes || '');
    setDiagnosis(admission.diagnosis || '');
    setSessionStatus(admission.consultation_status || 'not_started');
    setPrescriptionItems([]);
    setNewMedication({ medication_name: '', dosage: '', dosage_unit: 'mg', route: 'oral', frequency: 'twice daily' });
    setError('');
    setSuccess('');
    setModal('consultation');
  }

  async function startSession() {
    setError('');
    try {
      await api.put(`/admissions/${selectedAdmission.id}`, {
        consultation_status: 'in_session'
      });
      setSessionStatus('in_session');
      setSuccess('Consultation session started.');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start session.');
    }
  }

  async function saveConsultation() {
    if (!diagnosis.trim() || !consultationNotes.trim()) {
      setError('Please enter both diagnosis and notes.');
      return;
    }

    setError('');
    try {
      await api.put(`/admissions/${selectedAdmission.id}`, {
        diagnosis,
        notes: consultationNotes,
        consultation_status: sessionStatus
      });
      setSuccess('Consultation saved successfully!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save consultation.');
    }
  }

  async function addPrescriptionItem() {
    if (!newMedication.medication_name.trim() || !newMedication.dosage.trim()) {
      setError('Please fill in medication name and dosage.');
      return;
    }
    setPrescriptionItems([...prescriptionItems, { ...newMedication, id: Date.now() }]);
    setNewMedication({ medication_name: '', dosage: '', dosage_unit: 'mg', route: 'oral', frequency: 'twice daily' });
    setError('');
  }

  function removePrescriptionItem(id) {
    setPrescriptionItems(prescriptionItems.filter(item => item.id !== id));
  }

  async function submitPrescription() {
    if (prescriptionItems.length === 0) {
      setError('Please add at least one medication.');
      return;
    }

    setError('');
    try {
      const payload = {
        admission_id: selectedAdmission.id,
        patient_id: selectedAdmission.patient_id,
        doctor_id: null, // Server will use req.user.id
        type: 'in_hospital',
        notes: consultationNotes,
        items: prescriptionItems.map(item => ({
          medication_name: item.medication_name,
          dosage: item.dosage,
          dosage_unit: item.dosage_unit,
          route: item.route,
          frequency: item.frequency
        }))
      };

      await api.post('/prescriptions', payload);
      setSuccess('Prescription created successfully!');
      setPrescriptionItems([]);
      setModal('consultation');

      setTimeout(() => {
        setSuccess('');
        fetchAdmissions();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create prescription.');
    }
  }

  async function requestDischarge() {
    if (!consultationNotes.trim()) {
      setError('Please enter discharge notes.');
      return;
    }

    setError('');
    try {
      await api.post(`/admissions/${selectedAdmission.id}/request-discharge`, {
        notes: consultationNotes
      });
      setSuccess('Discharge request sent to information desk!');
      setModal(null);
      setTimeout(() => {
        setSuccess('');
        fetchAdmissions();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request discharge.');
    }
  }

  async function completeSession() {
    setError('');
    try {
      await api.put(`/admissions/${selectedAdmission.id}`, {
        consultation_status: 'completed'
      });
      setSessionStatus('completed');
      setSuccess('Consultation session completed.');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete session.');
    }
  }

  const filtered = admissions.filter(a => {
    if (!search) return true;
    const name = `${a.patient?.first_name} ${a.patient?.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <>
      {success && <div style={{ padding: '12px 16px', background: '#dcfce7', color: '#166534', borderRadius: 8, marginBottom: 16, fontWeight: 600 }}>{success}</div>}

      <div className="id-card">
        <div className="doc-section-header">
          <h3><Stethoscope size={18} /> Active Consultations</h3>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input placeholder="Search patient..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ padding: '10px 12px 10px 36px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', width: 220 }} />
          </div>
        </div>

        <div className="id-table-container">
          <table className="id-table">
            <thead><tr><th>Patient</th><th>Room</th><th>Admitted</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: 32 }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No active admissions.</td></tr>
              ) : filtered.map(a => (
                <tr key={a.id}>
                  <td><strong>{a.patient?.first_name} {a.patient?.last_name}</strong></td>
                  <td>{a.room?.room_number || '—'}</td>
                  <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{new Date(a.admission_date).toLocaleDateString()}</td>
                  <td>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      background: a.consultation_status === 'in_session' ? '#dbeafe' : a.consultation_status === 'completed' ? '#dcfce7' : '#f3f4f6',
                      color: a.consultation_status === 'in_session' ? '#0369a1' : a.consultation_status === 'completed' ? '#166534' : '#6b7280'
                    }}>
                      {a.consultation_status === 'in_session' ? 'Active' : a.consultation_status === 'completed' ? 'Completed' : 'Not Started'}
                    </span>
                  </td>
                  <td>
                    <button className="action-btn primary" onClick={() => openConsultation(a)} style={{ fontSize: '0.85rem' }}>
                      <Stethoscope size={14} /> Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Consultation Modal */}
      {modal === 'consultation' && selectedAdmission && (
        <div style={overlay} onClick={() => setModal(null)}>
          <div style={{ ...modalBox, maxWidth: 700, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <h3 style={{ margin: 0 }}>Consultation — {selectedAdmission.patient?.first_name} {selectedAdmission.patient?.last_name}</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>Room: {selectedAdmission.room?.room_number || 'Unknown'}</p>
              </div>
              <button onClick={() => setModal(null)} style={closeBtn}><X size={20} /></button>
            </div>

            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: 8, fontSize: '0.85rem', display: 'flex', gap: 8 }}>
                <AlertCircle size={16} /> {error}
              </div>}

              {/* Session Status & Controls */}
              <div style={{ padding: 12, background: '#f0fdf4', borderRadius: 8, border: '1px solid #dcfce7' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Session Status: <span style={{ color: sessionStatus === 'in_session' ? '#15803d' : '#666' }}>
                    {sessionStatus === 'in_session' ? 'Active' : sessionStatus === 'completed' ? 'Completed' : 'Not Started'}
                  </span></span>
                </div>
                {sessionStatus === 'not_started' && (
                  <button onClick={startSession} style={{ ...actionBtn, background: '#3b82f6', color: '#fff' }}>
                    <CheckCircle size={14} /> Start Session
                  </button>
                )}
                {sessionStatus === 'in_session' && (
                  <button onClick={completeSession} style={{ ...actionBtn, background: '#10b981', color: '#fff' }}>
                    <CheckCircle size={14} /> Complete Session
                  </button>
                )}
              </div>

              {/* Consultation Details */}
              {sessionStatus !== 'not_started' && (
                <>
                  <div>
                    <label style={lbl}>Diagnosis</label>
                    <input style={inp} value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="Enter diagnosis..." disabled={sessionStatus === 'completed'} />
                  </div>
                  <div>
                    <label style={lbl}>Consultation Notes</label>
                    <textarea style={{ ...inp, minHeight: 100, resize: 'vertical' }} value={consultationNotes} onChange={e => setConsultationNotes(e.target.value)}
                      placeholder="Enter consultation notes, observations, treatment plan..." disabled={sessionStatus === 'completed'} />
                  </div>

                  {/* Prescription Section */}
                  {sessionStatus === 'in_session' && (
                    <div style={{ padding: 12, background: '#fef3c7', borderRadius: 8, border: '1px solid #fcd34d' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Pill size={16} /> Add Medications to Prescription
                      </h4>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                        <div>
                          <label style={lbl}>Medication Name</label>
                          <input style={inp} value={newMedication.medication_name} onChange={e => setNewMedication({ ...newMedication, medication_name: e.target.value })} placeholder="e.g., Ibuprofen" />
                        </div>
                        <div>
                          <label style={lbl}>Dosage & Unit</label>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input style={{ ...inp, flex: 1 }} value={newMedication.dosage} onChange={e => setNewMedication({ ...newMedication, dosage: e.target.value })} placeholder="500" />
                            <select style={{ ...inp, flex: 0.6 }} value={newMedication.dosage_unit} onChange={e => setNewMedication({ ...newMedication, dosage_unit: e.target.value })}>
                              <option>mg</option>
                              <option>g</option>
                              <option>ml</option>
                              <option>IU</option>
                              <option>mcg</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                        <div>
                          <label style={lbl}>Route</label>
                          <select style={inp} value={newMedication.route} onChange={e => setNewMedication({ ...newMedication, route: e.target.value })}>
                            <option>oral</option>
                            <option>intravenous</option>
                            <option>intramuscular</option>
                            <option>subcutaneous</option>
                            <option>topical</option>
                            <option>inhalation</option>
                          </select>
                        </div>
                        <div>
                          <label style={lbl}>Frequency</label>
                          <input style={inp} value={newMedication.frequency} onChange={e => setNewMedication({ ...newMedication, frequency: e.target.value })} placeholder="e.g., twice daily" />
                        </div>
                      </div>

                      <button onClick={addPrescriptionItem} style={{ ...actionBtn, background: '#f59e0b', color: '#fff', marginBottom: 12 }}>
                        <Plus size={14} /> Add Medication
                      </button>

                      {prescriptionItems.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <h5 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: 600 }}>Prescription Items ({prescriptionItems.length}):</h5>
                          {prescriptionItems.map(item => (
                            <div key={item.id} style={{ padding: 8, background: '#fff', borderRadius: 6, marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                              <span>{item.medication_name} - {item.dosage}{item.dosage_unit}, {item.route}, {item.frequency}</span>
                              <button onClick={() => removePrescriptionItem(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 600 }}>Remove</button>
                            </div>
                          ))}
                          <button onClick={submitPrescription} style={{ ...actionBtn, background: '#3b82f6', color: '#fff', width: '100%', marginTop: 8 }}>
                            <CheckCircle size={14} /> Submit Prescription
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                    <button onClick={saveConsultation} style={{ ...actionBtn, background: '#3b82f6', color: '#fff', flex: 1 }}>
                      <Save size={14} /> Save Consultation
                    </button>
                    {sessionStatus === 'in_session' && (
                      <button onClick={requestDischarge} style={{ ...actionBtn, background: '#ef4444', color: '#fff', flex: 1 }}>
                        <LogOut size={14} /> Request Discharge
                      </button>
                    )}
                    <button onClick={() => setModal(null)} style={{ ...actionBtn, background: '#e2e8f0', color: '#333', flex: 1 }}>
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const lbl = { display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: 6 };
const inp = { width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', boxSizing: 'border-box' };
const actionBtn = { padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalBox = { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540 };
const closeBtn = { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' };
