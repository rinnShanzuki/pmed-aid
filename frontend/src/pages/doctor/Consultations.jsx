import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Stethoscope, Search, Plus, Save, CheckCircle, LogOut, AlertCircle, Pill, ArrowLeft, Trash2, User, Clock, FileText, BedDouble } from 'lucide-react';

export default function Consultations() {
  const [activeTab, setActiveTab] = useState('consultations'); // 'consultations' or 'admitted'
  const [admissions, setAdmissions] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [modal, setModal] = useState(null); // 'consultation' or 'admission_session'
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  const [notes, setNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [hpi, setHpi] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [findings, setFindings] = useState('');
  const [vitals, setVitals] = useState({ bp: '', hr: '', temp: '' });
  const [assessment, setAssessment] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [progressNotes, setProgressNotes] = useState('');
  const [sessionStatus, setSessionStatus] = useState('not_started');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Prescription form states
  const [prescriptionItems, setPrescriptionItems] = useState([]);
  const [newMedication, setNewMedication] = useState({ medication_name: '', dosage: '', dosage_unit: 'mg', frequency: 1, frequency_unit: 'daily', duration: 1, duration_unit: 'days', route: 'oral', instructions: '', start_time: '', interval_hours: '' });
  const [medications, setMedications] = useState([]);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);

  useEffect(() => {
    fetchData();
    fetchMedications();
  }, [activeTab]);

  async function fetchMedications() {
    try {
      const { data } = await api.get('/medications');
      setMedications(data.data || []);
    } catch (err) { console.error(err); }
  }

  async function fetchData() {
    setLoading(true);
    try {
      if (activeTab === 'consultations') {
        const { data } = await api.get('/consultations', { params: { status: 'waiting,in_session' } });
        setConsultations(data.data || []);
      } else {
        const { data } = await api.get('/admissions', { params: { status: 'admitted' } });
        setAdmissions(data.data || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load records.');
    } finally {
      setLoading(false);
    }
  }

  async function openConsultationSession(consultation) {
    setSelectedRecord(consultation);
    setNotes(consultation.doctor_notes || '');
    setDiagnosis(consultation.diagnosis || '');
    setChiefComplaint(consultation.chief_complaint || '');
    setHpi(consultation.hpi || '');
    setSymptoms(consultation.symptoms || '');
    setFindings(consultation.findings || '');
    setVitals(consultation.vital_signs || { bp: '', hr: '', temp: '' });
    setAssessment(consultation.assessment || '');
    setFollowUpDate(consultation.follow_up_date ? consultation.follow_up_date.split('T')[0] : '');
    setPrescriptionItems([]);
    setNewMedication({ medication_name: '', dosage: '', dosage_unit: 'mg', frequency: 1, frequency_unit: 'daily', duration: 1, duration_unit: 'days', route: 'oral', instructions: '', start_time: '', interval_hours: '' });
    setError(''); setSuccess(''); setShowPrescriptionForm(false);
    setModal('consultation');
    
    if (consultation.status === 'waiting' || consultation.status === 'not_started' || !consultation.status) {
      setSessionStatus('in_session');
      try {
        await api.put(`/consultations/${consultation.id}`, { status: 'in_session' });
        fetchData();
      } catch (err) {
        console.error("Failed to start session", err);
      }
    } else {
      setSessionStatus(consultation.status);
    }
  }

  async function openAdmissionSession(admission) {
    setSelectedRecord(admission);
    setNotes(admission.consultation_notes || '');
    setDiagnosis(admission.diagnosis || '');
    setTreatmentPlan(admission.treatment_plan || '');
    setProgressNotes(admission.progress_notes || '');
    setFollowUpDate(admission.follow_up_date ? admission.follow_up_date.split('T')[0] : '');
    setPrescriptionItems([]);
    setNewMedication({ medication_name: '', dosage: '', dosage_unit: 'mg', frequency: 1, frequency_unit: 'daily', duration: 1, duration_unit: 'days', route: 'oral', instructions: '', start_time: '', interval_hours: '' });
    setError(''); setSuccess(''); setShowPrescriptionForm(false);
    setModal('admission_session');
    
    if (admission.consultation_status === 'waiting' || admission.consultation_status === 'not_started' || !admission.consultation_status) {
      setSessionStatus('in_session');
      try {
        await api.put(`/admissions/${admission.id}`, { consultation_status: 'in_session' });
        fetchData();
      } catch (err) {
        console.error("Failed to start session", err);
      }
    } else {
      setSessionStatus(admission.consultation_status);
    }
  }

  function handleMedicationChange(field, value) {
    let updates = { [field]: value };
    if (field === 'frequency' || field === 'frequency_unit') {
      const freq = field === 'frequency' ? value : newMedication.frequency;
      const unit = field === 'frequency_unit' ? value : newMedication.frequency_unit;
      if (unit === 'hourly') updates.interval_hours = '';
      else if (unit === 'daily' && freq > 0) updates.interval_hours = (24 / freq).toString();
      else updates.interval_hours = '';
    }
    setNewMedication({ ...newMedication, ...updates });
  }

  async function startSession() {
    setError('');
    try {
      if (modal === 'consultation') {
        await api.put(`/consultations/${selectedRecord.id}`, { status: 'in_session' });
      } else {
        await api.put(`/admissions/${selectedRecord.id}`, { consultation_status: 'in_session' });
      }
      setSessionStatus('in_session');
      setSuccess('Session started.');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start session.');
    }
  }

  function addPrescriptionItem() {
    if (!newMedication.medication_name.trim() || !newMedication.dosage.trim()) {
      setError('Please fill in medication name and dosage.');
      return;
    }
    setPrescriptionItems([...prescriptionItems, { ...newMedication, id: Date.now() }]);
    setNewMedication({ medication_name: '', dosage: '', dosage_unit: 'mg', frequency: 1, frequency_unit: 'daily', duration: 1, duration_unit: 'days', route: 'oral', instructions: '', start_time: '', interval_hours: '' });
    setError('');
  }

  function removePrescriptionItem(id) {
    setPrescriptionItems(prescriptionItems.filter(item => item.id !== id));
  }

  // --- CONSULTATION FLOW ACTIONS ---
  async function completeOutpatientConsultation() {
    if (!diagnosis.trim() || !notes.trim()) { setError('Please enter diagnosis and notes.'); return; }
    setError('');
    try {
      if (prescriptionItems.length > 0) {
        await api.post('/prescriptions', {
          consultation_id: selectedRecord.id,
          patient_id: selectedRecord.patient_id,
          type: 'outpatient',
          notes,
          items: prescriptionItems.map(({ id, ...item }) => item)
        });
      }
      await api.post(`/consultations/${selectedRecord.id}/complete-outpatient`, { 
        diagnosis, doctor_notes: notes, chief_complaint: chiefComplaint, hpi, symptoms, findings, vital_signs: vitals, assessment, follow_up_date: followUpDate 
      });
      setSuccess('Outpatient session completed successfully.');
      setModal(null); setTimeout(() => { setSuccess(''); fetchData(); }, 2000);
    } catch (err) { setError(err.response?.data?.message || 'Failed to complete outpatient session.'); }
  }

  async function requestAdmissionConsultation() {
    if (!diagnosis.trim() || !notes.trim()) { setError('Please enter diagnosis and notes.'); return; }
    setError('');
    try {
      if (prescriptionItems.length > 0) {
        await api.post('/prescriptions', {
          consultation_id: selectedRecord.id,
          patient_id: selectedRecord.patient_id,
          type: 'in_hospital',
          notes,
          items: prescriptionItems.map(({ id, ...item }) => item)
        });
      }
      await api.post(`/consultations/${selectedRecord.id}/request-admission`, { 
        diagnosis, doctor_notes: notes, chief_complaint: chiefComplaint, hpi, symptoms, findings, vital_signs: vitals, assessment, follow_up_date: followUpDate 
      });
      setSuccess('Admission requested successfully.');
      setModal(null); setTimeout(() => { setSuccess(''); fetchData(); }, 2000);
    } catch (err) { setError(err.response?.data?.message || 'Failed to request admission.'); }
  }

  // --- ADMISSION FLOW ACTIONS ---
  async function submitAdmissionPrescription(isDischarge = false) {
    if (prescriptionItems.length === 0 && !isDischarge) { setError('Please add at least one medication.'); return; }
    if (!diagnosis.trim() || !notes.trim()) { setError('Please enter diagnosis and clinical notes.'); return; }

    setError('');
    try {
      if (isDischarge) {
        await api.put(`/admissions/${selectedRecord.id}`, { diagnosis, consultation_notes: notes, treatment_plan: treatmentPlan, progress_notes: progressNotes, follow_up_date: followUpDate });
        await api.post(`/admissions/${selectedRecord.id}/request-discharge`, { notes, diagnosis });
      } else {
        await api.put(`/admissions/${selectedRecord.id}`, { diagnosis, consultation_notes: notes, consultation_status: 'completed', treatment_plan: treatmentPlan, progress_notes: progressNotes, follow_up_date: followUpDate });
      }

      if (prescriptionItems.length > 0) {
        await api.post('/prescriptions', {
          admission_id: selectedRecord.id,
          patient_id: selectedRecord.patient_id,
          type: isDischarge ? 'discharge' : 'in_hospital',
          notes,
          items: prescriptionItems.map(({ id, ...item }) => item)
        });
      }

      setSuccess(isDischarge ? 'Discharge requested!' : 'Prescription saved and session completed!');
      setModal(null); setTimeout(() => { setSuccess(''); fetchData(); }, 2000);
    } catch (err) { setError(err.response?.data?.message || 'Failed to complete session.'); }
  }

  async function saveAndEndAdmissionSession() {
    if (!diagnosis.trim() || !notes.trim()) { setError('Please enter diagnosis and notes.'); return; }
    setError('');
    try {
      await api.put(`/admissions/${selectedRecord.id}`, { diagnosis, consultation_notes: notes, consultation_status: 'completed', treatment_plan: treatmentPlan, progress_notes: progressNotes, follow_up_date: followUpDate });
      setSuccess('Session completed and saved.');
      setModal(null); setTimeout(() => { setSuccess(''); fetchData(); }, 2000);
    } catch (err) { setError(err.response?.data?.message || 'Failed to save session.'); }
  }

  const listToFilter = activeTab === 'consultations' ? consultations : admissions;
  const filtered = listToFilter.filter(item => {
    if (!search) return true;
    const name = `${item.patient?.first_name} ${item.patient?.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  function renderPrescriptionForm(onSubmitOutpatient, onSubmitAdmit, onSubmitDischarge, onSubmitSaveOnly) {
    return (
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 16px 0', borderBottom: '2px solid #f1f5f9', paddingBottom: 8 }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}><Pill size={18} /> Electronic Prescription</h3>
          <button onClick={() => setShowPrescriptionForm(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
            Close Form
          </button>
        </div>

        <div style={{ background: '#f8fafc', padding: 24, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div style={{ gridColumn: 'span 2' }}><label style={lbl}>Medication *</label>
              <input style={inp} value={newMedication.medication_name} onChange={e => setNewMedication({ ...newMedication, medication_name: e.target.value })} list="med-list-doc" placeholder="e.g. Paracetamol" />
              <datalist id="med-list-doc">{medications.map(m => <option key={m.id} value={m.name} />)}</datalist>
            </div>
            <div><label style={lbl}>Dosage *</label><input style={inp} value={newMedication.dosage} onChange={e => setNewMedication({ ...newMedication, dosage: e.target.value })} placeholder="e.g. 500" /></div>
            <div><label style={lbl}>Unit</label>
              <select style={inp} value={newMedication.dosage_unit} onChange={e => setNewMedication({ ...newMedication, dosage_unit: e.target.value })}>
                <option>mg</option><option>ml</option><option>g</option><option>mcg</option><option>IU</option>
              </select>
            </div>
            
            <div><label style={lbl}>Frequency</label><input type="number" min="1" style={inp} value={newMedication.frequency} onChange={e => handleMedicationChange('frequency', e.target.value)} /></div>
            <div><label style={lbl}>Freq Unit</label>
              <select style={inp} value={newMedication.frequency_unit} onChange={e => handleMedicationChange('frequency_unit', e.target.value)}>
                <option value="hourly">Hourly</option><option value="daily">Daily</option><option value="weekly">Weekly</option>
              </select>
            </div>
            <div><label style={lbl}>Duration</label><input type="number" min="1" style={inp} value={newMedication.duration} onChange={e => handleMedicationChange('duration', e.target.value)} /></div>
            <div><label style={lbl}>Dur Unit</label>
              <select style={inp} value={newMedication.duration_unit} onChange={e => handleMedicationChange('duration_unit', e.target.value)}>
                <option value="days">Days</option><option value="weeks">Weeks</option><option value="months">Months</option>
              </select>
            </div>

            <div><label style={lbl}>Route</label>
              <select style={inp} value={newMedication.route} onChange={e => handleMedicationChange('route', e.target.value)}>
                <option>oral</option><option>IV</option><option>IM</option><option>SC</option><option>topical</option><option>inhalation</option>
              </select>
            </div>
            <div><label style={lbl}>Start Time</label><input type="time" style={inp} value={newMedication.start_time || ''} onChange={e => handleMedicationChange('start_time', e.target.value)} /></div>
            <div><label style={lbl}>Interval (hrs)</label><input type="number" step="0.5" style={inp} value={newMedication.interval_hours || ''} onChange={e => handleMedicationChange('interval_hours', e.target.value)} placeholder="e.g. 8" /></div>
            <div style={{ gridColumn: 'span 1' }}><label style={lbl}>Instructions</label><input style={inp} value={newMedication.instructions} onChange={e => handleMedicationChange('instructions', e.target.value)} placeholder="Take after meals" /></div>
          </div>

          <button onClick={addPrescriptionItem} style={{ ...actionBtn, background: '#10b981', color: '#fff' }}>
            <Plus size={16} /> Add to Prescription List
          </button>

          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #cbd5e1' }}>
            {prescriptionItems.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#334155' }}>Prescribed Medications ({prescriptionItems.length})</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {prescriptionItems.map(item => (
                    <div key={item.id} style={{ padding: '12px 16px', background: '#fff', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>{item.medication_name}</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                          {item.dosage}{item.dosage_unit} • {item.frequency}x {item.frequency_unit} for {item.duration} {item.duration_unit} • Route: {item.route}
                        </div>
                        {item.instructions && <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 4 }}><i>"{item.instructions}"</i></div>}
                      </div>
                      <button onClick={() => removePrescriptionItem(item.id)} style={{ background: '#fee2e2', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: 16 }}>
              {modal === 'consultation' ? (
                <>
                  <button onClick={onSubmitOutpatient} style={{ ...actionBtn, background: '#10b981', color: '#fff', flex: 1, padding: '12px' }}>
                    <CheckCircle size={16} /> Complete Outpatient
                  </button>
                  <button onClick={onSubmitAdmit} style={{ ...actionBtn, background: '#3b82f6', color: '#fff', flex: 1, padding: '12px' }}>
                    <BedDouble size={16} /> Request Admission
                  </button>
                </>
              ) : (
                <>
                  <button onClick={onSubmitSaveOnly} style={{ ...actionBtn, background: '#3b82f6', color: '#fff', flex: 1, padding: '12px' }}>
                    <CheckCircle size={16} /> {prescriptionItems.length > 0 ? 'Save Prescription & End Session' : 'Save and End Session'}
                  </button>
                  <button onClick={onSubmitDischarge} style={{ ...actionBtn, background: '#f59e0b', color: '#fff', flex: 1, padding: '12px' }}>
                    <LogOut size={16} /> Request Discharge
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderModalBody() {
    return (
      <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 60 }}>
        <button 
          onClick={() => setModal(null)} 
          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', fontWeight: 600, marginBottom: 24, padding: 0 }}
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        {success && <div style={{ padding: '12px 16px', background: '#dcfce7', color: '#166534', borderRadius: 8, marginBottom: 24, fontWeight: 600 }}>{success}</div>}
        {error && <div style={{ padding: '12px 16px', background: '#fee2e2', color: '#991b1b', borderRadius: 8, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}><AlertCircle size={18} /> {error}</div>}

        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ background: '#f8fafc', padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                <User size={24} color="#3b82f6" /> 
                {selectedRecord.patient?.first_name} {selectedRecord.patient?.last_name}
              </h2>
              <div style={{ display: 'flex', gap: 24, color: '#64748b', fontSize: '0.9rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={14} /> Created: {new Date(selectedRecord.created_at || selectedRecord.admission_date).toLocaleDateString()}</span>
                {modal === 'admission_session' && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>Room: {selectedRecord.room?.room_number || 'Unknown'}</span>}
              </div>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <div style={{ 
                display: 'inline-block', padding: '6px 16px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600,
                background: sessionStatus === 'in_session' ? '#dbeafe' : sessionStatus === 'completed' ? '#dcfce7' : '#f1f5f9',
                color: sessionStatus === 'in_session' ? '#0369a1' : sessionStatus === 'completed' ? '#166534' : '#475569'
              }}>
                Status: {sessionStatus.replace('_', ' ').toUpperCase()}
              </div>
              
              {sessionStatus === 'not_started' && (
                <button onClick={startSession} style={{ ...actionBtn, background: '#3b82f6', color: '#fff', marginTop: 12, width: '100%' }}>
                  Start Session
                </button>
              )}
              {sessionStatus === 'completed' && (
                <button onClick={startSession} style={{ ...actionBtn, background: '#f59e0b', color: '#fff', marginTop: 12, width: '100%' }}>
                  Reopen Session
                </button>
              )}
            </div>
          </div>

          <div style={{ padding: '32px' }}>
            {sessionStatus !== 'not_started' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                
                <div>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '2px solid #f1f5f9', paddingBottom: 8 }}>
                    <FileText size={18} /> Clinical Evaluation
                  </h3>

                  {(modal === 'consultation' && selectedRecord.notes) && (
                    <div style={{ marginBottom: 20, padding: 16, background: '#f8fafc', borderRadius: 8, borderLeft: '4px solid #64748b' }}>
                      <label style={{ ...lbl, fontSize: '0.85rem', color: '#64748b' }}>Triage / Initial Notes</label>
                      <p style={{ margin: 0, fontSize: '0.95rem', color: '#334155', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{selectedRecord.notes}</p>
                    </div>
                  )}

                  {(modal === 'admission_session' && selectedRecord.notes) && (
                    <div style={{ marginBottom: 20, padding: 16, background: '#f8fafc', borderRadius: 8, borderLeft: '4px solid #3b82f6' }}>
                      <label style={{ ...lbl, fontSize: '0.85rem', color: '#64748b' }}>Reason of Admission</label>
                      <p style={{ margin: 0, fontSize: '0.95rem', color: '#334155', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{selectedRecord.notes}</p>
                    </div>
                  )}
                  
                  {modal === 'consultation' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                      <div><label style={{ ...lbl, fontSize: '0.9rem' }}>Chief Complaint</label><input style={{ ...inp }} value={chiefComplaint} onChange={e => setChiefComplaint(e.target.value)} disabled={sessionStatus === 'completed'} /></div>
                      <div><label style={{ ...lbl, fontSize: '0.9rem' }}>Symptoms</label><input style={{ ...inp }} value={symptoms} onChange={e => setSymptoms(e.target.value)} disabled={sessionStatus === 'completed'} /></div>
                    </div>
                  )}
                  
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ ...lbl, fontSize: '0.9rem' }}>Primary Diagnosis</label>
                    <input style={{ ...inp, padding: '12px 16px', fontSize: '1rem' }} value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="Enter official diagnosis..." disabled={sessionStatus === 'completed'} />
                  </div>
                  
                  {modal === 'consultation' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                      <div style={{ gridColumn: 'span 2' }}>
                         <label style={{ ...lbl, fontSize: '0.9rem' }}>Vital Signs</label>
                         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                           <input style={inp} placeholder="BP (e.g. 120/80)" value={vitals.bp} onChange={e => setVitals({...vitals, bp: e.target.value})} disabled={sessionStatus === 'completed'} />
                           <input style={inp} placeholder="HR (bpm)" type="number" value={vitals.hr} onChange={e => setVitals({...vitals, hr: e.target.value})} disabled={sessionStatus === 'completed'} />
                           <input style={inp} placeholder="Temp (°C)" type="number" step="0.1" value={vitals.temp} onChange={e => setVitals({...vitals, temp: e.target.value})} disabled={sessionStatus === 'completed'} />
                         </div>
                      </div>

                      <div style={{ gridColumn: 'span 2' }}><label style={{ ...lbl, fontSize: '0.9rem' }}>History of Present Illness (HPI)</label><textarea style={{ ...inp, minHeight: 80 }} value={hpi} onChange={e => setHpi(e.target.value)} disabled={sessionStatus === 'completed'} /></div>
                      
                      <div style={{ gridColumn: 'span 2' }}><label style={{ ...lbl, fontSize: '0.9rem' }}>Clinical Findings</label><textarea style={{ ...inp, minHeight: 80 }} value={findings} onChange={e => setFindings(e.target.value)} disabled={sessionStatus === 'completed'} /></div>
                      <div style={{ gridColumn: 'span 2' }}><label style={{ ...lbl, fontSize: '0.9rem' }}>Assessment</label><textarea style={{ ...inp, minHeight: 80 }} value={assessment} onChange={e => setAssessment(e.target.value)} disabled={sessionStatus === 'completed'} /></div>
                    </div>
                  )}

                  {modal === 'admission_session' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 20 }}>
                      <div><label style={{ ...lbl, fontSize: '0.9rem' }}>Treatment Plan</label><textarea style={{ ...inp, minHeight: 80 }} value={treatmentPlan} onChange={e => setTreatmentPlan(e.target.value)} disabled={sessionStatus === 'completed'} /></div>
                      <div><label style={{ ...lbl, fontSize: '0.9rem' }}>Daily Progress Notes</label><textarea style={{ ...inp, minHeight: 120 }} value={progressNotes} onChange={e => setProgressNotes(e.target.value)} disabled={sessionStatus === 'completed'} /></div>
                    </div>
                  )}

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ ...lbl, fontSize: '0.9rem' }}>Follow-up Date</label>
                    <input type="date" style={{ ...inp, padding: '12px 16px', fontSize: '1rem' }} value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} disabled={sessionStatus === 'completed'} />
                  </div>

                  <div>
                    <label style={{ ...lbl, fontSize: '0.9rem' }}>General Clinical Notes</label>
                    <textarea style={{ ...inp, padding: '16px', minHeight: 160, fontSize: '1rem', lineHeight: '1.5' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Detailed clinical notes..." disabled={sessionStatus === 'completed'} />
                  </div>
                </div>

                {sessionStatus === 'in_session' && !showPrescriptionForm && (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 24, marginTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h4 style={{ margin: 0, color: '#334155' }}>Next Steps</h4>
                    </div>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <button onClick={() => setShowPrescriptionForm(true)} style={{ ...actionBtn, background: '#10b981', color: '#fff', flex: 1, padding: '12px' }}>
                        <Pill size={16} /> Prescribe Medications
                      </button>
                      
                      {modal === 'consultation' ? (
                        <>
                          <button onClick={completeOutpatientConsultation} style={{ ...actionBtn, background: '#f59e0b', color: '#fff', flex: 1, padding: '12px' }}>
                            <CheckCircle size={16} /> Complete Outpatient
                          </button>
                          <button onClick={requestAdmissionConsultation} style={{ ...actionBtn, background: '#3b82f6', color: '#fff', flex: 1, padding: '12px' }}>
                            <BedDouble size={16} /> Request Admission
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => submitAdmissionPrescription(false)} style={{ ...actionBtn, background: '#3b82f6', color: '#fff', flex: 1, padding: '12px' }}>
                            <CheckCircle size={16} /> Save & End Session
                          </button>
                          <button onClick={() => submitAdmissionPrescription(true)} style={{ ...actionBtn, background: '#f59e0b', color: '#fff', flex: 1, padding: '12px' }}>
                            <LogOut size={16} /> Request Discharge
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {sessionStatus === 'in_session' && showPrescriptionForm && renderPrescriptionForm(
                  completeOutpatientConsultation, 
                  requestAdmissionConsultation, 
                  () => submitAdmissionPrescription(true), 
                  () => submitAdmissionPrescription(false)
                )}
                
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                <Stethoscope size={48} color="#cbd5e1" style={{ marginBottom: 16 }} />
                <p style={{ fontSize: '1.1rem', margin: 0 }}>Start the session to begin clinical evaluation.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (modal) return renderModalBody();

  return (
    <>
      <div className="id-card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b', display: 'flex', alignItems: 'center' }}>
              <Stethoscope size={20} style={{ marginRight: 8, color: '#1e293b' }} /> Doctor Dashboard
            </h3>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input placeholder="Search patient..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '10px 12px 10px 36px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', width: 220 }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px', gap: '4px', alignSelf: 'flex-start' }}>
            <button
              onClick={() => setActiveTab('consultations')}
              style={{
                padding: '6px 16px', border: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                background: activeTab === 'consultations' ? '#fff' : 'transparent',
                color: activeTab === 'consultations' ? '#0f172a' : '#64748b',
                boxShadow: activeTab === 'consultations' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Consultation Queue
            </button>
            <button
              onClick={() => setActiveTab('admitted')}
              style={{
                padding: '6px 16px', border: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                background: activeTab === 'admitted' ? '#fff' : 'transparent',
                color: activeTab === 'admitted' ? '#0f172a' : '#64748b',
                boxShadow: activeTab === 'admitted' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Admitted Patients
            </button>
          </div>
        </div>

        <div className="id-table-container">
          <table className="id-table">
            <thead>
              <tr>
                <th>Patient</th>
                {activeTab === 'admitted' && <th>Room</th>}
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: 32 }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No records found.</td></tr>
              ) : filtered.map(a => (
                <tr key={a.id}>
                  <td><strong>{a.patient?.first_name} {a.patient?.last_name}</strong></td>
                  {activeTab === 'admitted' && <td>{a.room?.room_number || '—'}</td>}
                  <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{new Date(a.created_at || a.admission_date).toLocaleDateString()}</td>
                  <td>
                    <span style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600,
                      background: (a.consultation_status || a.status) === 'in_session' ? '#dbeafe' : (a.consultation_status || a.status) === 'completed' ? '#dcfce7' : '#f3f4f6',
                      color: (a.consultation_status || a.status) === 'in_session' ? '#0369a1' : (a.consultation_status || a.status) === 'completed' ? '#166534' : '#6b7280'
                    }}>
                      {(a.consultation_status || a.status) === 'in_session' ? 'Active' : (a.consultation_status || a.status) === 'completed' ? 'Completed' : 'Not Started'}
                    </span>
                  </td>
                  <td>
                    <button className="action-btn primary" onClick={() => activeTab === 'consultations' ? openConsultationSession(a) : openAdmissionSession(a)} style={{ fontSize: '0.85rem' }}>
                      <Stethoscope size={14} /> Open Form
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

const lbl = { display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: 8 };
const inp = { width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.9rem', boxSizing: 'border-box', background: '#fff', transition: 'border-color 0.2s', outline: 'none' };
const actionBtn = { padding: '10px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', transition: 'background-color 0.2s' };
