import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';
import { Search, Plus, Printer, X, FileSignature, Eye, QrCode, ArrowLeft, Send, Stethoscope, Clock, User, Copy, Check, ExternalLink } from 'lucide-react';

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

export default function PrescriptionManagement() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [medications, setMedications] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [search, setSearch] = useState('');
  const [sortOption, setSortOption] = useState('recent-old');
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'add' | 'view' | 'handover' | null
  const [encodeStep, setEncodeStep] = useState(1); // 1: Form, 2: Review, 3: QR
  const [generatedQR, setGeneratedQR] = useState('');
  const [generatedQRImage, setGeneratedQRImage] = useState('');
  const [viewData, setViewData] = useState(null);
  const [encodingPrescriptionId, setEncodingPrescriptionId] = useState(null);
  const [form, setForm] = useState({ patient_id: '', admission_id: '', doctor_id: '', type: 'in_hospital', notes: '' });
  const [items, setItems] = useState([{ medication_name: '', dosage: '', dosage_unit: 'mg', frequency: 1, frequency_unit: 'daily', duration: '', route: 'oral', instructions: '', start_time: '', interval_hours: '24' }]);
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

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
    if (location.state?.filter === 'recent') {
      setDateFilter('recent');
    } else {
      setDateFilter('');
    }

    if ((location.state?.viewConsultationId || location.state?.viewPatientId) && prescriptions.length > 0) {
      const targetRx = prescriptions.find(rx =>
        (location.state.viewConsultationId && String(rx.consultation_id) === String(location.state.viewConsultationId)) ||
        (location.state.viewPatientId && String(rx.patient_id) === String(location.state.viewPatientId))
      );
      if (targetRx) {
        api.get(`/prescriptions/${targetRx.id}`).then(({ data: rxData }) => {
          setViewData(rxData.data);
          setModal('view');
          window.history.replaceState({}, document.title);
        });
      }
    }

    if (location.state?.viewPrescriptionId) {
      api.get(`/prescriptions/${location.state.viewPrescriptionId}`).then(({ data: rxData }) => {
        setViewData(rxData.data);
        setModal('view');
        window.history.replaceState({}, document.title);
      });
    }

  }, [location.state, prescriptions]);

  function addItem() {
    setItems([...items, { medication_name: '', dosage: '', dosage_unit: 'mg', frequency: 1, frequency_unit: 'daily', duration: '', route: 'oral', instructions: '', start_time: '', interval_hours: '24' }]);
  }

  function removeItem(idx) { if (items.length > 1) setItems(items.filter((_, i) => i !== idx)); }
  function updateItem(idx, field, value) {
    setItems(items.map((it, i) => {
      if (i !== idx) return it;
      let updates = { [field]: value };
      if (field === 'frequency' || field === 'frequency_unit') {
        const freq = field === 'frequency' ? parseFloat(value) : parseFloat(it.frequency);
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
    setItems([{ medication_name: '', dosage: '', dosage_unit: 'mg', frequency: 1, frequency_unit: 'daily', duration: '', route: 'oral', instructions: '', start_time: '', interval_hours: '24' }]);
    setError('');
    setEncodeStep(1);
    setGeneratedQR('');
    setEncodingPrescriptionId(null);
    setModal('add');
  }

  function openEncodeForPending(rx) {
    setForm({ patient_id: rx.patient_id, admission_id: rx.admission_id, doctor_id: rx.doctor_id, type: rx.type, notes: rx.notes || '' });
    if (rx.items && rx.items.length > 0) {
      setItems(rx.items.map(it => {
        const freq = it.frequency || 1;
        const unit = it.frequency_unit || 'daily';
        let calculatedInterval = it.interval_hours;
        if (!calculatedInterval && unit === 'daily' && freq > 0) {
          calculatedInterval = (24 / freq).toString();
        }
        return {
          medication_name: it.medication_name || '',
          dosage: it.dosage ? it.dosage.split(' ')[0] : '',
          dosage_unit: it.dosage_unit || (it.dosage && it.dosage.split(' ')[1]) || 'mg',
          frequency: freq,
          frequency_unit: unit,
          duration: it.duration || '',
          route: it.route || 'oral',
          instructions: it.instructions || '',
          start_time: it.start_time || '',
          interval_hours: calculatedInterval ? String(calculatedInterval) : (unit === 'daily' ? '24' : '')
        };
      }));
    } else {
      setItems([{ medication_name: '', dosage: '', dosage_unit: 'mg', frequency: 1, frequency_unit: 'daily', duration: '', route: 'oral', instructions: '', start_time: '', interval_hours: '24' }]);
    }
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
        const cleanedItems = items.map(item => ({
          ...item,
          dosage: `${item.dosage} ${item.dosage_unit}`
        }));

        if (encodingPrescriptionId) {
          res = await api.post(`/prescriptions/${encodingPrescriptionId}/items`, { items: cleanedItems });
        } else {
          res = await api.post('/prescriptions', { ...form, items: cleanedItems });
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

  async function handlePrintOutpatient(rx) {
    try {
      const { data: qrRes } = await api.get(`/qr-codes/patient/${rx.patient_id}`);
      const qr = qrRes.data.find(q => String(q.prescription_id) === String(rx.id) && q.type === 'outpatient');

      const printWindow = window.open('', '', 'width=800,height=800');
      printWindow.document.write(`
        <html>
          <head>
            <title>Outpatient Prescription & QR</title>
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
                    <span class="rx-doc-value">${rx.patient?.first_name} ${rx.patient?.last_name}</span>
                  </div>
                  <div>
                    <span class="rx-doc-label">MRN</span>
                    <span class="rx-doc-value">MRN-${rx.patient_id.toString().padStart(5, '0')}</span>
                  </div>
                  <div>
                    <span class="rx-doc-label">Attending Physician</span>
                    <span class="rx-doc-value">${rx.doctor?.first_name || 'N/A'} ${rx.doctor?.last_name || ''}</span>
                  </div>
                  <div>
                    <span class="rx-doc-label">Date Issued</span>
                    <span class="rx-doc-value">
                      ${new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                    </span>
                  </div>
                </section>

                <section class="rx-doc-rx-section">
                  <h2 class="rx-doc-section-title">Outpatient Medications</h2>
                  ${rx.items && rx.items.length > 0 ? `
                    <table class="rx-doc-table">
                      <thead>
                        <tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Instructions</th></tr>
                      </thead>
                      <tbody>
                        ${rx.items.map(item => `
                          <tr>
                            <td class="rx-doc-med-name">${item.medication_name}</td>
                            <td>${item.dosage} ${item.dosage_unit}</td>
                            <td>${item.frequency}x ${item.frequency_unit}</td>
                            <td>${item.instructions || '-'}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  ` : '<p style="text-align: center; color: #5a6478; margin-bottom: 30px;">No medications prescribed.</p>'}
                </section>

                <section class="rx-doc-qr-section">
                  ${qr ? `<img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${qr.code}" class="rx-doc-qr-img" />` : '<p>No QR Code generated</p>'}
                  <p class="rx-doc-qr-caption">
                    Scan this code to link your records and view your prescriptions in the patient portal.
                  </p>
                  <p style="font-family: monospace; font-size: 10px; margin-top: 5px;">${qr ? qr.code : ''}</p>
                </section>

                <footer class="rx-doc-footer">
                  <div class="rx-doc-signature-line">
                    <span>${rx.doctor?.first_name || 'N/A'} ${rx.doctor?.last_name || ''}</span>
                    <span class="rx-doc-signature-label">Physician's Signature</span>
                  </div>
                </footer>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close(); printWindow.focus();
      setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
    } catch (err) {
      alert('Failed to print outpatient prescription.');
    }
  }

  async function handlePrintWristband(rx) {
    try {
      const { data: qrRes } = await api.get(`/qr-codes/patient/${rx.patient_id}`);
      let qr = qrRes.data.find(q => String(q.prescription_id) === String(rx.id) && q.type === 'in_hospital');

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
              <h2>${rx.patient?.first_name} ${rx.patient?.last_name}</h2>
              <p>Room: ${rx.admission?.room?.room_number || 'N/A'}</p>
              ${qr ? `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qr.code}" class="qr-img" />
              <p style="font-size: 0.7rem; margin-top: 5px;">${qr.code}</p>` : '<p>No QR Code generated</p>'}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close(); printWindow.focus();
      setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
    } catch (err) { alert('Failed to generate wristband QR.'); }
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

  const isVisible = (rx) => {
    if (rx.type === 'outpatient') return true;
    return rx.admission_id != null; // Inpatient prescriptions are only visible if admission is confirmed
  };

  const handovers = prescriptions.filter(rx => rx.status === 'pending_encoding' && isVisible(rx));
  const handoverCount = handovers.length;

  const filtered = prescriptions.filter(rx => {
    if (!isVisible(rx)) return false;

    // In specific tabs, show only active. In 'all', show everything except pending_encoding (unless you want pending_encoding too).
    // Let's show everything in 'all' since they asked for ALL records.
    if (activeTab !== 'all' && rx.status !== 'active') return false;

    if (activeTab === 'outpatient' && rx.type !== 'outpatient') return false;
    if (activeTab === 'inpatient' && rx.type === 'outpatient') return false;

    if (dateFilter === 'recent') {
      const createdDate = new Date(rx.created_at || rx.createdAt).getTime();
      const sevenDaysAgo = new Date().getTime() - (7 * 24 * 60 * 60 * 1000);
      if (createdDate < sevenDaysAgo) return false;
    }

    if (!search) return true;
    const name = `${rx.patient?.first_name} ${rx.patient?.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const outpatientCount = prescriptions.filter(rx => rx.status === 'active' && rx.type === 'outpatient' && isVisible(rx)).length;
  const inpatientCount = prescriptions.filter(rx => rx.status === 'active' && rx.type !== 'outpatient' && isVisible(rx)).length;
  const allCount = prescriptions.filter(rx => isVisible(rx)).length;

  const sortedAndFiltered = [...filtered].sort((a, b) => {
    const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
    const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
    const nameA = `${a.patient?.first_name || ''} ${a.patient?.last_name || ''}`.toLowerCase();
    const nameB = `${b.patient?.first_name || ''} ${b.patient?.last_name || ''}`.toLowerCase();
    const idA = a.id || 0;
    const idB = b.id || 0;

    switch (sortOption) {
      case 'old-recent': return dateA - dateB;
      case 'recent-old': return dateB - dateA;
      case 'a-z': return nameA.localeCompare(nameB);
      case 'z-a': return nameB.localeCompare(nameA);
      case 'id-asc': return idA - idB;
      case 'id-desc': return idB - idA;
      default: return dateB - dateA;
    }
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
              {viewData.type === 'outpatient' ? (
                <button className="action-btn" onClick={() => handlePrintOutpatient(viewData)} style={{ background: '#10b981', color: '#fff' }}>
                  Print Prescription / QR
                </button>
              ) : (
                <button className="action-btn outline" onClick={() => handlePrintWristband(viewData)} style={{ border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a' }}>
                  <QrCode size={16} /> Print QR Code
                </button>
              )}
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
                <div style={{ fontSize: '1.1rem', color: '#0f172a', fontWeight: 600 }}>{viewData.doctor?.first_name} {viewData.doctor?.last_name}</div>
                <div style={{ color: '#475569', fontSize: '0.9rem', marginTop: 4 }}>Status: {viewData.status === 'active' ? 'Active' : viewData.status} | Type: {viewData.type?.replace('_', ' ')}</div>
              </div>
              {viewData.type !== 'outpatient' && viewData.admission_id && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Assigned Nurse</div>
                  <select
                    className="id-input"
                    style={{ width: '100%', padding: '6px 12px', fontSize: '0.95rem' }}
                    value={viewData.admission?.assigned_nurse_id || ''}
                    onChange={(e) => {
                      const newNurseId = e.target.value;
                      setViewData({ ...viewData, admission: { ...viewData.admission, assigned_nurse_id: newNurseId } });
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
              )}
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
                      <td style={{ padding: '16px 8px', color: '#334155' }}>{it.dosage}</td>
                      <td style={{ padding: '16px 8px', color: '#334155' }}>{it.frequency}x {it.frequency_unit}</td>
                      <td style={{ padding: '16px 8px', color: '#334155' }}>{it.start_time ? `${it.start_time.slice(0, 5)}` : 'Auto'} {it.interval_hours ? ` (q${it.interval_hours}h)` : ''}</td>
                      <td style={{ padding: '16px 8px', color: '#334155' }}>{it.duration}</td>
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
                              Prescribed by {rx.doctor?.first_name} {rx.doctor?.last_name}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileSignature size={20} style={{ color: '#3b82f6' }} />
            Prescription Management
          </h3>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', flex: '1 1 480px', justifyContent: 'flex-end' }}>
            {dateFilter === 'recent' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f0fdf4', color: '#22c55e', padding: '8px 14px', borderRadius: 8, fontSize: '0.88rem', fontWeight: 600, minHeight: 42 }}>
                Showing Last 7 Days
                <button onClick={() => setDateFilter('')} style={{ background: 'transparent', border: 'none', color: '#22c55e', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={14} /></button>
              </div>
            )}
            <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 150 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                placeholder="Search prescriptions..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ padding: '10px 14px 10px 38px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.92rem', width: '100%', minHeight: 42, boxSizing: 'border-box', background: '#fff' }}
              />
            </div>
            <select
              value={sortOption}
              onChange={e => setSortOption(e.target.value)}
              style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.92rem', outline: 'none', background: '#fff', color: '#0f172a', minHeight: 42, flex: '1 1 170px', minWidth: 150, cursor: 'pointer' }}
            >
              <option value="recent-old">Sort by: Newest First</option>
              <option value="old-recent">Sort by: Oldest First</option>
              <option value="a-z">Sort by: Patient (A-Z)</option>
              <option value="z-a">Sort by: Patient (Z-A)</option>
              <option value="id-asc">Sort by: ID (Low to High)</option>
              <option value="id-desc">Sort by: ID (High to Low)</option>
            </select>
            <button
              className="action-btn primary"
              onClick={() => setModal('handover')}
              style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Send size={16} /> Handover ({handoverCount})
              {handoverCount > 0 && (
                <span style={{
                  position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%',
                  background: '#ef4444', color: '#fff', fontSize: '0.72rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(239,68,68,0.4)'
                }}>{handoverCount}</span>
              )}
            </button>
          </div>
        </div>

        <div className="id-tabs-row">
          <button
            onClick={() => setActiveTab('all')}
            className={`id-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          >
            All ({allCount})
          </button>
          <button
            onClick={() => setActiveTab('outpatient')}
            className={`id-tab-btn ${activeTab === 'outpatient' ? 'active' : ''}`}
          >
            Outpatient ({outpatientCount})
          </button>
          <button
            onClick={() => setActiveTab('inpatient')}
            className={`id-tab-btn ${activeTab === 'inpatient' ? 'active' : ''}`}
          >
            Admitted ({inpatientCount})
          </button>
        </div>

        <div className="id-table-container">
          <table className="id-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Type</th>
                <th>Items</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>Loading prescriptions...</td></tr>
              ) : sortedAndFiltered.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: 0 }}>
                    <div className="id-empty-state">
                      <div className="id-empty-icon-wrap">
                        <FileSignature size={28} />
                      </div>
                      <h4 className="id-empty-title">
                        {search || dateFilter || activeTab !== 'all' ? 'No Matching Prescriptions' : 'No Prescriptions Recorded'}
                      </h4>
                      <p className="id-empty-subtitle">
                        {search || dateFilter || activeTab !== 'all'
                          ? 'No prescription records match your current search query or active filters. Try resetting the filters.'
                          : 'Prescriptions issued by physicians will appear here for outpatient dispensing and inpatient encoding.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : sortedAndFiltered.map(rx => (
                <tr key={rx.id}>
                  <td><strong>{rx.patient?.first_name} {rx.patient?.last_name}</strong></td>
                  <td>{rx.doctor?.first_name} {rx.doctor?.last_name}</td>
                  <td><span className={`badge ${rx.type === 'discharge' ? 'discharged' : 'active'}`}>{rx.type?.replace('_', ' ')}</span></td>
                  <td>{rx.items?.length || 0} items</td>
                  <td><span className={`badge ${rx.status === 'pending_encoding' ? 'pending' : rx.status}`}>{rx.status === 'pending_encoding' ? 'Pending Encoding' : rx.status}</span></td>
                  <td style={{ fontSize: '0.88rem', color: '#64748b' }}>
                    {new Date(rx.created_at || rx.createdAt).toLocaleDateString()}
                    {rx.prescribed_time && <div>{rx.prescribed_time}</div>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {rx.status === 'pending_encoding' ? (
                        <button className="action-btn primary" onClick={() => openEncodeForPending(rx)} title="Encode Items" style={{ fontSize: '0.8rem', padding: '6px 12px', minHeight: 34 }}>
                          Encode Items
                        </button>
                      ) : (
                        <button className="action-btn outline" onClick={() => openView(rx.id)} title="View Record" style={{ minHeight: 34, padding: '6px 12px' }}>
                          <Eye size={14} style={{ marginRight: 6 }} /> View Record
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

      {/* Encode Modal */}
      {modal === 'add' && (
        <div style={overlay} onClick={() => setModal(null)}>
          <div style={{ ...modalBox, maxWidth: 720 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ margin: 0, color: '#0f172a' }}>
                {encodeStep === 1 ? 'Step 1: Encode Prescription' :
                  encodeStep === 2 ? 'Step 2: Review Prescription' :
                    'Step 3: Generate QR Code'}
              </h3>
              <button type="button" onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            <form id="encode-prescription-form" onSubmit={handleSubmit}>
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '60vh', overflowY: 'auto' }}>
                {error && <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: 8, fontSize: '0.85rem' }}>{error}</div>}

                {encodeStep === 1 && (
                  <>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a' }}>Medication Items</h4>
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
                            <div style={{ gridColumn: 'span 2' }}>
                              <label style={lbl}>Dosage *</label>
                              <div style={{ display: 'flex' }}>
                                <input style={{ ...inp, borderRight: 'none', borderTopRightRadius: 0, borderBottomRightRadius: 0, flex: 1 }} value={it.dosage} onChange={e => updateItem(idx, 'dosage', e.target.value)} required placeholder="e.g. 500" />
                                <select style={{ ...inp, borderLeft: '1px solid #cbd5e1', borderTopLeftRadius: 0, borderBottomLeftRadius: 0, width: '80px', background: '#f8fafc' }} value={it.dosage_unit} onChange={e => updateItem(idx, 'dosage_unit', e.target.value)}>
                                  <option>mg</option><option>ml</option><option>g</option><option>mcg</option><option>IU</option>
                                </select>
                              </div>
                            </div>
                            <div><label style={lbl}>Frequency</label><input type="number" min="1" style={inp} value={it.frequency} onChange={e => updateItem(idx, 'frequency', e.target.value)} /></div>
                            <div><label style={lbl}>Freq Unit</label>
                              <select style={inp} value={it.frequency_unit} onChange={e => updateItem(idx, 'frequency_unit', e.target.value)}>
                                <option value="hourly">Hourly</option><option value="daily">Daily</option><option value="weekly">Weekly</option>
                              </select></div>
                            <div style={{ gridColumn: 'span 2' }}><label style={lbl}>Duration</label><input style={inp} value={it.duration} onChange={e => updateItem(idx, 'duration', e.target.value)} placeholder="e.g. 7 Days" /></div>
                            <div><label style={lbl}>Route</label>
                              <select style={inp} value={it.route} onChange={e => updateItem(idx, 'route', e.target.value)}>
                                <option>oral</option><option>IV</option><option>IM</option><option>SC</option><option>topical</option><option>inhalation</option>
                              </select></div>
                            <div><label style={lbl}>Start Time</label>
                              <input type="time" style={inp} value={it.start_time || ''} onChange={e => updateItem(idx, 'start_time', e.target.value)} /></div>
                            <div><label style={lbl}>Interval (hrs)</label>
                              <input type="number" step="0.5" style={inp} value={it.interval_hours || ''} onChange={e => updateItem(idx, 'interval_hours', e.target.value)} placeholder="e.g. 24" /></div>
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
                        <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{doctors.find(d => String(d.id) === String(form.doctor_id))?.last_name}</strong>
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
                            <div><span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: 2 }}>Dosage</span><strong style={{ color: '#1e293b' }}>{it.dosage}</strong></div>
                            <div><span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: 2 }}>Frequency</span><strong style={{ color: '#1e293b' }}>{it.frequency}x {it.frequency_unit}</strong></div>
                            <div><span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: 2 }}>Schedule</span><strong style={{ color: '#1e293b' }}>{it.start_time ? `${it.start_time.slice(0, 5)}` : 'Auto'} {it.interval_hours ? ` (q${it.interval_hours}h)` : ''}</strong></div>
                            <div><span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: 2 }}>Duration</span><strong style={{ color: '#1e293b' }}>{it.duration}</strong></div>
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
                      if (form.type === 'outpatient' || form.type === 'discharge') {
                        const pat = patients.find(p => String(p.id) === String(form.patient_id));
                        const doc = doctors.find(d => String(d.id) === String(form.doctor_id));
                        const pw = window.open('', '', 'width=800,height=800');
                        pw.document.write(`
                          <html>
                            <head>
                              <title>Outpatient Prescription & QR</title>
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
                                      <span class="rx-doc-value">${pat?.first_name} ${pat?.last_name}</span>
                                    </div>
                                    <div>
                                      <span class="rx-doc-label">MRN</span>
                                      <span class="rx-doc-value">MRN-${form.patient_id.toString().padStart(5, '0')}</span>
                                    </div>
                                    <div>
                                      <span class="rx-doc-label">Attending Physician</span>
                                      <span class="rx-doc-value">${doc?.first_name || 'N/A'} ${doc?.last_name || ''}</span>
                                    </div>
                                    <div>
                                      <span class="rx-doc-label">Date Issued</span>
                                      <span class="rx-doc-value">
                                        ${new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                                      </span>
                                    </div>
                                  </section>

                                  <section class="rx-doc-rx-section">
                                    <h2 class="rx-doc-section-title">${form.type === 'discharge' ? 'Discharge' : 'Outpatient'} Medications</h2>
                                    ${items && items.length > 0 ? `
                                      <table class="rx-doc-table">
                                        <thead>
                                          <tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Instructions</th></tr>
                                        </thead>
                                        <tbody>
                                          ${items.map(item => `
                                            <tr>
                                              <td class="rx-doc-med-name">${item.medication_name}</td>
                                              <td>${item.dosage} ${item.dosage_unit}</td>
                                              <td>${item.frequency}x ${item.frequency_unit}</td>
                                              <td>${item.instructions || '-'}</td>
                                            </tr>
                                          `).join('')}
                                        </tbody>
                                      </table>
                                    ` : '<p style="text-align: center; color: #5a6478; margin-bottom: 30px;">No medications prescribed.</p>'}
                                  </section>

                                  <section class="rx-doc-qr-section">
                                    ${generatedQRImage ? `<img src="${generatedQRImage}" class="rx-doc-qr-img" />` : '<p>No QR Code generated</p>'}
                                    <p class="rx-doc-qr-caption">
                                      Scan this code to link your records and view your prescriptions in the patient portal.
                                    </p>
                                    <p style="font-family: monospace; font-size: 10px; margin-top: 5px;">${generatedQR}</p>
                                  </section>

                                  <footer class="rx-doc-footer">
                                    <div class="rx-doc-signature-line">
                                      <span>${doc?.first_name || 'N/A'} ${doc?.last_name || ''}</span>
                                      <span class="rx-doc-signature-label">Physician's Signature</span>
                                    </div>
                                  </footer>
                                </div>
                              </div>
                              <script>setTimeout(function(){window.print()},300);</script>
                            </body>
                          </html>
                        `);
                        pw.document.close();
                      } else {
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
                      }
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
  const [copied, setCopied] = useState(false);

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

  const registrationUrl = `${window.location.origin}/register?code=${qrCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(registrationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: 32 }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 }}>Patient Portal QR Code & Account Binding</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32, padding: 24, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          <img src={qrImage} alt="Patient QR Code" style={{ width: 160, height: 160, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff' }} />
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 6, fontWeight: 500 }}>Scan with Phone Camera</div>
        </div>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
            Scan to Open Registration & Link Account
          </div>
          <div style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.5, marginBottom: 14 }}>
            Scanning this QR code with any smartphone camera automatically opens the patient portal sign-up form with Google One-Tap or Email registration to link their hospital records.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            <button
              type="button"
              onClick={handleCopyLink}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}
            >
              {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
              {copied ? 'Link Copied!' : 'Copy Portal Link'}
            </button>
            <a
              href={registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 6, background: '#0284c7', color: '#fff', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}
            >
              <ExternalLink size={14} /> Open Sign-Up Form
            </a>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', wordBreak: 'break-all', fontFamily: 'monospace' }}>Code: {qrCode}</div>
        </div>
      </div>
    </div>
  );
}
