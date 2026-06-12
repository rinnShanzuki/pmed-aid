import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Search, Plus, Printer, X, FileSignature, Eye } from 'lucide-react';

export default function Prescriptions() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [medications, setMedications] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'add' | 'view'
  const [viewData, setViewData] = useState(null);
  const [form, setForm] = useState({ patient_id: '', admission_id: '', type: 'in_hospital', notes: '' });
  const [items, setItems] = useState([{ medication_name: '', dosage: '', dosage_unit: 'mg', frequency: 1, frequency_unit: 'daily', duration: 1, duration_unit: 'days', route: 'oral', instructions: '' }]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function fetchPrescriptions() {
    try {
      // Get all active admitted patients and prescriptions linked to this doctor
      const { data } = await api.get('/prescriptions');
      // Only show prescriptions by this doctor
      setPrescriptions(data.data?.filter(rx => String(rx.doctor_id) === String(user?.id)) || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function fetchDropdowns() {
    try {
      const [pRes, mRes, aRes] = await Promise.all([
        api.get('/patients'),
        api.get('/medications'),
        api.get('/admissions', { params: { status: 'admitted' } })
      ]);
      setPatients(pRes.data.data || []);
      setMedications(mRes.data.data || []);
      setAdmissions(aRes.data.data || []);
    } catch (err) { console.error(err); }
  }

  useEffect(() => { fetchPrescriptions(); fetchDropdowns(); }, []);

  function addItem() {
    setItems([...items, { medication_name: '', dosage: '', dosage_unit: 'mg', frequency: 1, frequency_unit: 'daily', duration: 1, duration_unit: 'days', route: 'oral', instructions: '' }]);
  }

  function removeItem(idx) { if (items.length > 1) setItems(items.filter((_, i) => i !== idx)); }
  function updateItem(idx, field, value) { setItems(items.map((it, i) => i === idx ? { ...it, [field]: value } : it)); }

  function openAdd() {
    setForm({ patient_id: '', admission_id: '', type: 'in_hospital', notes: '' });
    setItems([{ medication_name: '', dosage: '', dosage_unit: 'mg', frequency: 1, frequency_unit: 'daily', duration: 1, duration_unit: 'days', route: 'oral', instructions: '' }]);
    setError(''); setModal('add');
  }

  async function openView(id) {
    try {
      const { data } = await api.get(`/prescriptions/${id}`);
      setViewData(data.data); setModal('view');
    } catch (err) { console.error(err); }
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError('');
    try {
      await api.post('/prescriptions', { ...form, doctor_id: user?.id, items });
      setSuccess('Prescription created successfully!');
      setModal(null); fetchPrescriptions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to create prescription.'); }
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
      <div style="margin-top:60px;width:300px;border-top:1px solid #000;text-align:center;padding-top:8px">Doctor's Signature</div>
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
        <div className="doc-section-header">
          <h3><FileSignature size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />Prescription Management</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ padding: '10px 12px 10px 36px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', width: 200 }} />
            </div>
            <button className="action-btn primary" onClick={openAdd}><Plus size={16} /> Create Prescription</button>
          </div>
        </div>

        <div className="id-table-container">
          <table className="id-table">
            <thead><tr><th>Patient</th><th>Type</th><th>Items</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 32 }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No prescriptions found</td></tr>
              ) : filtered.map(rx => (
                <tr key={rx.id}>
                  <td><strong>{rx.patient?.first_name} {rx.patient?.last_name}</strong></td>
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
              <h3 style={{ margin: 0 }}>Create Prescription</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '60vh', overflowY: 'auto' }}>
                {error && <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: 8, fontSize: '0.85rem' }}>{error}</div>}
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div><label style={lbl}>Patient *</label>
                    <select style={inp} value={form.patient_id} onChange={e => onPatientChange(e.target.value)} required>
                      <option value="">Select Patient</option>
                      {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                    </select></div>
                  <div><label style={lbl}>Type</label>
                    <select style={inp} value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                      <option value="in_hospital">In Hospital</option><option value="discharge">Discharge</option>
                    </select></div>
                </div>
                
                <div><label style={lbl}>Notes / Clinical Impression</label>
                  <input style={inp} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Optional notes..." /></div>

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
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #f1f5f9' }}>
                <button type="button" className="action-btn outline" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="action-btn primary">Save Prescription</button>
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
                <p><strong>Type:</strong> {viewData.type?.replace('_',' ')}</p>
                <p><strong>Status:</strong> <span className={`badge ${viewData.status}`}>{viewData.status}</span></p>
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
