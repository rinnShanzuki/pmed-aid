import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { 
  ArrowLeft, User, Stethoscope, Bed, Pill, 
  FileText, Syringe, QrCode, Clock, Activity 
} from 'lucide-react';
import '../../styles/patient-record.css'; // Will create this

export default function PatientRecord() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('timeline');

  // Data states
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [qrCodes, setQrCodes] = useState([]);

  useEffect(() => {
    async function fetchAllData() {
      try {
        setLoading(true);
        // Fetch all related data in parallel
        const [
          patRes, consRes, admRes, presRes, schedRes, qrRes
        ] = await Promise.all([
          api.get(`/patients/${id}`),
          api.get(`/consultations?patient_id=${id}`),
          api.get(`/admissions?patient_id=${id}`),
          api.get(`/prescriptions?patient_id=${id}`),
          api.get(`/schedules/patient/${id}`),
          api.get(`/qr-codes/patient/${id}`)
        ]);

        setPatient(patRes.data.data);
        setConsultations(consRes.data.data || []);
        setAdmissions(admRes.data.data || []);
        setPrescriptions(presRes.data.data || []);
        setSchedules(schedRes.data.data || []);
        setQrCodes(qrRes.data.data || []);
      } catch (err) {
        console.error("Failed to fetch patient record data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAllData();
  }, [id]);

  const tabs = [
    { id: 'info', label: 'Patient Information', icon: <User size={18} /> },
    { id: 'consultations', label: 'Consultation History', icon: <Stethoscope size={18} /> },
    { id: 'admissions', label: 'Confinement History', icon: <Bed size={18} /> },
    { id: 'prescriptions', label: 'Prescription History', icon: <FileText size={18} /> },
    { id: 'medications', label: 'Medication History', icon: <Pill size={18} /> },
    { id: 'administrations', label: 'Administration History', icon: <Syringe size={18} /> },
    { id: 'discharges', label: 'Discharge History', icon: <Activity size={18} /> },
    { id: 'qrcodes', label: 'QR Binding History', icon: <QrCode size={18} /> },
    { id: 'timeline', label: 'Record Timeline', icon: <Clock size={18} /> },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b' }}>Loading Comprehensive Patient Record...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div style={{ padding: 24 }}>
        <button className="action-btn outline" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>
        <div style={{ marginTop: 24, padding: 32, textAlign: 'center', background: 'white', borderRadius: 12 }}>
          <h3 style={{ color: '#0f172a' }}>Patient Not Found</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-record-container">
      {/* Header */}
      <div className="pr-header">
        <div className="pr-header-left">
          <button className="action-btn outline back-btn" onClick={() => navigate('/info-desk/registration')}>
            <ArrowLeft size={16} /> Back to List
          </button>
          <div>
            <h2 className="pr-patient-name">{patient.first_name} {patient.last_name}</h2>
            <div className="pr-patient-meta">
              <span>Patient ID: {patient.id}</span>
              <span className="dot">•</span>
              <span>{patient.age ? `${patient.age} yrs` : patient.date_of_birth}</span>
              <span className="dot">•</span>
              <span>{patient.gender}</span>
              <span className="dot">•</span>
              <span>{patient.blood_type || 'Unknown Blood Type'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pr-body">
        {/* Sidebar Nav */}
        <aside className="pr-sidebar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`pr-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </aside>

        {/* Main Content Area */}
        <main className="pr-content">
          <div className="pr-content-card">
            {activeTab === 'info' && <TabInformation patient={patient} />}
            {activeTab === 'consultations' && <TabConsultations consultations={consultations} />}
            {activeTab === 'admissions' && <TabAdmissions admissions={admissions} />}
            {activeTab === 'prescriptions' && <TabPrescriptions prescriptions={prescriptions} />}
            {activeTab === 'medications' && <TabMedications prescriptions={prescriptions} />}
            {activeTab === 'administrations' && <TabAdministrations schedules={schedules} />}
            {activeTab === 'discharges' && <TabDischarges admissions={admissions} />}
            {activeTab === 'qrcodes' && <TabQrCodes qrCodes={qrCodes} />}
            {activeTab === 'timeline' && (
              <TabTimeline 
                consultations={consultations} 
                admissions={admissions} 
                prescriptions={prescriptions} 
                schedules={schedules}
                qrCodes={qrCodes} 
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab Components
// ─────────────────────────────────────────────────────────────────────────────

function TabInformation({ patient }) {
  return (
    <div>
      <h3 className="pr-section-title">A. Patient Information</h3>
      <div className="pr-info-grid">
        <div className="info-group"><label>First Name</label><p>{patient.first_name}</p></div>
        <div className="info-group"><label>Last Name</label><p>{patient.last_name}</p></div>
        <div className="info-group"><label>Date of Birth</label><p>{patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : '—'}</p></div>
        <div className="info-group"><label>Gender</label><p style={{ textTransform: 'capitalize' }}>{patient.gender}</p></div>
        <div className="info-group"><label>Civil Status</label><p style={{ textTransform: 'capitalize' }}>{patient.civil_status || '—'}</p></div>
        <div className="info-group"><label>Blood Type</label><p>{patient.blood_type || '—'}</p></div>
        <div className="info-group"><label>Contact Number</label><p>{patient.contact_number}</p></div>
        <div className="info-group"><label>Email Address</label><p>{patient.user?.email || 'No online account'}</p></div>
        <div className="info-group" style={{ gridColumn: '1 / -1' }}><label>Address</label><p>{patient.address || '—'}</p></div>
        
        <div className="info-group"><label>Emergency Contact Name</label><p>{patient.emergency_contact_name || '—'}</p></div>
        <div className="info-group"><label>Emergency Contact Number</label><p>{patient.emergency_contact_number || '—'}</p></div>
        
        <div className="info-group" style={{ gridColumn: '1 / -1' }}><label>Allergies</label><p>{patient.allergies || 'None recorded'}</p></div>
      </div>
    </div>
  );
}

function TabConsultations({ consultations }) {
  if (consultations.length === 0) return <EmptyState title="No Consultation History" />;
  return (
    <div>
      <h3 className="pr-section-title">B. Consultation History</h3>
      <div className="pr-list-container">
        {consultations.map(c => (
          <div key={c.id} className="pr-history-card">
            <div className="pr-card-header">
              <h4>Consultation #{String(c.id).padStart(4, '0')}</h4>
              <span className="pr-date">{new Date(c.created_at).toLocaleString()}</span>
            </div>
            <div className="pr-card-body">
              <p><strong>Doctor:</strong> Dr. {c.doctor?.first_name} {c.doctor?.last_name}</p>
              <p><strong>Department:</strong> {c.department || '—'}</p>
              <p><strong>Chief Complaint:</strong> {c.chief_complaint || '—'}</p>
              <p><strong>Diagnosis:</strong> {c.assessment || '—'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabAdmissions({ admissions }) {
  if (admissions.length === 0) return <EmptyState title="No Confinement History" />;
  return (
    <div>
      <h3 className="pr-section-title">C. Confinement / Admission History</h3>
      <div className="pr-list-container">
        {admissions.map(a => (
          <div key={a.id} className="pr-history-card">
            <div className="pr-card-header">
              <h4>Confinement #{String(a.id).padStart(4, '0')}</h4>
              <span className={`badge ${a.status === 'discharged' ? 'completed' : 'active'}`}>{a.status.toUpperCase()}</span>
            </div>
            <div className="pr-card-body">
              <p><strong>Admitted:</strong> {new Date(a.admission_date).toLocaleString()}</p>
              <p><strong>Discharged:</strong> {a.discharge_date ? new Date(a.discharge_date).toLocaleString() : 'Ongoing'}</p>
              <p><strong>Room:</strong> {a.room?.room_number || 'Unassigned'}</p>
              <p><strong>Attending Doctor:</strong> Dr. {a.doctor?.first_name} {a.doctor?.last_name}</p>
              <p><strong>Reason for Admission:</strong> {a.reason_for_admission || '—'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabPrescriptions({ prescriptions }) {
  if (prescriptions.length === 0) return <EmptyState title="No Prescription History" />;
  return (
    <div>
      <h3 className="pr-section-title">D. Prescription History</h3>
      <div className="pr-list-container">
        {prescriptions.map(p => (
          <div key={p.id} className="pr-history-card">
            <div className="pr-card-header">
              <h4>Prescription #{String(p.id).padStart(4, '0')} ({p.type.replace('_', ' ')})</h4>
              <span className="pr-date">{new Date(p.created_at).toLocaleString()}</span>
            </div>
            <div className="pr-card-body">
              <p><strong>Doctor:</strong> Dr. {p.doctor?.first_name} {p.doctor?.last_name}</p>
              <p><strong>Notes:</strong> {p.notes || '—'}</p>
              <div className="pr-nested-table">
                <table>
                  <thead><tr><th>Medication</th><th>Dosage</th><th>Frequency</th></tr></thead>
                  <tbody>
                    {p.items?.map(item => (
                      <tr key={item.id}>
                        <td>{item.medication_name}</td>
                        <td>{item.dosage} {item.dosage_unit}</td>
                        <td>{item.frequency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabMedications({ prescriptions }) {
  // Extract all items from all prescriptions
  const allMeds = prescriptions.flatMap(p => p.items?.map(i => ({ ...i, prescription: p })) || []);
  
  if (allMeds.length === 0) return <EmptyState title="No Medication History" />;
  return (
    <div>
      <h3 className="pr-section-title">E. Medication History</h3>
      <table className="id-table">
        <thead>
          <tr>
            <th>Date Prescribed</th>
            <th>Medication</th>
            <th>Dosage</th>
            <th>Frequency</th>
            <th>Doctor</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {allMeds.map(m => (
            <tr key={m.id}>
              <td>{new Date(m.prescription.created_at).toLocaleDateString()}</td>
              <td><strong>{m.medication_name}</strong></td>
              <td>{m.dosage} {m.dosage_unit}</td>
              <td>{m.frequency}</td>
              <td>Dr. {m.prescription.doctor?.last_name}</td>
              <td><span className={`badge ${m.status === 'active' ? 'active' : 'completed'}`}>{m.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TabAdministrations({ schedules }) {
  if (schedules.length === 0) return <EmptyState title="No Administration History" />;
  return (
    <div>
      <h3 className="pr-section-title">F. Medication Administration History</h3>
      <table className="id-table">
        <thead>
          <tr>
            <th>Scheduled Time</th>
            <th>Medication</th>
            <th>Actual Admin Time</th>
            <th>Administered By</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {schedules.map(s => (
            <tr key={s.id}>
              <td>{new Date(s.scheduled_time).toLocaleString()}</td>
              <td><strong>{s.prescriptionItem?.medication_name}</strong></td>
              <td>{s.actual_administration_time ? new Date(s.actual_administration_time).toLocaleString() : '—'}</td>
              <td>{s.administeredBy ? `Nurse ${s.administeredBy.last_name}` : '—'}</td>
              <td>
                <span className={`badge ${s.status === 'completed' ? 'active' : s.status === 'missed' ? 'danger' : 'pending'}`}>
                  {s.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TabDischarges({ admissions }) {
  const discharges = admissions.filter(a => a.status === 'discharged' && a.discharge_date);
  if (discharges.length === 0) return <EmptyState title="No Discharge History" />;
  return (
    <div>
      <h3 className="pr-section-title">G. Discharge History</h3>
      <div className="pr-list-container">
        {discharges.map(d => (
          <div key={d.id} className="pr-history-card">
            <div className="pr-card-header">
              <h4>Discharge for Confinement #{String(d.id).padStart(4, '0')}</h4>
              <span className="pr-date">{new Date(d.discharge_date).toLocaleString()}</span>
            </div>
            <div className="pr-card-body">
              <p><strong>Final Diagnosis:</strong> {d.final_diagnosis || '—'}</p>
              <p><strong>Condition upon Discharge:</strong> {d.condition_at_discharge || '—'}</p>
              <p><strong>Summary:</strong> {d.discharge_summary || '—'}</p>
              <p><strong>Follow-up Date:</strong> {d.follow_up_date ? new Date(d.follow_up_date).toLocaleDateString() : '—'}</p>
              <p><strong>Follow-up Instructions:</strong> {d.follow_up_instructions || '—'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabQrCodes({ qrCodes }) {
  if (qrCodes.length === 0) return <EmptyState title="No QR Code History" />;
  return (
    <div>
      <h3 className="pr-section-title">H. QR Binding History</h3>
      <table className="id-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>QR Token Code</th>
            <th>Created Date</th>
            <th>First Scan</th>
            <th>Binding Status</th>
          </tr>
        </thead>
        <tbody>
          {qrCodes.map(q => (
            <tr key={q.id}>
              <td style={{ textTransform: 'capitalize' }}>{q.type.replace('_', ' ')}</td>
              <td><code>{q.code}</code></td>
              <td>{new Date(q.created_at).toLocaleDateString()}</td>
              <td>{q.first_scan_date ? new Date(q.first_scan_date).toLocaleDateString() : 'Never'}</td>
              <td>
                <span className={`badge ${q.status === 'bound' ? 'active' : q.status === 'active' ? 'pending' : 'danger'}`}>
                  {q.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TabTimeline({ consultations, admissions, prescriptions, schedules, qrCodes }) {
  // Aggregate all events into a unified timeline
  const events = useMemo(() => {
    const list = [];

    consultations.forEach(c => {
      list.push({
        id: `cons-${c.id}`,
        type: 'consultation',
        date: new Date(c.created_at),
        title: `Consultation with Dr. ${c.doctor?.last_name}`,
        desc: `Diagnosis: ${c.assessment || 'N/A'}`
      });
    });

    admissions.forEach(a => {
      list.push({
        id: `adm-${a.id}`,
        type: 'admission',
        date: new Date(a.admission_date),
        title: `Patient Admitted`,
        desc: `Room: ${a.room?.room_number || 'Unassigned'} | Attending: Dr. ${a.doctor?.last_name}`
      });
      if (a.discharge_date) {
        list.push({
          id: `dis-${a.id}`,
          type: 'discharge',
          date: new Date(a.discharge_date),
          title: `Patient Discharged`,
          desc: `Final Diagnosis: ${a.final_diagnosis || 'N/A'}`
        });
      }
    });

    prescriptions.forEach(p => {
      list.push({
        id: `pres-${p.id}`,
        type: 'prescription',
        date: new Date(p.created_at),
        title: `Prescription Created (${p.type.replace('_', ' ')})`,
        desc: `${p.items?.length || 0} medications prescribed by Dr. ${p.doctor?.last_name}`
      });
    });

    schedules.forEach(s => {
      if (s.status === 'completed' && s.actual_administration_time) {
        list.push({
          id: `admin-${s.id}`,
          type: 'administration',
          date: new Date(s.actual_administration_time),
          title: `Medication Administered: ${s.prescriptionItem?.medication_name}`,
          desc: `Administered by Nurse ${s.administeredBy?.last_name}`
        });
      }
    });

    // Sort descending
    return list.sort((a, b) => b.date - a.date);
  }, [consultations, admissions, prescriptions, schedules]);

  if (events.length === 0) return <EmptyState title="No Activity Timeline" />;

  return (
    <div>
      <h3 className="pr-section-title">I. Patient Record Timeline</h3>
      <div className="pr-timeline">
        {events.map((event, index) => (
          <div key={event.id} className="timeline-item">
            <div className={`timeline-icon ${event.type}`}>
              {event.type === 'consultation' && <Stethoscope size={16} />}
              {event.type === 'admission' && <Bed size={16} />}
              {event.type === 'discharge' && <Activity size={16} />}
              {event.type === 'prescription' && <FileText size={16} />}
              {event.type === 'administration' && <Syringe size={16} />}
            </div>
            <div className="timeline-content">
              <span className="timeline-date">{event.date.toLocaleString()}</span>
              <h4>{event.title}</h4>
              <p>{event.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ title }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
      <h4 style={{ color: '#0f172a', marginBottom: 8 }}>{title}</h4>
      <p>There are no records available in this section yet.</p>
    </div>
  );
}
