import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Receipt, Printer, Eye, X, DollarSign, FileText } from 'lucide-react';

export default function BillingExpenses() {
  const [bills, setBills] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [genAdmissionId, setGenAdmissionId] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function fetchBills() {
    try {
      const { data } = await api.get('/billing');
      setBills(data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function fetchAdmissions() {
    try {
      const { data } = await api.get('/admissions');
      setAdmissions(data.data);
    } catch (err) { console.error(err); }
  }

  useEffect(() => { fetchBills(); fetchAdmissions(); }, []);

  async function handleGenerate(e) {
    e.preventDefault(); setError('');
    try {
      const { data } = await api.post('/billing/generate', { admission_id: genAdmissionId });
      setSuccess('Bill generated successfully!');
      setModal(null); fetchBills();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.message || 'Failed to generate bill.'); }
  }

  async function openView(id) {
    try {
      const { data } = await api.get(`/billing/${id}`);
      setViewData(data.data); setModal('view');
    } catch (err) { console.error(err); }
  }

  async function updateStatus(id, status) {
    try {
      await api.patch(`/billing/${id}/status`, { status });
      setSuccess(`Bill marked as ${status}!`);
      fetchBills();
      if (viewData && viewData.id === id) {
        const { data } = await api.get(`/billing/${id}`);
        setViewData(data.data);
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { console.error(err); }
  }

  function handlePrint(bill) {
    const printWin = window.open('', '_blank');
    const itemsHtml = (bill.items || []).map((it, i) => `
      <tr><td>${i + 1}</td><td>${it.description}</td><td>${it.item_type?.replace('_', ' ')}</td>
      <td>${it.quantity}</td><td>₱${Number(it.unit_price).toFixed(2)}</td><td>₱${Number(it.total_price).toFixed(2)}</td></tr>
    `).join('');
    printWin.document.write(`<html><head><title>Bill #${bill.id}</title>
      <style>body{font-family:Arial;padding:40px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}.total{font-size:1.2em;font-weight:bold;text-align:right;margin-top:20px}</style></head>
      <body><h2>PMed-Aid Billing Summary</h2>
      <p><strong>Patient:</strong> ${bill.patient?.first_name} ${bill.patient?.last_name}</p>
      <p><strong>Status:</strong> ${bill.status}</p>
      <p><strong>Date:</strong> ${new Date(bill.created_at || bill.createdAt).toLocaleDateString()}</p>
      <table><thead><tr><th>#</th><th>Description</th><th>Type</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead><tbody>${itemsHtml}</tbody></table>
      <p class="total">Total Amount: ₱${Number(bill.total_amount).toFixed(2)}</p>
      </body></html>`);
    printWin.document.close();
    printWin.print();
  }

  const filtered = bills.filter(b => {
    if (!search) return true;
    const name = `${b.patient?.first_name} ${b.patient?.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <>
      {success && <div style={{ padding: '12px 16px', background: '#dcfce7', color: '#166534', borderRadius: 8, marginBottom: 16, fontWeight: 600 }}>{success}</div>}

      <div className="id-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}><Receipt size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />Billing & Expenses</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input placeholder="Search patient..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ padding: '10px 12px 10px 36px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', width: 200 }} />
            </div>
            <button className="action-btn primary" onClick={() => { setGenAdmissionId(''); setError(''); setModal('generate'); }}>
              <DollarSign size={16} /> Generate Bill
            </button>
          </div>
        </div>

        <div className="id-table-container">
          <table className="id-table">
            <thead><tr><th>Patient</th><th>Admission</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 32 }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No bills found. Generate one for an admission.</td></tr>
              ) : filtered.map(b => (
                <tr key={b.id}>
                  <td><strong>{b.patient?.first_name} {b.patient?.last_name}</strong></td>
                  <td>#{b.admission_id}</td>
                  <td style={{ fontWeight: 700 }}>₱{Number(b.total_amount).toFixed(2)}</td>
                  <td><span className={`badge ${b.status === 'paid' ? 'active' : b.status === 'unpaid' ? 'pending' : 'inactive'}`}>{b.status}</span></td>
                  <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{new Date(b.created_at || b.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="action-btn outline" onClick={() => openView(b.id)}><Eye size={14} /></button>
                      <button className="action-btn outline" onClick={() => handlePrint(b)}><Printer size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Bill Modal */}
      {modal === 'generate' && (
        <div style={overlay} onClick={() => setModal(null)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ margin: 0 }}>Generate Bill for Admission</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleGenerate}>
              <div style={{ padding: 24 }}>
                {error && <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: 8, fontSize: '0.85rem', marginBottom: 16 }}>{error}</div>}
                <label style={lbl}>Select Admission *</label>
                <select style={inp} value={genAdmissionId} onChange={e => setGenAdmissionId(e.target.value)} required>
                  <option value="">Select an admission</option>
                  {admissions.map(a => (
                    <option key={a.id} value={a.id}>
                      #{a.id} — {a.patient?.first_name} {a.patient?.last_name} ({a.status}) — {new Date(a.admission_date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 8 }}>This will calculate room charges and medication costs automatically.</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #f1f5f9' }}>
                <button type="button" className="action-btn outline" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="action-btn primary">Generate Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Bill Modal */}
      {modal === 'view' && viewData && (
        <div style={overlay} onClick={() => setModal(null)}>
          <div style={{ ...modalBox, maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ margin: 0 }}>Bill #{viewData.id} Details</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="action-btn outline" onClick={() => handlePrint(viewData)}><Printer size={14} /> Print</button>
                <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
              </div>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <p><strong>Patient:</strong> {viewData.patient?.first_name} {viewData.patient?.last_name}</p>
                <p><strong>Status:</strong> <span className={`badge ${viewData.status === 'paid' ? 'active' : 'pending'}`}>{viewData.status}</span></p>
              </div>

              <h4 style={{ margin: '0 0 12px 0' }}>Charges</h4>
              {viewData.items?.length > 0 ? viewData.items.map((it, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: '#f8fafc', borderRadius: 8, marginBottom: 8, border: '1px solid #e2e8f0' }}>
                  <div>
                    <strong>{it.description}</strong>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{it.item_type?.replace('_', ' ')} — Qty: {it.quantity} × ₱{Number(it.unit_price).toFixed(2)}</p>
                  </div>
                  <span style={{ fontWeight: 700 }}>₱{Number(it.total_price).toFixed(2)}</span>
                </div>
              )) : <p style={{ color: '#94a3b8' }}>No line items. Room and medication prices may need to be configured.</p>}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#0f172a', color: '#fff', borderRadius: 12, marginTop: 20 }}>
                <span style={{ fontSize: '1rem', fontWeight: 600 }}>Total Amount</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>₱{Number(viewData.total_amount).toFixed(2)}</span>
              </div>

              {viewData.status !== 'paid' && (
                <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'flex-end' }}>
                  <button className="action-btn primary" onClick={() => updateStatus(viewData.id, 'paid')} style={{ background: '#16a34a' }}>Mark as Paid</button>
                  <button className="action-btn outline" onClick={() => updateStatus(viewData.id, 'partial')}>Partial Payment</button>
                </div>
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
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalBox = { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540, maxHeight: '90vh', overflow: 'auto' };
