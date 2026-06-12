import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Plus, Printer, X, FileSignature, Eye, QrCode } from 'lucide-react';

export default function PrescriptionManagement() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [medications, setMedications] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'add' | 'view' | null
  const [encodeStep, setEncodeStep] = useState(1); // 1: Form, 2: Review, 3: QR
  const [generatedQR, setGeneratedQR] = useState('');
  const [viewData, setViewData] = useState(null);
  const [form, setForm] = useState({ patient_id: '', admission_id: '', doctor_id: '', type: 'in_hospital', notes: '' });
  const [items, setItems] = useState([{ medication_name: '', dosage: '', dosage_unit: 'mg', frequency: 1, frequency_unit: 'daily', duration: 1, duration_unit: 'days', route: 'oral', instructions: '' }]);
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
      const [pRes, dRes, mRes, aRes] = await Promise.all([
        api.get('/patients'),
        api.get('/users', { params: { role: 'doctor' } }),
        api.get('/medications'),
        api.get('/admissions', { params: { status: 'admitted' } })
      ]);
      setPatients(pRes.data.data);
      setDoctors(dRes.data.data);
      setMedications(mRes.data.data);
      setAdmissions(aRes.data.data);
    } catch (err) { console.error(err); }
  }

  useEffect(() => { fetchPrescriptions(); fetchDropdowns(); }, []);

  function addItem() {
    setItems([...items, { medication_name: '', dosage: '', dosage_unit: 'mg', frequency: 1, frequency_unit: 'daily', duration: 1, duration_unit: 'days', route: 'oral', instructions: '' }]);
  }

  function removeItem(idx) { if (items.length > 1) setItems(items.filter((_, i) => i !== idx)); }
  function updateItem(idx, field, value) { setItems(items.map((it, i) => i === idx ? { ...it, [field]: value } : it)); }

  function openAdd() {
    setForm({ patient_id: '', admission_id: '', doctor_id: '', type: 'in_hospital', notes: '' });
    setItems([{ medication_name: '', dosage: '', dosage_unit: 'mg', frequency: 1, frequency_unit: 'daily', duration: 1, duration_unit: 'days', route: 'oral', instructions: '' }]);
    setError(''); 
    setEncodeStep(1);
    setGeneratedQR('');
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
        const res = await api.post('/prescriptions', { ...form, items });
        setGeneratedQR(res.data.qr_code);
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

  // Auto-fill admission when patient changes
  function onPatientChange(patientId) {
    setForm(f => ({ ...f, patient_id: patientId }));
    const adm = admissions.find(a => String(a.patient_id) === String(patientId));
    if (adm) setForm(f => ({ ...f, patient_id: patientId, admission_id: adm.id }));
  }

  const filtered = prescriptions.filter(rx => {
    if (!search) return true;
    const name = `${rx.patient?.first_name} ${rx.patient?.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <>
      {success && <div style={{ padding: '12px 16px', background: '#dcfce7', color: '#166534', borderRadius: 8, marginBottom: 16, fontWeight: 600 }}>{success}</div>}

      <div className="id-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}><FileSignature size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />Prescription Management</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ padding: '10px 12px 10px 36px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', width: 200 }} />
            </div>
            <button className="action-btn primary" onClick={openAdd}><Plus size={16} /> Encode Prescription</button>
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
                  <td><span className={`badge ${rx.status}`}>{rx.status}</span></td>
                  <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{new Date(rx.created_at || rx.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="action-btn outline" onClick={() => openView(rx.id)} title="View"><Eye size={14} /></button>
                      <button className="action-btn outline" onClick={() => handlePrint(rx)} title="Print"><Printer size={14} /></button>
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
                        <select style={inp} value={form.patient_id} onChange={e => onPatientChange(e.target.value)} required>
                          <option value="">Select Patient</option>
                          {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                        </select></div>
                      <div><label style={lbl}>Prescribing Doctor *</label>
                        <select style={inp} value={form.doctor_id} onChange={e => setForm({...form, doctor_id: e.target.value})} required>
                          <option value="">Select Doctor</option>
                          {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name}</option>)}
                        </select></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div><label style={lbl}>Type</label>
                        <select style={inp} value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                          <option value="in_hospital">In Hospital</option><option value="discharge">Discharge</option>
                        </select></div>
                      <div><label style={lbl}>Notes</label>
                        <input style={inp} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Optional notes..." /></div>
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
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                            <div><label style={lbl}>Medication *</label><input style={inp} value={it.medication_name} onChange={e => updateItem(idx, 'medication_name', e.target.value)} required list={`med-list-${idx}`} />
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
                            <div><label style={lbl}>Route</label>
                              <select style={inp} value={it.route} onChange={e => updateItem(idx, 'route', e.target.value)}>
                                <option>oral</option><option>IV</option><option>IM</option><option>SC</option><option>topical</option><option>inhalation</option>
                              </select></div>
                            <div><label style={lbl}>Duration</label><input type="number" min="1" style={inp} value={it.duration} onChange={e => updateItem(idx, 'duration', e.target.value)} /></div>
                            <div><label style={lbl}>Dur Unit</label>
                              <select style={inp} value={it.duration_unit} onChange={e => updateItem(idx, 'duration_unit', e.target.value)}>
                                <option value="days">Days</option><option value="weeks">Weeks</option><option value="months">Months</option>
                              </select></div>
                            <div><label style={lbl}>Instructions</label><input style={inp} value={it.instructions} onChange={e => updateItem(idx, 'instructions', e.target.value)} placeholder="Take after meals" /></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {encodeStep === 2 && (
                  <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <p style={{ marginTop: 0 }}><strong>Patient:</strong> {patients.find(p => String(p.id) === String(form.patient_id))?.first_name} {patients.find(p => String(p.id) === String(form.patient_id))?.last_name}</p>
                    <p><strong>Doctor:</strong> Dr. {doctors.find(d => String(d.id) === String(form.doctor_id))?.last_name}</p>
                    <p><strong>Type:</strong> {form.type?.replace('_', ' ')}</p>
                    {form.notes && <p><strong>Notes:</strong> {form.notes}</p>}
                    
                    <h4 style={{ borderTop: '1px solid #cbd5e1', paddingTop: 12, marginTop: 12 }}>Items ({items.length})</h4>
                    <ul style={{ paddingLeft: 20, margin: 0, fontSize: '0.95rem' }}>
                      {items.map((it, idx) => (
                        <li key={idx} style={{ marginBottom: 8 }}>
                          <strong>{it.medication_name}</strong> - {it.dosage}{it.dosage_unit}, {it.frequency}x {it.frequency_unit} ({it.route})
                          <br/><span style={{ color: '#64748b', fontSize: '0.85rem' }}>Duration: {it.duration} {it.duration_unit} {it.instructions && `| ${it.instructions}`}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {encodeStep === 3 && (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <h2 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>QR Code Generated</h2>
                    <p style={{ color: '#64748b', marginBottom: 24 }}>This QR code allows the nurse to scan and confirm medication administration.</p>
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(generatedQR)}`} alt="Prescription QR" style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 8 }} />
                    <p style={{ fontWeight: 600, fontSize: '1.2rem', marginTop: 16 }}>{generatedQR}</p>
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
                           <h2>Prescription ID: ${generatedQR}</h2>
                           <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${generatedQR}" />
                           <p style="margin-top: 20px; font-size: 1.1rem; color: #475569">Scan to confirm medication administration.</p>
                           <script>window.print();window.close();</script>
                         </body></html>
                       `);
                    }}>
                      <QrCode size={16} style={{ marginRight: 6 }}/> Print QR Code
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {modal === 'view' && viewData && (
        <div style={overlay} onClick={() => setModal(null)}>
          <div style={{ ...modalBox, maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ margin: 0 }}>Prescription Details</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="action-btn outline" onClick={() => handlePrint(viewData)}><Printer size={14} /> Print</button>
                <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
              </div>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <p><strong>Patient:</strong> {viewData.patient?.first_name} {viewData.patient?.last_name}</p>
                <p><strong>Doctor:</strong> Dr. {viewData.doctor?.first_name} {viewData.doctor?.last_name}</p>
                <p><strong>Type:</strong> {viewData.type?.replace('_',' ')}</p>
                <p><strong>Status:</strong> {viewData.status}</p>
              </div>
              <h4 style={{ margin: '0 0 12px 0' }}>Medication Items</h4>
              {viewData.items?.map((it, i) => (
                <div key={i} style={{ background: '#f8fafc', borderRadius: 8, padding: 12, marginBottom: 8, border: '1px solid #e2e8f0' }}>
                  <strong>{it.medication_name}</strong> — {it.dosage} {it.dosage_unit}, {it.frequency}x {it.frequency_unit}, {it.duration} {it.duration_unit} ({it.route})
                  {it.instructions && <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>Instructions: {it.instructions}</p>}
                </div>
              ))}
              {viewData.notes && <p style={{ marginTop: 16 }}><strong>Notes:</strong> {viewData.notes}</p>}
            </div>
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
