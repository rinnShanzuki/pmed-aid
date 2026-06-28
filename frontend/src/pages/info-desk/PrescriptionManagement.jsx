import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Plus, Printer, X, FileSignature, Eye, QrCode, ArrowLeft, Send, Stethoscope, Clock, User } from 'lucide-react';

export default function PrescriptionManagement() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [medications, setMedications] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'add' | 'view' | 'handover' | null
  const [encodeStep, setEncodeStep] = useState(1); // 1: Form, 2: Review, 3: QR
  const [generatedQR, setGeneratedQR] = useState('');
  const [generatedQRImage, setGeneratedQRImage] = useState('');
  const [viewData, setViewData] = useState(null);
  const [encodingPrescriptionId, setEncodingPrescriptionId] = useState(null);
  const [form, setForm] = useState({ patient_id: '', admission_id: '', doctor_id: '', type: 'in_hospital', notes: '' });
  const [items, setItems] = useState([{ medication_name: '', dosage: '', dosage_unit: 'mg', frequency: 1, frequency_unit: 'daily', duration: 1, duration_unit: 'days', route: 'oral', instructions: '', start_time: '', interval_hours: '' }]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function fetchPrescriptions() {
    try {
      const { data } = await api.get('/prescriptions');
      setPrescriptions(data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function fetchDropdowns() {
    try {
      const [pRes, dRes, mRes, aRes, nRes] = await Promise.all([
        api.get('/patients'),
        api.get('/users', { params: { role: 'doctor' } }),
        api.get('/medications'),
        api.get('/admissions', { params: { status: 'admitted' } }),
        api.get('/users', { params: { role: 'nurse' } })
      ]);
      setPatients(pRes.data.data);
      setDoctors(dRes.data.data);
      setMedications(mRes.data.data);
      setAdmissions(aRes.data.data);
      setNurses(nRes.data.data);
    } catch (err) { console.error(err); }
  }

  useEffect(() => { fetchPrescriptions(); fetchDropdowns(); }, []);

  function addItem() {
    setItems([...items, { medication_name: '', dosage: '', dosage_unit: 'mg', frequency: 1, frequency_unit: 'daily', duration: 1, duration_unit: 'days', route: 'oral', instructions: '', start_time: '', interval_hours: '' }]);
  }

  function removeItem(idx) { if (items.length > 1) setItems(items.filter((_, i) => i !== idx)); }
  function updateItem(idx, field, value) { 
    setItems(items.map((it, i) => {
      if (i !== idx) return it;
      let updates = { [field]: value };
      if (field === 'frequency' || field === 'frequency_unit') {
        const freq = field === 'frequency' ? value : it.frequency;
        const unit = field === 'frequency_unit' ? value : it.frequency_unit;
        if (unit === 'hourly') updates.interval_hours = '';
        else if (unit === 'daily' && freq > 0) updates.interval_hours = (24 / freq).toString();
        else updates.interval_hours = '';
      }
      return { ...it, ...updates };
    }));
  }

  function openAdd() {
    setForm({ patient_id: '', admission_id: '', doctor_id: '', type: 'in_hospital', notes: '' });
    setItems([{ medication_name: '', dosage: '', dosage_unit: 'mg', frequency: 1, frequency_unit: 'daily', duration: 1, duration_unit: 'days', route: 'oral', instructions: '', start_time: '', interval_hours: '' }]);
    setError('');
    setEncodeStep(1);
    setGeneratedQR('');
    setEncodingPrescriptionId(null);
    setModal('add');
  }

  function openEncodeForPending(rx) {
    setForm({ patient_id: rx.patient_id, admission_id: rx.admission_id, doctor_id: rx.doctor_id, type: rx.type, notes: rx.notes || '' });
    setItems([{ medication_name: '', dosage: '', dosage_unit: 'mg', frequency: 1, frequency_unit: 'daily', duration: 1, duration_unit: 'days', route: 'oral', instructions: '', start_time: '', interval_hours: '' }]);
    setError('');
    setEncodeStep(1);
    setGeneratedQR('');
    setEncodingPrescriptionId(rx.id);
    setModal('add');
  }

  async function openView(id) {
    try {
      const { data } = await api.get(`/prescriptions/${id}`);
      setViewData(data.data); setModal('view');
    } catch (err) { console.error(err); }
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError('');

    if (encodeStep === 2) {
      try {
        let res;
        if (encodingPrescriptionId) {
          res = await api.post(`/prescriptions/${encodingPrescriptionId}/items`, { items });
        } else {
          res = await api.post('/prescriptions', { ...form, items });
        }
        setGeneratedQR(res.data.qr_code);
        setGeneratedQRImage(res.data.qr_image || '');
        setSuccess('Prescription encoded successfully!');
        fetchPrescriptions();
        setEncodeStep(3);
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) { setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to encode prescription.'); }
    }
  }

  function handleNext(e) {
    e.preventDefault();
    const formEl = document.getElementById('encode-prescription-form');
    if (!formEl.checkValidity()) {
      formEl.reportValidity();
      return;
    }
    setEncodeStep(2);
  }

  function handlePrint(rx) {
    const printWin = window.open('', '_blank');
    const itemsHtml = (rx.items || []).map((it, i) => `
      <tr><td>${i + 1}</td><td>${it.medication_name}</td><td>${it.dosage} ${it.dosage_unit}</td>
      <td>${it.frequency}x ${it.frequency_unit}</td><td>${it.duration} ${it.duration_unit}</td><td>${it.route}</td></tr>
    `).join('');
    printWin.document.write(`<html><head><title>Prescription #${rx.id}</title>
      <style>body{font-family:Arial;padding:40px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}</style></head>
      <body><h2>PMed-Aid Prescription</h2>
      <p><strong>Patient:</strong> ${rx.patient?.first_name} ${rx.patient?.last_name}</p>
      <p><strong>Doctor:</strong> Dr. ${rx.doctor?.first_name} ${rx.doctor?.last_name}</p>
      <p><strong>Date:</strong> ${new Date(rx.created_at || rx.createdAt).toLocaleDateString()}</p>
      <p><strong>Type:</strong> ${rx.type?.replace('_', ' ')}</p>
      <table><thead><tr><th>#</th><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Route</th></tr></thead><tbody>${itemsHtml}</tbody></table>
      ${rx.notes ? `<p style="margin-top:20px"><strong>Notes:</strong> ${rx.notes}</p>` : ''}
      </body></html>`);
    printWin.document.close();
    printWin.print();
  }

  async function handlePrintQR(rx) {
    try {
      const { data } = await api.get(`/qr-codes/patient/${rx.patient_id}`);
      const qr = data.data.find(q => String(q.prescription_id) === String(rx.id));
      if (qr && qr.qr_image) {
        const pw = window.open('', '', 'width=600,height=600');
        pw.document.write(`
          <html><head><title>Prescription QR</title></head>
          <body style="text-align:center; padding: 50px; font-family: sans-serif;">
            <h3 style="color:#475569; margin-bottom:8px">PMed-Aid</h3>
            <img src="${qr.qr_image}" style="width:250px;height:250px" />
            <p style="margin-top:16px; font-size:0.9rem; color:#64748b">${rx.patient?.first_name} ${rx.patient?.last_name}</p>
            <p style="font-size:0.8rem; color:#94a3b8; word-break:break-all">${qr.code}</p>
            <script>setTimeout(function(){window.print()},300);</script>
          </body></html>
        `);
        pw.document.close();
      } else {
        alert('QR code not found for this prescription.');
      }
    } catch (err) {
      alert('Failed to fetch QR code.');
    }
  }

  async function handleAssignNurse(nurseId) {
    if (!viewData?.admission_id) return;
    try {
      await api.put(`/admissions/${viewData.admission_id}`, { assigned_nurse_id: nurseId || null });
      alert('Nurse assigned successfully.');
      // Optional: Refresh viewData or fetchPrescriptions if we want to reflect it locally, 
      // but viewData itself doesn't hold admission directly yet, except maybe through a refetch
    } catch (err) {
      alert('Failed to assign nurse.');
    }
  }

  // Auto-fill admission when patient changes
  function onPatientChange(patientId) {
    setForm(f => ({ ...f, patient_id: patientId }));
    const adm = admissions.find(a => String(a.patient_id) === String(patientId));
    if (adm) setForm(f => ({ ...f, patient_id: patientId, admission_id: adm.id }));
  }

  const handovers = prescriptions.filter(rx => rx.status === 'pending_encoding');
  const handoverCount = handovers.length;

  const filtered = prescriptions.filter(rx => {
    if (rx.status === 'pending_encoding') return false;
    if (!search) return true;
    const name = `${rx.patient?.first_name} ${rx.patient?.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  if (modal === 'view' && viewData) {
    return (
      <div style={{ maxWidth: 850, margin: '0 auto', paddingBottom: 40 }}>
        <button
          onClick={() => setModal(null)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '12px 0', fontSize: '0.95rem', fontWeight: 600, marginBottom: 16 }}
        >
          <ArrowLeft size={18} /> Back to Prescriptions
        </button>

        <div className="id-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ background: '#f8fafc', padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Prescription Record</h2>
              <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Record ID: {viewData.id} • Generated on {new Date(viewData.created_at || viewData.createdAt).toLocaleDateString()}</div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="action-btn outline" onClick={() => handlePrintQR(viewData)} style={{ border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a' }}>
                <QrCode size={16} /> Print QR Code
              </button>
              <button className="action-btn primary" onClick={() => handlePrint(viewData)} style={{ background: '#0f172a' }}>
                <Printer size={16} /> Print Document
              </button>
            </div>
          </div>

          <div style={{ padding: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32, marginBottom: 32 }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Patient Details</div>
                <div style={{ fontSize: '1.1rem', color: '#0f172a', fontWeight: 600 }}>{viewData.patient?.first_name} {viewData.patient?.last_name}</div>
                <div style={{ color: '#475569', fontSize: '0.9rem', marginTop: 4 }}>ID: {viewData.patient?.id}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Physician Details</div>
                <div style={{ fontSize: '1.1rem', color: '#0f172a', fontWeight: 600 }}>Dr. {viewData.doctor?.first_name} {viewData.doctor?.last_name}</div>
                <div style={{ color: '#475569', fontSize: '0.9rem', marginTop: 4 }}>Status: {viewData.status === 'active' ? 'Active' : viewData.status} | Type: {viewData.type?.replace('_', ' ')}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Assigned Nurse</div>
                <select
                  className="id-input"
                  style={{ width: '100%', padding: '6px 12px', fontSize: '0.95rem' }}
                  value={admissions.find(a => a.id === viewData.admission_id)?.assigned_nurse_id || ''}
                  onChange={(e) => {
                    const newNurseId = e.target.value;
                    setAdmissions(admissions.map(a => a.id === viewData.admission_id ? { ...a, assigned_nurse_id: newNurseId } : a));
                    handleAssignNurse(newNurseId);
                  }}
                >
                  <option value="">-- Unassigned --</option>
                  {nurses.map(n => (
                    <option key={n.id} value={n.id}>{n.first_name} {n.last_name}</option>
                  ))}
                </select>
                <div style={{ color: '#475569', fontSize: '0.8rem', marginTop: 4 }}>Assign before printing QR</div>
              </div>
            </div>

            <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: 32, marginBottom: 32 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 }}>Prescribed Medications</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 8px', color: '#475569', fontSize: '0.85rem', fontWeight: 600 }}>Medication Name</th>
                    <th style={{ padding: '12px 8px', color: '#475569', fontSize: '0.85rem', fontWeight: 600 }}>Dosage</th>
                    <th style={{ padding: '12px 8px', color: '#475569', fontSize: '0.85rem', fontWeight: 600 }}>Frequency</th>
                    <th style={{ padding: '12px 8px', color: '#475569', fontSize: '0.85rem', fontWeight: 600 }}>Schedule</th>
                    <th style={{ padding: '12px 8px', color: '#475569', fontSize: '0.85rem', fontWeight: 600 }}>Duration</th>
                    <th style={{ padding: '12px 8px', color: '#475569', fontSize: '0.85rem', fontWeight: 600 }}>Route</th>
                  </tr>
                </thead>
                <tbody>
                  {viewData.items?.map((it, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 8px', color: '#0f172a', fontWeight: 500 }}>
                        {it.medication_name}
                        {it.instructions && <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4, fontWeight: 400 }}>Note: {it.instructions}</div>}
                      </td>
                      <td style={{ padding: '16px 8px', color: '#334155' }}>{it.dosage} {it.dosage_unit}</td>
                      <td style={{ padding: '16px 8px', color: '#334155' }}>{it.frequency}x {it.frequency_unit}</td>
                      <td style={{ padding: '16px 8px', color: '#334155' }}>{it.start_time ? `${it.start_time.slice(0, 5)}` : 'Auto'} {it.interval_hours ? ` (q${it.interval_hours}h)` : ''}</td>
                      <td style={{ padding: '16px 8px', color: '#334155' }}>{it.duration} {it.duration_unit}</td>
                      <td style={{ padding: '16px 8px', color: '#334155' }}>{it.route?.replace('_', ' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {viewData.notes && (
              <div style={{ background: '#fefce8', border: '1px solid #fef08a', padding: 16, borderRadius: 8, color: '#854d0e', fontSize: '0.95rem', marginBottom: 32 }}>
                <strong style={{ display: 'block', marginBottom: 4 }}>Physician Notes:</strong>
                {viewData.notes}
              </div>
            )}

            <ViewQrSection viewData={viewData} />
          </div>
        </div>
      </div>
    );
  }

  // ── Handover List View ──
  if (modal === 'handover') {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 40 }}>
        <button
          onClick={() => setModal(null)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '12px 0', fontSize: '0.95rem', fontWeight: 600, marginBottom: 16 }}
        >
          <ArrowLeft size={18} /> Back to Prescriptions
        </button>

        <div className="id-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ background: '#f8fafc', padding: '24px 32px', borderBottom: '1px solid #e2e8f0' }}>
            <h2 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Send size={22} color="#f59e0b" /> Doctor Handovers
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Consultations handed over by doctors for prescription encoding.</p>
          </div>

          <div style={{ padding: '24px 32px' }}>
            {handovers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8' }}>
                <Send size={48} style={{ marginBottom: 16, opacity: 0.4 }} />
                <p style={{ fontSize: '1rem', margin: 0 }}>No pending handovers from doctors.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {handovers.map(rx => (
                  <div key={rx.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', background: '#fff', transition: 'box-shadow 0.2s' }}>
                    <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={20} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.05rem' }}>
                              {rx.patient?.first_name} {rx.patient?.last_name}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                              Prescribed by Dr. {rx.doctor?.first_name} {rx.doctor?.last_name}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 16, fontSize: '0.85rem', color: '#64748b', marginBottom: 12 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={14} /> {new Date(rx.created_at || rx.createdAt).toLocaleDateString()}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Stethoscope size={14} /> {rx.type?.replace('_', ' ')}
                          </span>
                        </div>

                        {rx.notes && (
                          <div style={{ background: '#fefce8', border: '1px solid #fef08a', padding: '12px 16px', borderRadius: 8, fontSize: '0.9rem', color: '#854d0e' }}>
                            <strong style={{ display: 'block', marginBottom: 4, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Doctor's Notes:</strong>
                            <span style={{ whiteSpace: 'pre-wrap' }}>{rx.notes}</span>
                          </div>
                        )}
                      </div>

                      <button
                        className="action-btn primary"
                        onClick={() => { setModal(null); setTimeout(() => openEncodeForPending(rx), 50); }}
                        style={{ whiteSpace: 'nowrap', alignSelf: 'center' }}
                      >
                        <FileSignature size={16} /> Encode Prescription
                      </button>
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
    <>
      {success && <div style={{ padding: '12px 16px', background: '#dcfce7', color: '#166534', borderRadius: 8, marginBottom: 16, fontWeight: 600 }}>{success}</div>}

      <div className="id-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}><FileSignature size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />Prescription Management</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ padding: '10px 12px 10px 36px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', width: 200 }} />
            </div>
            <button
              className="action-btn primary"
              onClick={() => setModal('handover')}
              style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Send size={16} /> Handover ({handoverCount})
              {handoverCount > 0 && (
                <span style={{
                  position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%',
                  background: '#ef4444', color: '#fff', fontSize: '0.7rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(239,68,68,0.4)'
                }}>{handoverCount}</span>
              )}
            </button>
          </div>
        </div>

        <div className="id-table-container">
          <table className="id-table">
            <thead><tr><th>Patient</th><th>Doctor</th><th>Type</th><th>Items</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 32 }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No prescriptions found</td></tr>
              ) : filtered.map(rx => (
                <tr key={rx.id}>
                  <td><strong>{rx.patient?.first_name} {rx.patient?.last_name}</strong></td>
                  <td>Dr. {rx.doctor?.first_name} {rx.doctor?.last_name}</td>
                  <td><span className={`badge ${rx.type === 'discharge' ? 'discharged' : 'active'}`}>{rx.type?.replace('_', ' ')}</span></td>
                  <td>{rx.items?.length || 0} items</td>
                  <td><span className={`badge ${rx.status === 'pending_encoding' ? 'pending' : rx.status}`}>{rx.status === 'pending_encoding' ? 'Pending Encoding' : rx.status}</span></td>
                  <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    {new Date(rx.created_at || rx.createdAt).toLocaleDateString()}
                    {rx.prescribed_time && <div>{rx.prescribed_time}</div>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {rx.status === 'pending_encoding' ? (
                        <button className="action-btn primary" onClick={() => openEncodeForPending(rx)} title="Encode Items" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>Encode Items</button>
                      ) : (
                        <>
                          <button className="action-btn outline" onClick={() => openView(rx.id)} title="View Record"><Eye size={14} style={{ marginRight: 6 }} /> View Record</button>
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

      {/* Encode Modal */}
      {modal === 'add' && (
        <div style={overlay} onClick={() => setModal(null)}>
          <div style={{ ...modalBox, maxWidth: 720 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ margin: 0 }}>
                {encodeStep === 1 ? 'Step 1: Encode Prescription' :
                  encodeStep === 2 ? 'Step 2: Review Prescription' :
                    'Step 3: Generate QR Code'}
              </h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form id="encode-prescription-form" onSubmit={handleSubmit}>
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '60vh', overflowY: 'auto' }}>
                {error && <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: 8, fontSize: '0.85rem' }}>{error}</div>}

                {encodeStep === 1 && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div><label style={lbl}>Patient *</label>
                        <select style={inp} value={form.patient_id} onChange={e => onPatientChange(e.target.value)} required disabled={!!encodingPrescriptionId}>
                          <option value="">Select Patient</option>
                          {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                        </select></div>
                      <div><label style={lbl}>Prescribing Doctor *</label>
                        <select style={inp} value={form.doctor_id} onChange={e => setForm({ ...form, doctor_id: e.target.value })} required disabled={!!encodingPrescriptionId}>
                          <option value="">Select Doctor</option>
                          {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name}</option>)}
                        </select></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div><label style={lbl}>Type</label>
                        <select style={inp} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                          <option value="in_hospital">In Hospital</option><option value="discharge">Discharge</option>
                        </select></div>
                      <div><label style={lbl}>Notes</label>
                        <input style={inp} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes..." /></div>
                    </div>

                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Medication Items</h4>
                        <button type="button" className="action-btn outline" onClick={addItem}><Plus size={14} /> Add Item</button>
                      </div>
                      {items.map((it, idx) => (
                        <div key={idx} style={{ background: '#f8fafc', borderRadius: 12, padding: 16, marginBottom: 12, border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Item {idx + 1}</span>
                            {items.length > 1 && <button type="button" onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}>Remove</button>}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
                            <div style={{ gridColumn: 'span 2' }}><label style={lbl}>Medication *</label><input style={inp} value={it.medication_name} onChange={e => updateItem(idx, 'medication_name', e.target.value)} required list={`med-list-${idx}`} />
                              <datalist id={`med-list-${idx}`}>{medications.map(m => <option key={m.id} value={m.name} />)}</datalist></div>
                            <div><label style={lbl}>Dosage *</label><input style={inp} value={it.dosage} onChange={e => updateItem(idx, 'dosage', e.target.value)} required placeholder="e.g. 500" /></div>
                            <div><label style={lbl}>Unit</label>
                              <select style={inp} value={it.dosage_unit} onChange={e => updateItem(idx, 'dosage_unit', e.target.value)}>
                                <option>mg</option><option>ml</option><option>g</option><option>mcg</option><option>IU</option>
                              </select></div>
                            <div><label style={lbl}>Frequency</label><input type="number" min="1" style={inp} value={it.frequency} onChange={e => updateItem(idx, 'frequency', e.target.value)} /></div>
                            <div><label style={lbl}>Freq Unit</label>
                              <select style={inp} value={it.frequency_unit} onChange={e => updateItem(idx, 'frequency_unit', e.target.value)}>
                                <option value="hourly">Hourly</option><option value="daily">Daily</option><option value="weekly">Weekly</option>
                              </select></div>
                            <div><label style={lbl}>Duration</label><input type="number" min="1" style={inp} value={it.duration} onChange={e => updateItem(idx, 'duration', e.target.value)} /></div>
                            <div><label style={lbl}>Dur Unit</label>
                              <select style={inp} value={it.duration_unit} onChange={e => updateItem(idx, 'duration_unit', e.target.value)}>
                                <option value="days">Days</option><option value="weeks">Weeks</option><option value="months">Months</option>
                              </select></div>
                            <div><label style={lbl}>Route</label>
                              <select style={inp} value={it.route} onChange={e => updateItem(idx, 'route', e.target.value)}>
                                <option>oral</option><option>IV</option><option>IM</option><option>SC</option><option>topical</option><option>inhalation</option>
                              </select></div>
                            <div><label style={lbl}>Start Time</label>
                              <input type="time" style={inp} value={it.start_time || ''} onChange={e => updateItem(idx, 'start_time', e.target.value)} /></div>
                            <div><label style={lbl}>Interval (hrs)</label>
                              <input type="number" step="0.5" style={inp} value={it.interval_hours || ''} onChange={e => updateItem(idx, 'interval_hours', e.target.value)} placeholder="e.g. 8" /></div>
                            <div style={{ gridColumn: 'span 1' }}><label style={lbl}>Instructions</label><input style={inp} value={it.instructions} onChange={e => updateItem(idx, 'instructions', e.target.value)} placeholder="Take after meals" /></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {encodeStep === 2 && (
                  <div style={{ background: '#f8fafc', padding: 24, borderRadius: 8, border: '1px solid #e2e8f0', color: '#334155' }}>
                    <h3 style={{ marginTop: 0, marginBottom: 16, color: '#0f172a', borderBottom: '2px solid #cbd5e1', paddingBottom: 8 }}>Prescription Summary</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: 4 }}>Patient</span>
                        <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{patients.find(p => String(p.id) === String(form.patient_id))?.first_name} {patients.find(p => String(p.id) === String(form.patient_id))?.last_name}</strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: 4 }}>Prescribing Doctor</span>
                        <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>Dr. {doctors.find(d => String(d.id) === String(form.doctor_id))?.last_name}</strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: 4 }}>Prescription Type</span>
                        <strong style={{ color: '#0f172a', textTransform: 'capitalize' }}>{form.type?.replace('_', ' ')}</strong>
                      </div>
                      {form.notes && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          <span style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: 4 }}>Notes</span>
                          <span style={{ color: '#334155', fontStyle: 'italic' }}>{form.notes}</span>
                        </div>
                      )}
                    </div>

                    <h4 style={{ borderTop: '1px solid #cbd5e1', paddingTop: 16, marginTop: 0, marginBottom: 16, color: '#0f172a' }}>Medication Items ({items.length})</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {items.map((it, idx) => (
                        <div key={idx} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <strong style={{ color: '#0f172a', fontSize: '1.1rem' }}>{it.medication_name}</strong>
                            <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: 4, fontSize: '0.8rem', fontWeight: 600 }}>{it.route}</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, fontSize: '0.9rem' }}>
                            <div><span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: 2 }}>Dosage</span><strong style={{ color: '#1e293b' }}>{it.dosage} {it.dosage_unit}</strong></div>
                            <div><span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: 2 }}>Frequency</span><strong style={{ color: '#1e293b' }}>{it.frequency}x {it.frequency_unit}</strong></div>
                            <div><span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: 2 }}>Schedule</span><strong style={{ color: '#1e293b' }}>{it.start_time ? `${it.start_time.slice(0, 5)}` : 'Auto'} {it.interval_hours ? ` (q${it.interval_hours}h)` : ''}</strong></div>
                            <div><span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: 2 }}>Duration</span><strong style={{ color: '#1e293b' }}>{it.duration} {it.duration_unit}</strong></div>
                          </div>
                          {it.instructions && (
                            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #e2e8f0', fontSize: '0.85rem' }}>
                              <span style={{ color: '#64748b', marginRight: 8 }}>Instructions:</span>
                              <span style={{ color: '#334155', fontStyle: 'italic' }}>{it.instructions}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {encodeStep === 3 && (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '2rem' }}>✓</div>
                    <h2 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>QR Code Generated</h2>
                    <p style={{ color: '#64748b', marginBottom: 24 }}>This QR code allows the nurse to scan and confirm medication administration.</p>
                    {generatedQRImage ? (
                      <img src={generatedQRImage} alt="Prescription QR" style={{ width: 200, height: 200, border: '1px solid #e2e8f0', borderRadius: 8, padding: 8 }} />
                    ) : (
                      <div style={{ padding: 32, color: '#64748b' }}>Generating QR code...</div>
                    )}
                    <p style={{ fontWeight: 500, fontSize: '0.8rem', color: '#94a3b8', marginTop: 12, wordBreak: 'break-all' }}>{generatedQR}</p>
                  </div>
                )}

              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #f1f5f9' }}>
                {encodeStep === 1 && (
                  <>
                    <button type="button" className="action-btn outline" onClick={() => setModal(null)}>Cancel</button>
                    <button type="button" className="action-btn primary" onClick={handleNext}>Next: Review</button>
                  </>
                )}
                {encodeStep === 2 && (
                  <>
                    <button type="button" className="action-btn outline" onClick={() => setEncodeStep(1)}>Back to Edit</button>
                    <button type="submit" className="action-btn primary">Confirm & Generate QR</button>
                  </>
                )}
                {encodeStep === 3 && (
                  <>
                    <button type="button" className="action-btn outline" onClick={() => setModal(null)}>Done</button>
                    <button type="button" className="action-btn primary" onClick={() => {
                      const pw = window.open('', '', 'width=600,height=600');
                      pw.document.write(`
                         <html><head><title>Prescription QR</title></head>
                         <body style="text-align:center; padding: 50px; font-family: sans-serif;">
                           <h3 style="color:#475569; margin-bottom:8px">PMed-Aid</h3>
                           <img src="${generatedQRImage}" style="width:250px;height:250px" />
                           <p style="margin-top:16px; font-size:0.9rem; color:#64748b">Scan to confirm medication administration.</p>
                           <p style="font-size:0.8rem; color:#94a3b8; word-break:break-all">${generatedQR}</p>
                           <script>setTimeout(function(){window.print()},300);</script>
                         </body></html>
                       `);
                      pw.document.close();
                    }}>
                      <QrCode size={16} style={{ marginRight: 6 }} /> Print QR Code
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

    </>
  );
}

const lbl = { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: 4 };
const inp = { width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', boxSizing: 'border-box' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalBox = { background: '#fff', borderRadius: 16, width: '100%', maxHeight: '90vh', overflow: 'auto' };

function ViewQrSection({ viewData }) {
  const [qrImage, setQrImage] = useState(null);
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!viewData?.patient_id || !viewData?.id) return;
    (async () => {
      try {
        const { data } = await api.get(`/qr-codes/patient/${viewData.patient_id}`);
        const qr = data.data.find(q => String(q.prescription_id) === String(viewData.id));
        if (qr) {
          setQrImage(qr.qr_image);
          setQrCode(qr.code);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, [viewData]);

  if (loading) return <div style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>Loading QR code...</div>;
  if (!qrImage) return null;

  return (
    <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: 32 }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 }}>Patient QR Code</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32, padding: 24, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
        <img src={qrImage} alt="Patient QR Code" style={{ width: 160, height: 160, borderRadius: 8, border: '1px solid #e2e8f0' }} />
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>Scan this QR code to verify patient and medication</div>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 4 }}>This code is unique to this prescription and patient. The nurse scans it to pull up pending medications and confirm administration.</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', wordBreak: 'break-all', marginTop: 12, fontFamily: 'monospace' }}>{qrCode}</div>
        </div>
      </div>
    </div>
  );
}
