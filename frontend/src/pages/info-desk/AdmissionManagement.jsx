import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Plus, Pencil, X, BedDouble, UserCheck, LogOut as DischargeIcon, User, QrCode, CheckCircle, Clock, ClipboardList } from 'lucide-react';

const PRESCRIPTION_CSS = `
/* --- Screen preview wrapper --- */
.rx-doc-wrapper { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 24px; background: #eef1f5; min-height: 100vh; font-family: "Segoe UI", Roboto, -apple-system, sans-serif; }
.rx-doc-status { padding: 40px; text-align: center; color: #445; font-family: "Segoe UI", Roboto, sans-serif; }
.rx-doc-status--error { color: #b02a2a; }
.rx-doc-toolbar { width: 100%; max-width: 720px; display: flex; justify-content: flex-end; }
.rx-doc-print-btn { background: #12213a; color: #fff; border: none; border-radius: 6px; padding: 10px 20px; font-size: 14px; font-weight: 600; cursor: pointer; letter-spacing: 0.02em; }
.rx-doc-print-btn:hover { background: #1c3358; }
/* --- The printable page itself (A4-proportioned) --- */
.rx-doc-page { width: 720px; max-width: 100%; background: #fff; box-shadow: 0 2px 16px rgba(18, 33, 58, 0.12); padding: 48px 56px 40px; color: #17233a; box-sizing: border-box; }
.rx-doc-header { text-align: center; border-bottom: 2px solid #12213a; padding-bottom: 14px; margin-bottom: 20px; }
.rx-doc-hospital-name { font-family: Georgia, "Times New Roman", serif; font-size: 24px; font-weight: 700; letter-spacing: 0.02em; color: #12213a; }
.rx-doc-hospital-meta { font-size: 12px; color: #5a6478; margin-top: 4px; }
.rx-doc-patient-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; margin-bottom: 26px; font-size: 13.5px; }
.rx-doc-label { display: block; text-transform: uppercase; font-size: 10.5px; letter-spacing: 0.06em; color: #8892a3; margin-bottom: 2px; }
.rx-doc-value { display: block; font-weight: 600; color: #17233a; }
.rx-doc-section-title { font-size: 14px; text-transform: uppercase; letter-spacing: 0.06em; color: #12213a; border-bottom: 1px solid #d7dce5; padding-bottom: 6px; margin: 0 0 12px; }
.rx-doc-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 30px; }
.rx-doc-table th { text-align: left; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.04em; color: #5a6478; border-bottom: 1px solid #12213a; padding: 6px 8px; }
.rx-doc-table td { padding: 9px 8px; border-bottom: 1px solid #e7eaf0; vertical-align: top; }
.rx-doc-med-name { font-weight: 700; }
/* --- QR block: appears directly below the prescription list --- */
.rx-doc-qr-section { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 22px 20px; border: 1px dashed #b9c1d0; border-radius: 8px; margin-bottom: 28px; }
.rx-doc-qr-img { width: 160px; height: 160px; image-rendering: pixelated; }
.rx-doc-qr-caption { max-width: 360px; font-size: 12px; color: #5a6478; margin-top: 12px; line-height: 1.5; }
.rx-doc-footer { display: flex; justify-content: flex-end; }
.rx-doc-signature-line { display: flex; flex-direction: column; align-items: center; border-top: 1px solid #17233a; padding-top: 6px; width: 220px; font-size: 13px; font-weight: 600; }
.rx-doc-signature-label { font-size: 10.5px; font-weight: 400; text-transform: uppercase; letter-spacing: 0.05em; color: #8892a3; margin-top: 2px; }
/* --- Print rules: only the document prints, sized to A4 --- */
@media print {
  body { background: #fff; margin: 0; padding: 0; }
  .rx-doc-toolbar { display: none; }
  .rx-doc-wrapper { background: #fff; padding: 0; min-height: 0; display: block; }
  .rx-doc-page { box-shadow: none; width: 100%; padding: 0; margin: 0; }
  @page { size: A4; margin: 14mm; }
}
`;

export default function AdmissionManagement() {
  const [admissions, setAdmissions] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [patients, setPatients] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('arrivals'); // arrivals, pending_admissions, admitted, outpatient, discharged
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patientForm, setPatientForm] = useState({ first_name: '', last_name: '', date_of_birth: '', gender: 'male', contact_number: '', civil_status: 'single', address: '' });
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedConsultation, setSelectedConsultation] = useState(null);

  const [consultationForm, setConsultationForm] = useState({ doctor_id: '', notes: '' });
  const [admissionForm, setAdmissionForm] = useState({ room_id: '', attending_doctor_id: '', notes: '' });

  const [patientSearch, setPatientSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dischargeData, setDischargeData] = useState(null);

  async function fetchData() {
    setLoading(true);
    try {
      if (activeTab === 'admitted' || activeTab === 'discharged') {
        const { data } = await api.get('/admissions', { params: { status: activeTab } });
        setAdmissions(data.data);
      } else if (activeTab === 'arrivals') {
        const { data } = await api.get('/consultations', { params: { status: 'waiting,in_session' } });
        setConsultations(data.data);
      } else if (activeTab === 'pending_admissions') {
        const { data } = await api.get('/consultations', { params: { admission_required: true, pending_admission: true } });
        setConsultations(data.data);
      } else if (activeTab === 'outpatient') {
        const { data } = await api.get('/consultations', { params: { admission_required: false, status: 'completed' } });
        setConsultations(data.data);
      }
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

  useEffect(() => { fetchData(); }, [activeTab]);
  useEffect(() => { fetchDropdowns(); }, []);

  function openNewConsultation() {
    setError(''); setModal('patient-type');
  }

  function startNewPatient() {
    setPatientForm({ first_name: '', last_name: '', date_of_birth: '', gender: 'male', contact_number: '' });
    setError(''); setModal('new-patient');
  }

  function startSearchPatient() {
    setPatientSearch(''); setSelectedPatient(null); setError(''); setModal('search-patient');
  }

  async function createNewPatient() {
    if (!patientForm.first_name.trim() || !patientForm.last_name.trim()) { setError('Please enter first and last name.'); return; }
    try {
      const { data } = await api.post('/patients', patientForm);
      setSelectedPatient(data.data);
      setConsultationForm({ doctor_id: '', notes: '' });
      setError(''); setModal('assign-doctor');
      fetchDropdowns();
    } catch (err) { setError(err.response?.data?.message || 'Failed to create patient.'); }
  }

  function selectSearchedPatient(patient) {
    setSelectedPatient(patient);
    setConsultationForm({ doctor_id: '', notes: '' });
    setError(''); setModal('assign-doctor');
  }

  async function handleSubmitConsultation(e) {
    e.preventDefault(); setError(''); setIsSubmitting(true);
    try {
      await api.post('/consultations', {
        patient_id: selectedPatient.id,
        doctor_id: consultationForm.doctor_id,
        notes: consultationForm.notes
      });
      setSuccess('Patient queued for consultation!');
      setModal(null); setSelectedPatient(null); fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.message || 'Failed to queue patient.'); }
    finally { setIsSubmitting(false); }
  }

  function openAssignRoom(consultation) {
    setSelectedConsultation(consultation);
    setAdmissionForm({ room_id: '', attending_doctor_id: consultation.doctor_id, notes: consultation.notes || '' });
    setError(''); setModal('assign-room');
  }

  async function handleSubmitAdmission(e) {
    e.preventDefault(); setError(''); setIsSubmitting(true);
    try {
      await api.post('/admissions', {
        patient_id: selectedConsultation.patient_id,
        room_id: admissionForm.room_id,
        attending_doctor_id: admissionForm.attending_doctor_id,
        notes: admissionForm.notes,
        consultation_id: selectedConsultation.id
      });
      setSuccess('Patient admitted successfully!');
      setModal(null); setSelectedConsultation(null); fetchData(); fetchDropdowns();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.message || 'Admission failed.'); }
    finally { setIsSubmitting(false); }
  }


  async function handleDischarge(id) {
    if (!window.confirm('Discharge this patient?')) return;
    try {
      await api.post(`/admissions/${id}/discharge`);
      setSuccess('Patient discharged successfully!');
      fetchData(); fetchDropdowns();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.message || 'Discharge failed.'); }
  }

  async function openDischargeProcess(adm) {
    try {
      const { data } = await api.get('/prescriptions', { params: { admission_id: adm.id, type: 'discharge' } });
      const dischargePrescription = data.data && data.data.length > 0 ? data.data[0] : null;
      setDischargeData({ admission: adm, prescription: dischargePrescription });
      setModal('discharge-process');
    } catch (err) { setError('Failed to fetch discharge details.'); }
  }

  async function confirmAndPrintDischarge() {
    setIsSubmitting(true);
    try {
      const qrRes = await api.get(`/qr-codes/patient/${dischargeData.admission.patient_id}`);
      const qr = qrRes.data.data.find(q => q.admission_id === dischargeData.admission.id && q.type === 'discharge');

      const printWindow = window.open('', '', 'width=800,height=800');
      printWindow.document.write(`
        <html>
          <head>
            <title>Discharge Summary & QR</title>
            <style>${PRESCRIPTION_CSS}</style>
          </head>
          <body>
            <div class="rx-doc-wrapper">
              <div class="rx-doc-page" id="prescription-print-area">
                <header class="rx-doc-header">
                  <div class="rx-doc-hospital-name">PMed-Aid General Hospital</div>
                  <div class="rx-doc-hospital-meta">
                    Metro City &nbsp;•&nbsp; www.pmed-aid.com
                  </div>
                </header>

                <section class="rx-doc-patient-info">
                  <div>
                    <span class="rx-doc-label">Patient</span>
                    <span class="rx-doc-value">${dischargeData.admission.patient?.first_name} ${dischargeData.admission.patient?.last_name}</span>
                  </div>
                  <div>
                    <span class="rx-doc-label">MRN</span>
                    <span class="rx-doc-value">MRN-${dischargeData.admission.patient_id.toString().padStart(5, '0')}</span>
                  </div>
                  <div>
                    <span class="rx-doc-label">Room</span>
                    <span class="rx-doc-value">${dischargeData.admission.room?.room_number || 'N/A'}</span>
                  </div>
                  <div>
                    <span class="rx-doc-label">Discharge Date</span>
                    <span class="rx-doc-value">
                      ${new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                    </span>
                  </div>
                </section>

                <section class="rx-doc-rx-section">
                  <h2 class="rx-doc-section-title">Take-Home Medications</h2>
                  ${dischargeData.prescription && dischargeData.prescription.items && dischargeData.prescription.items.length > 0 ? `
                    <table class="rx-doc-table">
                      <thead>
                        <tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Instructions</th></tr>
                      </thead>
                      <tbody>
                        ${dischargeData.prescription.items.map(item => `
                          <tr>
                            <td class="rx-doc-med-name">${item.medication_name}</td>
                            <td>${item.dosage} ${item.dosage_unit}</td>
                            <td>${item.frequency}x ${item.frequency_unit}</td>
                            <td>${item.instructions || '-'}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  ` : '<p style="text-align: center; color: #5a6478; margin-bottom: 30px;">No take-home medications prescribed.</p>'}
                </section>

                <section class="rx-doc-qr-section">
                  ${qr ? `<img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${qr.code}" class="rx-doc-qr-img" />` : '<p>No QR Code generated</p>'}
                  <p class="rx-doc-qr-caption">
                    Scan this code to set up medication reminders and track your intake in the patient app. Linking is permanent to this account for your security.
                  </p>
                  <p style="font-family: monospace; font-size: 10px; margin-top: 5px;">${qr ? qr.code : ''}</p>
                </section>

                <footer class="rx-doc-footer">
                  <div class="rx-doc-signature-line">
                    <span>Authorized Signature</span>
                    <span class="rx-doc-signature-label">Hospital Administrator</span>
                  </div>
                </footer>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close(); printWindow.focus();
      setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);

      await api.post(`/admissions/${dischargeData.admission.id}/discharge`);
      setSuccess('Discharge finalized and printed!');
      setModal(null); fetchData();
    } catch (err) { setError('Failed to process discharge.'); }
    finally { setIsSubmitting(false); }
  }

  const filteredPatients = patients.filter(p => {
    if (!patientSearch) return true;
    const name = `${p.first_name} ${p.last_name}`.toLowerCase();
    return name.includes(patientSearch.toLowerCase());
  });

  const displayList = activeTab === 'admitted' || activeTab === 'discharged' ? admissions : consultations;

  const filtered = displayList.filter(item => {
    if (!search) return true;
    const name = `${item.patient?.first_name} ${item.patient?.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <>
      {success && <div style={{ padding: '12px 16px', background: '#dcfce7', color: '#166534', borderRadius: 8, marginBottom: 16, fontWeight: 600 }}>{success}</div>}
      {error && <div style={{ padding: '12px 16px', background: '#fee2e2', color: '#991b1b', borderRadius: 8, marginBottom: 16, fontWeight: 600 }}>{error}</div>}

      <div className="id-card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input placeholder="Search patient..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '10px 12px 10px 36px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', width: 200 }} />
              </div>
              <button className="action-btn primary" onClick={openNewConsultation}>
                <Plus size={16} /> Queue Patient
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px', gap: '4px', alignSelf: 'flex-start' }}>
            {[
              { id: 'arrivals', label: 'Consultation Queue' },
              { id: 'pending_admissions', label: 'Pending Admissions' },
              { id: 'outpatient', label: 'Outpatient Checkouts' },
              { id: 'admitted', label: 'Admitted' },
              { id: 'discharged', label: 'Discharged' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '6px 16px', border: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                  background: activeTab === tab.id ? '#fff' : 'transparent',
                  color: activeTab === tab.id ? '#0f172a' : '#64748b',
                  boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="id-table-container">
          <table className="id-table">
            <thead>
              <tr>
                <th>Patient</th>
                {['arrivals', 'pending_admissions', 'outpatient'].includes(activeTab) && <th>Doctor</th>}
                {['admitted', 'discharged'].includes(activeTab) && <th>Room</th>}
                {['admitted', 'discharged'].includes(activeTab) && <th>Attending Doctor</th>}
                <th>Status / Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: 32 }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No records found</td></tr>
              ) : filtered.map(item => (
                <tr key={item.id}>
                  <td><strong>{item.patient?.first_name} {item.patient?.last_name}</strong></td>

                  {['arrivals', 'pending_admissions', 'outpatient'].includes(activeTab) && (
                    <td>{item.doctor?.first_name} {item.doctor?.last_name}</td>
                  )}

                  {['admitted', 'discharged'].includes(activeTab) && (
                    <>
                      <td>{item.room?.room_number} ({item.room?.room_type?.replace('_', ' ')})</td>
                      <td>{item.doctor?.first_name || item.doctor?.last_name ? `${item.doctor?.first_name} ${item.doctor?.last_name}` : 'Unknown'}</td>
                    </>
                  )}

                  <td>
                    {activeTab === 'arrivals' && <span className={`badge ${item.status === 'waiting' ? 'warning' : 'info'}`}>{item.status.replace('_', ' ')}</span>}
                    {activeTab === 'pending_admissions' && <span className="badge error">Requires Admission</span>}
                    {activeTab === 'outpatient' && <span className="badge success">Completed</span>}
                    {['admitted', 'discharged'].includes(activeTab) && (
                      <span className={`badge ${item.status === 'admitted' && item.discharge_requested ? 'warning' : item.status}`}>
                        {item.status === 'admitted' && item.discharge_requested ? 'Awaiting Discharge' : item.status}
                      </span>
                    )}
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
                      {new Date(item.created_at || item.admission_date).toLocaleDateString()}
                    </div>
                  </td>

                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {activeTab === 'pending_admissions' && (
                        <button className="action-btn" onClick={() => openAssignRoom(item)} style={{ background: '#3b82f6', color: '#fff', fontSize: '0.8rem', padding: '4px 8px' }}>
                          Admit Patient
                        </button>
                      )}

                      {activeTab === 'admitted' && (
                        <>
                          {!item.discharge_requested && (
                            <button className="action-btn outline" onClick={() => handleDischarge(item.id)} title="Discharge" style={{ color: '#ef4444', borderColor: '#fecaca' }}>
                              <DischargeIcon size={14} />
                            </button>
                          )}
                          {item.discharge_requested && (
                            <button className="action-btn" onClick={() => openDischargeProcess(item)} style={{ background: '#f59e0b', color: '#fff', fontSize: '0.8rem', padding: '4px 8px' }}>
                              Process Discharge
                            </button>
                          )}
                        </>
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
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>New Consultation</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>Select how you'd like to queue the patient.</p>
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
                >
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                    <UserCheck size={22} />
                  </div>
                  New Patient
                </button>
                <button
                  onClick={startSearchPatient}
                  style={{
                    padding: '28px 20px', borderRadius: 12, border: '2px solid #e2e8f0', background: '#fff',
                    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                    transition: 'all 0.2s', fontSize: '0.92rem', fontWeight: 600, color: '#334155'
                  }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                    <Search size={22} />
                  </div>
                  Existing Patient
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
                <div><label style={lbl}>First Name <span style={{ color: '#ef4444' }}>*</span></label><input style={inp} value={patientForm.first_name} onChange={e => setPatientForm({ ...patientForm, first_name: e.target.value })} placeholder="e.g. Juan" /></div>
                <div><label style={lbl}>Last Name <span style={{ color: '#ef4444' }}>*</span></label><input style={inp} value={patientForm.last_name} onChange={e => setPatientForm({ ...patientForm, last_name: e.target.value })} placeholder="e.g. Dela Cruz" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div><label style={lbl}>Date of Birth</label><input type="date" style={inp} value={patientForm.date_of_birth} onChange={e => setPatientForm({ ...patientForm, date_of_birth: e.target.value })} /></div>
                <div><label style={lbl}>Gender</label><select style={inp} value={patientForm.gender} onChange={e => setPatientForm({ ...patientForm, gender: e.target.value })}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
              </div>
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 20 }}>
                <div style={sectionLabel}>Contact Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div><label style={lbl}>Civil Status</label><select style={inp} value={patientForm.civil_status} onChange={e => setPatientForm({ ...patientForm, civil_status: e.target.value })}><option value="single">Single</option><option value="married">Married</option><option value="divorced">Divorced</option><option value="widowed">Widowed</option></select></div>
                  <div><label style={lbl}>Contact Number</label><input style={inp} value={patientForm.contact_number} onChange={e => setPatientForm({ ...patientForm, contact_number: e.target.value })} placeholder="e.g. 09XX-XXX-XXXX" /></div>
                </div>
                <div><label style={lbl}>Address</label><input style={inp} value={patientForm.address} onChange={e => setPatientForm({ ...patientForm, address: e.target.value })} placeholder="e.g. 123 Main St, City" /></div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 32px 24px', borderTop: '1px solid #e2e8f0' }}>
              <button type="button" className="action-btn outline" onClick={() => setModal(null)}>Cancel</button>
              <button type="button" className="action-btn primary" onClick={createNewPatient}>Continue to Doctor Assignment</button>
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
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>Search for an existing patient to proceed with consultation.</p>
            </div>
            <div style={{ padding: '24px 32px 28px' }}>
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input placeholder="Search patient by name..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} style={{ ...inp, paddingLeft: 40, padding: '12px 14px 12px 40px' }} autoFocus />
              </div>
              <div style={{ maxHeight: 340, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                {filteredPatients.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>No patients found</p>
                  </div>
                ) : (
                  filteredPatients.map(p => (
                    <div key={p.id} onClick={() => selectSearchedPatient(p)} style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>{p.first_name} {p.last_name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>{p.contact_number || 'No contact'} &bull; Patient ID: {p.id}</div>
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

      {/* ASSIGN DOCTOR MODAL */}
      {modal === 'assign-doctor' && selectedPatient && (
        <div style={overlay} onClick={() => setModal(null)}>
          <div style={{ ...modalBox, maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '28px 32px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>Queue Consultation</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>Assign a doctor for this patient.</p>
            </div>
            <div style={{ margin: '24px 32px 0', padding: '16px 20px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>{selectedPatient.first_name} {selectedPatient.last_name}</div>
                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Patient ID: {selectedPatient.id}</div>
              </div>
            </div>
            <form onSubmit={handleSubmitConsultation}>
              <div style={{ padding: '24px 32px' }}>
                {error && <div style={{ padding: '12px 16px', background: '#fee2e2', color: '#991b1b', borderRadius: 8, fontSize: '0.88rem', marginBottom: 20, fontWeight: 500 }}>{error}</div>}
                <div style={{ marginBottom: 20 }}>
                  <label style={lbl}>Doctor <span style={{ color: '#ef4444' }}>*</span></label>
                  <select style={inp} value={consultationForm.doctor_id} onChange={e => setConsultationForm({ ...consultationForm, doctor_id: e.target.value })} required>
                    <option value="">Select a doctor</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Notes</label>
                  <textarea style={{ ...inp, minHeight: 90, resize: 'vertical' }} value={consultationForm.notes} onChange={e => setConsultationForm({ ...consultationForm, notes: e.target.value })} placeholder="Patient complaints, triage notes..." />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 32px 24px', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" className="action-btn outline" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="action-btn primary" disabled={isSubmitting}>{isSubmitting ? 'Queueing...' : 'Queue Patient'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN ROOM (PENDING ADMISSION) MODAL */}
      {modal === 'assign-room' && selectedConsultation && (
        <div style={overlay} onClick={() => setModal(null)}>
          <div style={{ ...modalBox, maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '28px 32px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>Admit Patient</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>Doctor requested admission. Assign a room to finalize.</p>
            </div>
            <div style={{ margin: '24px 32px 0', padding: '16px 20px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>{selectedConsultation.patient?.first_name} {selectedConsultation.patient?.last_name}</div>
                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Consultation ID: {selectedConsultation.id}</div>
              </div>
            </div>
            <form onSubmit={handleSubmitAdmission}>
              <div style={{ padding: '24px 32px' }}>
                {error && <div style={{ padding: '12px 16px', background: '#fee2e2', color: '#991b1b', borderRadius: 8, fontSize: '0.88rem', marginBottom: 20, fontWeight: 500 }}>{error}</div>}
                <div style={{ marginBottom: 20 }}>
                  <label style={lbl}>Room <span style={{ color: '#ef4444' }}>*</span></label>
                  <select style={inp} value={admissionForm.room_id} onChange={e => setAdmissionForm({ ...admissionForm, room_id: e.target.value })} required>
                    <option value="">Select an available room</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.room_number} ({r.room_type?.replace('_', ' ')})</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={lbl}>Attending Doctor <span style={{ color: '#ef4444' }}>*</span></label>
                  <select style={inp} value={admissionForm.attending_doctor_id} onChange={e => setAdmissionForm({ ...admissionForm, attending_doctor_id: e.target.value })} required>
                    <option value="">Select attending physician</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Admission Notes</label>
                  <textarea style={{ ...inp, minHeight: 90, resize: 'vertical' }} value={admissionForm.notes} onChange={e => setAdmissionForm({ ...admissionForm, notes: e.target.value })} placeholder="Reason for admission..." />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 32px 24px', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" className="action-btn outline" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="action-btn primary" disabled={isSubmitting}>{isSubmitting ? 'Admitting...' : 'Admit Patient'}</button>
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
const overlay = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalBox = { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' };
