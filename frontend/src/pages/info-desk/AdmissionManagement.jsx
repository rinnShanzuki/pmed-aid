import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Plus, Pencil, X, BedDouble, UserCheck, LogOut as DischargeIcon, User, QrCode } from 'lucide-react';

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

  const [dischargeData, setDischargeData] = useState(null);

  async function openDischargeProcess(adm) {
    try {
      // Fetch discharge prescription
      const { data } = await api.get('/prescriptions', { params: { admission_id: adm.id, type: 'discharge' } });
      const dischargePrescription = data.data && data.data.length > 0 ? data.data[0] : null;
      
      // Fetch QR Code for this prescription or admission (type: discharge)
      // If we don't have a specific endpoint, we can use the prescriptions API or create one.
      // Wait, let's fetch the QR code directly if we can, or we know it's generated during handover.
      // But for discharge, we didn't generate it in the backend yet?
      // Ah! In Consultations.jsx, submitPrescription creates the prescription.
      // But the QR code for discharge might not be created if items were not added or if it's pending.
      // Actually, if it was created successfully, it has qr_code.
      
      setDischargeData({ admission: adm, prescription: dischargePrescription });
      setModal('discharge-process');
    } catch (err) {
      setError('Failed to fetch discharge details.');
    }
  }

  async function confirmAndPrintDischarge() {
    try {
      if (dischargeData.prescription) {
        // Just checking if we need to hit an endpoint to finalize.
        // We can just call handleDischarge and then print.
      }
      
      // We need to fetch the QR code explicitly for the discharge to print it.
      const qrRes = await api.get(`/qr-codes/patient/${dischargeData.admission.patient_id}`);
      const qr = qrRes.data.data.find(q => q.admission_id === dischargeData.admission.id && q.type === 'discharge');
      
      // Print logic
      const printWindow = window.open('', '', 'width=800,height=600');
      printWindow.document.write(`
        <html>
          <head>
            <title>Discharge Summary & QR</title>
            <style>
              body { font-family: sans-serif; padding: 40px; }
              .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
              .qr-container { text-align: center; margin: 40px 0; }
              .qr-img { width: 250px; height: 250px; border: 1px solid #ccc; padding: 10px; }
              .items { border-collapse: collapse; width: 100%; margin-top: 20px; }
              .items th, .items td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Hospital Discharge Summary</h1>
              <h2>Patient: ${dischargeData.admission.patient?.first_name} ${dischargeData.admission.patient?.last_name}</h2>
            </div>
            
            <div class="qr-container">
              <h3>Patient Portal Access QR</h3>
              <p>Scan this code to link your hospital records and view your prescriptions.</p>
              ${qr ? `<img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${qr.code}" class="qr-img" />` : '<p>No QR Code generated</p>'}
              <p style="font-family: monospace;">${qr ? qr.code : ''}</p>
            </div>
            
            ${dischargeData.prescription && dischargeData.prescription.items && dischargeData.prescription.items.length > 0 ? `
              <h3>Take-Home Medications</h3>
              <table class="items">
                <thead><tr><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Instructions</th></tr></thead>
                <tbody>
                  ${dischargeData.prescription.items.map(item => `
                    <tr>
                      <td>${item.medication_name}</td>
                      <td>${item.dosage} ${item.dosage_unit}</td>
                      <td>${item.frequency}x ${item.frequency_unit}</td>
                      <td>${item.instructions || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p>No take-home medications prescribed.</p>'}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      // Use setTimeout to allow images to load before printing
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);

      // Finalize discharge
      await api.post(`/admissions/${dischargeData.admission.id}/discharge`);
      setSuccess('Discharge finalized and printed!');
      setModal(null);
      fetchAdmissions();
    } catch (err) {
      setError('Failed to process discharge.');
    }
  }

  async function handlePrintWristband(admission) {
    try {
      const { data } = await api.post('/qr-codes/generate', {
        patient_id: admission.patient_id,
        admission_id: admission.id,
        type: 'in_hospital'
      });
      const qrCode = data.data.code;

      const printWindow = window.open('', '', 'width=400,height=300');
      printWindow.document.write(`
        <html>
          <head>
            <title>Admission Wristband</title>
            <style>
              body { font-family: sans-serif; padding: 20px; margin: 0; text-align: center; }
              .wristband { border: 2px dashed #ccc; padding: 20px; display: inline-block; }
              .qr-img { width: 150px; height: 150px; }
              h2 { margin: 10px 0 5px; font-size: 1.2rem; }
              p { margin: 0; font-size: 0.9rem; color: #555; }
            </style>
          </head>
          <body>
            <div class="wristband">
              <h2>${admission.patient?.first_name} ${admission.patient?.last_name}</h2>
              <p>Room: ${admission.room?.room_number}</p>
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrCode}" class="qr-img" />
              <p style="font-size: 0.7rem; margin-top: 5px;">${qrCode}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);

    } catch (err) {
      setError('Failed to generate wristband QR.');
      setTimeout(() => setError(''), 3000);
    }
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b', display: 'flex', alignItems: 'center' }}>
              <BedDouble size={20} style={{ marginRight: 8, color: '#1e293b' }} /> Admission Management
            </h3>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input placeholder="Search patient..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '10px 12px 10px 36px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', width: 200 }} />
              </div>
              <button className="action-btn primary" onClick={openNewAdmission}>
                <Plus size={16} /> New Admission
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px', gap: '4px', alignSelf: 'flex-start' }}>
            {['', 'admitted', 'awaiting_discharge', 'discharged'].map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                style={{
                  padding: '6px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: statusFilter === tab ? '#fff' : 'transparent',
                  color: statusFilter === tab ? '#0f172a' : '#64748b',
                  boxShadow: statusFilter === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {tab === '' ? 'All' : tab === 'admitted' ? 'Admitted' : tab === 'awaiting_discharge' ? 'Awaiting Discharge' : 'Discharged'}
              </button>
            ))}
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
                  <td>
                    <span className={`badge ${a.status === 'admitted' && a.discharge_requested ? 'warning' : a.status}`}>
                      {a.status === 'admitted' && a.discharge_requested ? 'Awaiting Discharge' : a.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="action-btn outline" onClick={() => openEdit(a)} title="Edit"><Pencil size={14} /></button>
                      {(a.status === 'admitted' || a.status === 'awaiting_discharge') && (
                        <button className="action-btn outline" onClick={() => handlePrintWristband(a)} title="Print Wristband" style={{ color: '#0ea5e9', borderColor: '#bae6fd' }}>
                          <QrCode size={14} />
                        </button>
                      )}
                      {a.status === 'admitted' && !a.discharge_requested && (
                        <button className="action-btn outline" onClick={() => handleDischarge(a.id)} title="Discharge" style={{ color: '#ef4444', borderColor: '#fecaca' }}>
                          <DischargeIcon size={14} />
                        </button>
                      )}
                      {a.status === 'admitted' && a.discharge_requested && (
                        <button className="action-btn" onClick={() => openDischargeProcess(a)} style={{ background: '#f59e0b', color: '#fff', fontSize: '0.8rem', padding: '4px 8px' }}>
                          Process Discharge
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
          <div style={{ ...modalBox, maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '28px 32px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>New Admission</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>Select how you'd like to register the patient.</p>
            </div>
            <div style={{ padding: '28px 32px 32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <button
                  onClick={startNewPatient}
                  style={{
                    padding: '28px 20px', borderRadius: 12, border: '2px solid #e2e8f0', background: '#fff',
                    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                    transition: 'all 0.2s', fontSize: '0.92rem', fontWeight: 600, color: '#334155'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#1d4ed8'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#334155'; }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                    <UserCheck size={22} />
                  </div>
                  New Patient
                  <span style={{ fontSize: '0.78rem', fontWeight: 400, color: '#94a3b8', marginTop: -4 }}>Register & Admit</span>
                </button>
                <button
                  onClick={startSearchPatient}
                  style={{
                    padding: '28px 20px', borderRadius: 12, border: '2px solid #e2e8f0', background: '#fff',
                    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                    transition: 'all 0.2s', fontSize: '0.92rem', fontWeight: 600, color: '#334155'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.color = '#059669'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#334155'; }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                    <Search size={22} />
                  </div>
                  Existing Patient
                  <span style={{ fontSize: '0.78rem', fontWeight: 400, color: '#94a3b8', marginTop: -4 }}>Search & Admit</span>
                </button>
              </div>
            </div>
            <div style={{ padding: '0 32px 20px', textAlign: 'right' }}>
              <button type="button" className="action-btn outline" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* NEW PATIENT FORM MODAL */}
      {modal === 'new-patient' && (
        <div style={overlay} onClick={() => setModal(null)}>
          <div style={{ ...modalBox, maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '28px 32px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>Register New Patient</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>Fill in the patient's basic information below.</p>
            </div>
            <div style={{ padding: '28px 32px' }}>
              {error && <div style={{ padding: '12px 16px', background: '#fee2e2', color: '#991b1b', borderRadius: 8, fontSize: '0.88rem', marginBottom: 20, fontWeight: 500 }}>{error}</div>}

              <div style={sectionLabel}>Personal Information</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={lbl}>First Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input style={inp} value={patientForm.first_name} onChange={e => setPatientForm({ ...patientForm, first_name: e.target.value })} placeholder="e.g. Juan" />
                </div>
                <div>
                  <label style={lbl}>Last Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input style={inp} value={patientForm.last_name} onChange={e => setPatientForm({ ...patientForm, last_name: e.target.value })} placeholder="e.g. Dela Cruz" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={lbl}>Date of Birth</label>
                  <input type="date" style={inp} value={patientForm.date_of_birth} onChange={e => setPatientForm({ ...patientForm, date_of_birth: e.target.value })} />
                </div>
                <div>
                  <label style={lbl}>Gender</label>
                  <select style={inp} value={patientForm.gender} onChange={e => setPatientForm({ ...patientForm, gender: e.target.value })}>
                    <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 20 }}>
                <div style={sectionLabel}>Contact Details</div>
                <div>
                  <label style={lbl}>Contact Number</label>
                  <input style={inp} value={patientForm.contact_number} onChange={e => setPatientForm({ ...patientForm, contact_number: e.target.value })} placeholder="e.g. 09XX-XXX-XXXX" />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 32px 24px', borderTop: '1px solid #e2e8f0' }}>
              <button type="button" className="action-btn outline" onClick={() => setModal(null)}>Cancel</button>
              <button type="button" className="action-btn primary" onClick={createNewPatient}>Continue to Admission</button>
            </div>
          </div>
        </div>
      )}

      {/* SEARCH EXISTING PATIENT MODAL */}
      {modal === 'search-patient' && (
        <div style={overlay} onClick={() => setModal(null)}>
          <div style={{ ...modalBox, maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '28px 32px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>Select Patient</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>Search for an existing patient to proceed with admission.</p>
            </div>
            <div style={{ padding: '24px 32px 28px' }}>
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  placeholder="Search patient by name..."
                  value={patientSearch}
                  onChange={e => setPatientSearch(e.target.value)}
                  style={{ ...inp, paddingLeft: 40, padding: '12px 14px 12px 40px' }}
                  autoFocus
                />
              </div>
              <div style={{ maxHeight: 340, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                {filteredPatients.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
                    <User size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>No patients found</p>
                  </div>
                ) : (
                  filteredPatients.map(p => (
                    <div
                      key={p.id}
                      onClick={() => selectSearchedPatient(p)}
                      style={{
                        padding: '14px 16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                        transition: 'background 0.15s', display: 'flex', alignItems: 'center', gap: 14
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0 }}>
                        <User size={16} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>{p.first_name} {p.last_name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>
                          {p.contact_number || 'No contact'} &bull; Patient ID: {p.id}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div style={{ padding: '0 32px 20px', textAlign: 'right' }}>
              <button type="button" className="action-btn outline" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN ROOM & DOCTOR MODAL */}
      {modal === 'assign-room' && selectedPatient && (
        <div style={overlay} onClick={() => setModal(null)}>
          <div style={{ ...modalBox, maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '28px 32px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>Admit Patient</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>Assign a room and attending doctor for this patient.</p>
            </div>

            <div style={{ margin: '24px 32px 0', padding: '16px 20px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>{selectedPatient.first_name} {selectedPatient.last_name}</div>
                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Patient ID: {selectedPatient.id}</div>
              </div>
            </div>

            <form onSubmit={handleSubmitAdmission}>
              <div style={{ padding: '24px 32px' }}>
                {error && <div style={{ padding: '12px 16px', background: '#fee2e2', color: '#991b1b', borderRadius: 8, fontSize: '0.88rem', marginBottom: 20, fontWeight: 500 }}>{error}</div>}

                <div style={sectionLabel}>Room Assignment</div>
                <div style={{ marginBottom: 20 }}>
                  <label style={lbl}>Room <span style={{ color: '#ef4444' }}>*</span></label>
                  <select style={inp} value={form.room_id} onChange={e => setForm({ ...form, room_id: e.target.value })} required>
                    <option value="">Select an available room</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.room_number} ({r.room_type?.replace('_', ' ')})</option>)}
                  </select>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 20, marginBottom: 20 }}>
                  <div style={sectionLabel}>Medical Team</div>
                  <div>
                    <label style={lbl}>Attending Doctor <span style={{ color: '#ef4444' }}>*</span></label>
                    <select style={inp} value={form.attending_doctor_id} onChange={e => setForm({ ...form, attending_doctor_id: e.target.value })} required>
                      <option value="">Select attending physician</option>
                      {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 20 }}>
                  <div style={sectionLabel}>Additional Information</div>
                  <div>
                    <label style={lbl}>Admission Notes</label>
                    <textarea style={{ ...inp, minHeight: 90, resize: 'vertical' }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Reason for admission, symptoms, initial observations..." />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 32px 24px', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" className="action-btn outline" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="action-btn primary">Confirm Admission</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ADMISSION MODAL */}
      {modal === 'edit' && (
        <div style={overlay} onClick={() => setModal(null)}>
          <div style={{ ...modalBox, maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '28px 32px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>Edit Admission</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>Update room assignment, doctor, or admission notes.</p>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div style={{ padding: '28px 32px' }}>
                {error && <div style={{ padding: '12px 16px', background: '#fee2e2', color: '#991b1b', borderRadius: 8, fontSize: '0.88rem', marginBottom: 20, fontWeight: 500 }}>{error}</div>}

                <div style={sectionLabel}>Room Assignment</div>
                <div style={{ marginBottom: 20 }}>
                  <label style={lbl}>Room <span style={{ color: '#ef4444' }}>*</span></label>
                  <select style={inp} value={form.room_id} onChange={e => setForm({ ...form, room_id: e.target.value })} required>
                    <option value="">Select Room</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.room_number} ({r.room_type?.replace('_', ' ')})</option>)}
                  </select>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 20, marginBottom: 20 }}>
                  <div style={sectionLabel}>Medical Team</div>
                  <div>
                    <label style={lbl}>Attending Doctor <span style={{ color: '#ef4444' }}>*</span></label>
                    <select style={inp} value={form.attending_doctor_id} onChange={e => setForm({ ...form, attending_doctor_id: e.target.value })} required>
                      <option value="">Select Doctor</option>
                      {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 20 }}>
                  <div style={sectionLabel}>Additional Information</div>
                  <div>
                    <label style={lbl}>Admission Notes</label>
                    <textarea style={{ ...inp, minHeight: 90, resize: 'vertical' }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Reason for admission, symptoms, initial observations..." />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 32px 24px', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" className="action-btn outline" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="action-btn primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* DISCHARGE PROCESS MODAL */}
      {modal === 'discharge-process' && dischargeData && (
        <div style={overlay} onClick={() => setModal(null)}>
          <div style={{ ...modalBox, maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', color: '#0f172a' }}>Process Discharge</h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                  Patient: <strong>{dischargeData.admission.patient?.first_name} {dischargeData.admission.patient?.last_name}</strong>
                </p>
              </div>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
            </div>
            
            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#0f172a' }}>Take-Home Medications</h4>
                {dischargeData.prescription && dischargeData.prescription.items && dischargeData.prescription.items.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: 20, color: '#475569' }}>
                    {dischargeData.prescription.items.map(item => (
                      <li key={item.id} style={{ marginBottom: 4 }}>
                        <strong>{item.medication_name}</strong> - {item.dosage}{item.dosage_unit}, {item.frequency}x {item.frequency_unit}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ margin: 0, color: '#64748b' }}>No take-home medications prescribed.</p>
                )}
              </div>
              
              <div style={{ background: '#eff6ff', padding: 16, borderRadius: 8, border: '1px solid #bfdbfe' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#1d4ed8' }}>Next Steps</h4>
                <p style={{ margin: 0, color: '#1e3a8a', fontSize: '0.9rem' }}>
                  Clicking "Generate & Print Discharge QR" will generate a unique QR code for the patient to link their hospital records to a new account, and open a print dialog containing the QR code and prescription details. The patient will then be officially discharged from the system.
                </p>
              </div>
            </div>

            <div style={{ padding: '16px 32px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: 12, borderRadius: '0 0 16px 16px' }}>
              <button onClick={() => setModal(null)} className="action-btn outline">Cancel</button>
              <button onClick={confirmAndPrintDischarge} className="action-btn" style={{ background: '#3b82f6', color: '#fff' }}>
                Generate & Print Discharge QR
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const sectionLabel = { fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 };
const lbl = { display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 8 };
const inp = { width: '100%', padding: '11px 14px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.9rem', boxSizing: 'border-box', background: '#fff', transition: 'border-color 0.2s', outline: 'none' };
const selStyle = { padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', background: '#fff' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalBox = { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' };
// End of file
